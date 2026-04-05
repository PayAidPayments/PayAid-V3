/**
 * Image generation: Hugging Face Inference (optional), self-hosted worker, or ComfyUI.
 */

import * as http from 'node:http'
import * as https from 'node:https'
import {
  getAiImageProvider,
  getA1111ApiKey,
  getA1111BaseUrl,
  getComfyUiBaseUrl,
  getHuggingFaceApiKey,
  getHuggingFaceImageModel,
  getImageWorkerUrl,
  isComfyUiEnabled,
} from './config'
import { runComfyTxt2Img } from './comfy'
import type { ImageGenMeta, MediaResult } from './types'

export interface GenerateImageParams {
  prompt: string
  mode?: 'txt2img' | 'img2img' | 'inpaint'
  style?: 'photo' | 'illustration'
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
  /** img2img strength 0–1 (passed to compatible workers only) */
  strength?: number
  sourceImageUrl?: string
  /** Required for inpaint mode. White area is commonly interpreted as editable mask. */
  maskImageUrl?: string
  /** Override default workflow path from env */
  workflowPath?: string
  /** Things to avoid (HF parameters + worker; appended for Comfy if not supported). */
  negativePrompt?: string
  /** Comma-separated colors or hex codes for brand-consistent accents. */
  brandColors?: string
  /** Logo URL as a textual hint (models do not fetch the URL). */
  brandLogoUrl?: string
}

function dimensionsForAspect(ratio: GenerateImageParams['aspectRatio']): { w: number; h: number } {
  switch (ratio) {
    case '4:5':
      // Extra-safe CPU portrait
      return { w: 512, h: 640 }
    case '9:16':
      // Extra-safe CPU story/reel
      return { w: 432, h: 768 }
    case '16:9':
      // Extra-safe CPU landscape
      return { w: 768, h: 432 }
    case '1:1':
    default:
      return { w: 512, h: 512 }
  }
}

/** SDXL-friendly sizes for Hugging Face (multiples of 8; max side ~1024). */
function hfDimensionsForAspect(ratio: GenerateImageParams['aspectRatio']): { w: number; h: number } {
  switch (ratio) {
    case '4:5':
      return { w: 896, h: 1120 }
    case '9:16':
      return { w: 576, h: 1024 }
    case '16:9':
      return { w: 1024, h: 576 }
    case '1:1':
    default:
      return { w: 1024, h: 1024 }
  }
}

/**
 * Marketing Studio builds a long blob (goal, audience, then visual). We only sent the first ~520 chars
 * to HF before — that was almost never the user's scene. Prefer the "What the image should show" section.
 */
function extractPrimaryVisualPromptForHf(full: string): string {
  const t = full.trim()
  const markers = [
    'What the image should show (visual description):',
    'What the image should show:',
  ] as const
  for (const m of markers) {
    const i = t.indexOf(m)
    if (i < 0) continue
    let rest = t.slice(i + m.length).trim()
    const boundary = /\n\n(?:Align with|Context:|Brand color|Primary channel|Image use)/i
    const m2 = rest.match(boundary)
    if (m2?.index != null) rest = rest.slice(0, m2.index).trim()
    else {
      const cut = rest.indexOf('\n\n')
      if (cut > 0) rest = rest.slice(0, cut).trim()
    }
    if (rest.length >= 3) {
      // Placeholder "infer from brief…" lines are not a real visual — use full creative blob for context.
      if (
        /infer (a single strong|a compelling|from the campaign|from placement|high-quality marketing visual matching)/i.test(
          rest
        )
      ) {
        return t.slice(0, 4000)
      }
      return rest
    }
  }
  return t.slice(0, 4000)
}

const HF_DEFAULT_NEGATIVE =
  'text, watermark, typography, logo, ui, user interface mockup, infographic, chart, diagram, collage, deformed, blurry, low quality, cropped, ugly, oversaturated, illegible text, gibberish text'
const HF_REALISTIC_STYLE_NEGATIVE =
  'illustration, cartoon, anime, painting, sketch, drawing, 3d render, cgi, comic, flat colors'

function shouldEnhanceImagePrompt(): boolean {
  const v = process.env.PAYAID_IMAGE_PROMPT_ENHANCE?.trim().toLowerCase()
  if (!v) return true
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no')
}

function looksLikeCheckoutPaymentIntent(raw: string): boolean {
  const s = (raw || '').toLowerCase()
  // Keep this broad: users type short prompts like "online payment image".
  return (
    /online payment|make(ing)? payment|checkout|pay now|payment page|card payment|credit card/.test(s) ||
    (s.includes('payment') && (s.includes('website') || s.includes('e-commerce') || s.includes('ecommerce') || s.includes('checkout')))
  )
}

/**
 * Make short user prompts more “model-composable” without requiring prompt-engineering.
 * This only kicks in for payment/checkout intent and photo mode.
 */
function enhancePromptAndNegatives(params: GenerateImageParams): {
  prompt: string
  negativePrompt?: string
} {
  if (!shouldEnhanceImagePrompt()) return { prompt: params.prompt, negativePrompt: params.negativePrompt }
  const style = params.style === 'illustration' ? 'illustration' : 'realistic'
  if (style !== 'realistic') return { prompt: params.prompt, negativePrompt: params.negativePrompt }
  if (!looksLikeCheckoutPaymentIntent(params.prompt)) return { prompt: params.prompt, negativePrompt: params.negativePrompt }

  // Keep the user prompt verbatim (first), then add composition constraints that solve common failure modes:
  // (1) portrait-only, (2) typing/keyboard instead of paying, (3) blank/washed monitor, (4) card near face.
  const prompt = [
    params.prompt.trim(),
    '',
    'Photo composition requirements (must follow):',
    '- 3/4 side view at a desktop computer, modern office, natural window light, shallow depth of field.',
    '- Left hand holding a credit card in front of the monitor; right hand on a mouse clicking.',
    '- Monitor shows a clearly visible e-commerce checkout layout (order summary panel + payment form blocks + pay button), but all text is intentionally blurred/unreadable.',
    '- Use a full-size standard desktop keyboard with complete key rows (realistic proportions).',
    '- High realism, authentic candid moment; no overlaid typography in the image.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 19000)

  const neg = [
    params.negativePrompt?.trim() || '',
    'typing on keyboard, hands on keyboard, credit card near face, thinking pose, portrait-only, blank screen, empty monitor, washed-out screen, no mouse, no credit card, toy keyboard, partial keyboard, malformed keyboard, legible text, watermark, infographic',
  ]
    .filter(Boolean)
    .join(', ')
    .slice(0, 2000)

  return { prompt, negativePrompt: neg || undefined }
}

async function generateViaImageWorker(params: GenerateImageParams): Promise<{
  result: MediaResult
  meta: ImageGenMeta
}> {
  const base = getImageWorkerUrl()
  if (!base) throw new Error('IMAGE_WORKER_URL / TEXT_TO_IMAGE_SERVICE_URL not set')

  const { w, h } = dimensionsForAspect(params.aspectRatio)
  const size = `${w}x${h}`

  // Avoid CLIP overflow and CPU OOM from very long prompts.
  const prompt = appendBrandHints(params, params.prompt.trim()).slice(0, 400)

  const body: Record<string, unknown> = {
    prompt,
    mode: params.mode ?? (params.maskImageUrl ? 'inpaint' : params.sourceImageUrl ? 'img2img' : 'txt2img'),
    style: params.style === 'illustration' ? 'illustration' : 'realistic',
    size,
    num_inference_steps: 12,
    guidance_scale: 6.0,
  }
  if (params.sourceImageUrl) body.source_image_url = params.sourceImageUrl
  if (params.maskImageUrl) body.mask_image_url = params.maskImageUrl
  if (params.strength != null) body.strength = params.strength
  const neg = [params.negativePrompt?.trim(), brandNegativeConstraints(params)]
    .filter(Boolean)
    .join(', ')
    .trim()
  if (neg) body.negative_prompt = neg.slice(0, 500)

  // CPU diffusion often needs 10–20+ minutes; override with IMAGE_WORKER_FETCH_TIMEOUT_MS (ms).
  // Default 15m — must stay below Marketing Studio client IMAGE_API_TIMEOUT_MS (buffer).
  const workerTimeoutMs = Math.max(
    60_000,
    Number.parseInt(process.env.IMAGE_WORKER_FETCH_TIMEOUT_MS ?? '', 10) || 900_000
  )
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), workerTimeoutMs)

  let response: Response
  try {
    response = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (e) {
    const aborted =
      (e instanceof Error && e.name === 'AbortError') ||
      (typeof e === 'object' &&
        e !== null &&
        'name' in e &&
        (e as { name?: string }).name === 'AbortError') ||
      (e instanceof Error && e.message.toLowerCase().includes('abort'))
    if (aborted) {
      const mins = Math.round(workerTimeoutMs / 60_000)
      throw new Error(
        `Image worker did not respond within ${mins} minutes (CPU inference limit). ` +
          `Increase IMAGE_WORKER_FETCH_TIMEOUT_MS in .env (milliseconds), reduce image size/steps on the worker, or run the worker on GPU.`
      )
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Image worker ${response.status}: ${err.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    image_url?: string
    revised_prompt?: string
    generation_time?: number
    width?: number
    height?: number
  }
  const url = data.image_url
  if (!url) throw new Error('Image worker returned no image_url')

  return {
    result: {
      url,
      width: data.width ?? w,
      height: data.height ?? h,
    },
    meta: {
      provider: 'image-worker',
      revisedPrompt: data.revised_prompt ?? params.prompt,
      generationTimeMs: data.generation_time != null ? data.generation_time * 1000 : undefined,
    },
  }
}

function appendBrandHints(params: GenerateImageParams, base: string): string {
  const parts = [base]
  const colors = params.brandColors?.trim()
  if (colors) {
    parts.push(
      `Strict brand palette: ${colors.slice(0, 200)}. Use these tones consistently for key accents and UI highlights; avoid unrelated accent colors.`
    )
  }
  const logo = params.brandLogoUrl?.trim()
  if (logo) {
    parts.push(
      `Brand logo reference: ${logo.slice(0, 240)}. If a logo is shown, keep it subtle and clean; avoid random brand names or gibberish text.`
    )
  }
  return parts.join(' ')
}

function brandNegativeConstraints(params: GenerateImageParams): string | null {
  const bits: string[] = []
  if (params.brandColors?.trim()) {
    bits.push('off-brand colors, random accent colors, unrelated color palette')
  }
  if (params.brandLogoUrl?.trim()) {
    bits.push('random brand names, gibberish logo text, unrelated logos, watermark logos')
  }
  return bits.length ? bits.join(', ') : null
}

async function generateViaHuggingFace(params: GenerateImageParams): Promise<{
  result: MediaResult
  meta: ImageGenMeta
}> {
  const apiKey = getHuggingFaceApiKey()
  if (!apiKey) {
    throw new Error(
      'HUGGINGFACE_API_KEY is not set. Add a token from https://huggingface.co/settings/tokens'
    )
  }

  const { w, h } = hfDimensionsForAspect(params.aspectRatio)
  const mode = params.mode ?? (params.maskImageUrl ? 'inpaint' : params.sourceImageUrl ? 'img2img' : 'txt2img')
  const model =
    mode === 'inpaint'
      ? process.env.HUGGINGFACE_INPAINT_MODEL?.trim() || 'runwayml/stable-diffusion-inpainting'
      : getHuggingFaceImageModel()
  const inferenceUrl = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`

  const primaryVisual = extractPrimaryVisualPromptForHf(params.prompt)
  const style = params.style === 'illustration' ? 'illustration' : 'realistic'
  const styleMap: Record<string, string> = {
    realistic:
      'ultra realistic photo, candid office scene, natural lighting, sharp focus, realistic human proportions, photographic skin texture, no overlaid text in frame',
    illustration: 'artistic illustration style, visually striking, clean composition, no fake typography',
  }
  let enhancedPrompt = `${primaryVisual}, ${styleMap[style] || styleMap.realistic}`
  enhancedPrompt = appendBrandHints(params, enhancedPrompt).slice(0, 3500)

  const guidance =
    Number.parseFloat(process.env.HUGGINGFACE_IMAGE_GUIDANCE_SCALE ?? '') ||
    (style === 'illustration' ? 7.0 : 8.0)
  const steps =
    Number.parseInt(process.env.HUGGINGFACE_IMAGE_NUM_INFERENCE_STEPS ?? '', 10) ||
    (style === 'illustration' ? 28 : 36)

  const parameters: Record<string, unknown> = {
    width: w,
    height: h,
    guidance_scale: guidance,
    num_inference_steps: Math.min(40, Math.max(15, steps)),
  }
  const neg = params.negativePrompt?.trim()
  const brandNeg = brandNegativeConstraints(params)
  parameters.negative_prompt = [
    neg,
    brandNeg,
    HF_DEFAULT_NEGATIVE,
    style === 'realistic' ? HF_REALISTIC_STYLE_NEGATIVE : null,
  ]
    .filter(Boolean)
    .join(', ')
    .slice(0, 1200)

  let requestBody: Record<string, unknown> = {
    inputs: enhancedPrompt,
    parameters,
  }

  if (mode === 'img2img' || mode === 'inpaint') {
    if (!params.sourceImageUrl) {
      throw new Error(`${mode} requires sourceImageUrl for Hugging Face.`)
    }
    const source = await fetchToBase64DataUrl(params.sourceImageUrl)
    const inputs: Record<string, unknown> = {
      prompt: enhancedPrompt,
      image: source.dataUrl,
    }
    if (mode === 'inpaint') {
      if (!params.maskImageUrl) throw new Error('inpaint requires maskImageUrl for Hugging Face.')
      const mask = await fetchToBase64DataUrl(params.maskImageUrl)
      inputs.mask_image = mask.dataUrl
    }
    requestBody = { inputs, parameters }
  }

  const hfTimeoutMs = Math.max(
    60_000,
    Number.parseInt(process.env.HUGGINGFACE_IMAGE_TIMEOUT_MS ?? '', 10) || 180_000
  )

  const doFetch = (signal: AbortSignal) =>
    fetch(inferenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), hfTimeoutMs)

  let response: Response
  try {
    response = await doFetch(controller.signal)
    // One automatic retry on cold-start 503 (common on free Inference)
    if (!response.ok && response.status === 503) {
      const errorText = await response.text().catch(() => '')
      let waitMs = 15_000
      try {
        const errorData = JSON.parse(errorText) as { estimated_time?: number }
        if (errorData.estimated_time && errorData.estimated_time > 0) {
          waitMs = Math.min(90_000, Math.ceil(errorData.estimated_time) * 1000)
        }
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, waitMs))
      response = await doFetch(controller.signal)
    }
  } catch (e) {
    const aborted =
      (e instanceof Error && e.name === 'AbortError') ||
      (e instanceof Error && e.message.toLowerCase().includes('abort'))
    if (aborted) {
      throw new Error(
        `Hugging Face image request timed out after ${Math.round(hfTimeoutMs / 1000)}s. Try again or set HUGGINGFACE_IMAGE_TIMEOUT_MS.`
      )
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    let errorData: { error?: unknown; estimated_time?: number } = {}
    try {
      errorData = JSON.parse(errorText) as { error?: unknown; estimated_time?: number }
    } catch {
      errorData = {}
    }
    if (response.status === 503 && errorData.estimated_time) {
      throw new Error(
        `Hugging Face model is loading; try again in ~${Math.ceil(errorData.estimated_time)}s.`
      )
    }
    if (response.status === 503) {
      throw new Error(
        'Hugging Face model is unavailable or loading (503). Wait a minute and retry.'
      )
    }
    if (response.status === 401) {
      throw new Error(
        [
          'Hugging Face authentication failed (401).',
          'Create a token at https://huggingface.co/settings/tokens (Read permission is enough for Inference).',
          'In the repo root .env or .env.local set: HUGGINGFACE_API_KEY=hf_... (no spaces around =; one line).',
          'Restart the dev server so Next.js picks up the variable.',
        ].join(' ')
      )
    }
    if (response.status === 403) {
      throw new Error(
        [
          'Hugging Face access denied (403).',
          'Open your image model on huggingface.co and click “Agree and access repository” if the model is gated.',
          'Confirm your token still has Read access. Then retry.',
        ].join(' ')
      )
    }
    if (response.status === 429) {
      throw new Error(
        'Hugging Face rate limit (429) — wait a few minutes or upgrade your plan at huggingface.co.'
      )
    }
    if (response.status === 404) {
      const model = getHuggingFaceImageModel()
      throw new Error(
        [
          `Hugging Face image error (404): model endpoint not found for "${model}".`,
          'Many repos (e.g. SDXL-Lightning LoRAs) are not served as text-to-image on Inference API.',
          'Set HUGGINGFACE_IMAGE_MODEL to a full pipeline model (e.g. stabilityai/stable-diffusion-xl-base-1.0 or black-forest-labs/FLUX.1-dev) and restart the server.',
          'See: huggingface.co/models?pipeline_tag=text-to-image&inference=warm',
        ].join(' ')
      )
    }
    const msg =
      typeof errorData.error === 'string'
        ? errorData.error
        : errorText?.slice(0, 300) || response.statusText
    throw new Error(`Hugging Face image error (${response.status}): ${msg}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const j = (await response.json()) as { image?: string; url?: string; [k: string]: unknown }
    const b64 = j.image || j.url
    if (typeof b64 === 'string' && b64.startsWith('data:')) {
      return {
        result: { url: b64, width: w, height: h },
        meta: { provider: 'huggingface', revisedPrompt: enhancedPrompt },
      }
    }
    throw new Error('Hugging Face returned JSON without an image payload.')
  }

  const imageData = await response.blob()
  const arrayBuffer = await imageData.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const imageFormat =
    contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpeg' : 'png'
  const url = `data:image/${imageFormat};base64,${base64}`

  return {
    result: { url, width: w, height: h },
    meta: { provider: 'huggingface', revisedPrompt: enhancedPrompt },
  }
}

async function generateViaComfyUi(params: GenerateImageParams): Promise<{
  result: MediaResult
  meta: ImageGenMeta
}> {
  if (!isComfyUiEnabled()) {
    throw new Error('ComfyUI is disabled (set USE_COMFYUI=true).')
  }
  const comfyBase = getComfyUiBaseUrl()
  const workflowPath =
    params.workflowPath?.trim() ||
    process.env.COMFYUI_TXT2IMG_WORKFLOW_PATH?.trim() ||
    ''

  if (!comfyBase || !workflowPath) {
    throw new Error('ComfyUI is not fully configured (COMFYUI_URL + COMFYUI_TXT2IMG_WORKFLOW_PATH).')
  }

  const { w, h } = dimensionsForAspect(params.aspectRatio)
  try {
    const { imageUrl } = await runComfyTxt2Img({
      workflowPath,
      prompt: params.prompt,
      width: w,
      height: h,
    })
    return {
      result: { url: imageUrl, width: w, height: h },
      meta: { provider: 'comfyui', revisedPrompt: params.prompt },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const missingCheckpoint =
      msg.includes('prompt_outputs_failed_validation') &&
      msg.includes('ckpt_name') &&
      msg.includes('not in []')
    if (missingCheckpoint) {
      throw new Error(
        'ComfyUI is running but no checkpoint model is installed. ' +
          'Copy a .safetensors model into /opt/comfyui/models/checkpoints and make sure workflow ckpt_name matches that filename.'
      )
    }
    const likelyCrashedOrOom =
      msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('econnrefused')
    if (likelyCrashedOrOom) {
      throw new Error(
        'ComfyUI became unavailable while processing the request (likely crashed/OOM). ' +
          'On this machine, SDXL checkpoints are too heavy for CPU RAM. ' +
          'Use a smaller checkpoint (~1.5-2.5GB) and update workflow ckpt_name, or use Hugging Face (HUGGINGFACE_API_KEY).'
      )
    }
    const timedOut = msg.toLowerCase().includes('timed out waiting for image output')
    if (timedOut) {
      throw new Error(
        'ComfyUI timed out before image finished. This machine is CPU-limited for SDXL. ' +
          'Try Hugging Face Inference (set HUGGINGFACE_API_KEY) or a simpler prompt.'
      )
    }
    throw new Error(
      `ComfyUI is configured but unreachable at ${comfyBase}. ` +
        `Start ComfyUI on that URL or use Hugging Face. Details: ${msg}`
    )
  }
}

function a1111SamplerForStyle(style: GenerateImageParams['style']): string {
  // Keep it simple and widely available across installs.
  // Users can control via A1111 UI / settings; we don't expose a giant matrix here.
  return style === 'illustration' ? 'Euler a' : 'DPM++ 2M Karras'
}

function getA1111SamplerOverride(): string | null {
  const v = process.env.A1111_SAMPLER?.trim()
  return v || null
}

function a1111StepsForStyle(style: GenerateImageParams['style']): number {
  // CPU-friendly defaults (A1111 on CPU can exceed several minutes at higher steps).
  return style === 'illustration' ? 18 : 20
}

function getA1111StepsOverride(): number | null {
  const raw = process.env.A1111_STEPS?.trim()
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const steps = Math.floor(n)
  if (steps < 1) return 1
  if (steps > 80) return 80
  return steps
}

function a1111CfgScaleForStyle(style: GenerateImageParams['style']): number {
  return style === 'illustration' ? 6.5 : 7.0
}

function getA1111CfgScaleOverride(): number | null {
  const raw = process.env.A1111_CFG_SCALE?.trim()
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  // Keep within common Stable Diffusion ranges.
  return Math.min(20, Math.max(1, n))
}

async function fetchToBase64DataUrl(url: string): Promise<{ mime: string; dataUrl: string }> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch sourceImageUrl (${resp.status})`)
  const ct = resp.headers.get('content-type') || 'application/octet-stream'
  const buf = Buffer.from(await resp.arrayBuffer())
  const b64 = buf.toString('base64')
  return { mime: ct, dataUrl: `data:${ct};base64,${b64}` }
}

async function postJsonWithTimeout(
  urlStr: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ status: number; text: string }> {
  const url = new URL(urlStr)
  const body = JSON.stringify(payload)
  const isHttps = url.protocol === 'https:'
  const transport = isHttps ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': String(Buffer.byteLength(body)),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        )
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
          })
        })
      }
    )

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`A1111 request timed out after ${Math.round(timeoutMs / 1000)}s`))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function generateViaA1111(params: GenerateImageParams): Promise<{
  result: MediaResult
  meta: ImageGenMeta
}> {
  const base = getA1111BaseUrl()
  if (!base) throw new Error('A1111_URL is not set')

  const { w, h } = dimensionsForAspect(params.aspectRatio)
  const style = params.style === 'illustration' ? 'illustration' : 'photo'

  // A1111 can take long prompts, but keep it bounded for safety.
  const prompt = appendBrandHints(params, params.prompt.trim()).slice(0, 8000)
  const negativePrompt = [params.negativePrompt?.trim(), brandNegativeConstraints(params)]
    .filter(Boolean)
    .join(', ')
    .slice(0, 2000)

  const steps = getA1111StepsOverride() ?? a1111StepsForStyle(params.style)
  const cfgScale = getA1111CfgScaleOverride() ?? a1111CfgScaleForStyle(params.style)
  const sampler = getA1111SamplerOverride() ?? a1111SamplerForStyle(params.style)

  const started = Date.now()
  const timeoutMs = Math.max(60_000, Number.parseInt(process.env.A1111_TIMEOUT_MS ?? '', 10) || 300_000)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = getA1111ApiKey()
  if (key) headers.Authorization = `Bearer ${key}`

  try {
    if (params.sourceImageUrl || params.mode === 'inpaint') {
      // img2img / inpaint
      if (!params.sourceImageUrl) throw new Error('img2img/inpaint requires sourceImageUrl for A1111.')
      const init = await fetchToBase64DataUrl(params.sourceImageUrl)
      const body: Record<string, unknown> = {
        prompt,
        negative_prompt: negativePrompt,
        width: w,
        height: h,
        steps,
        cfg_scale: cfgScale,
        sampler_name: sampler,
        denoising_strength: typeof params.strength === 'number' ? Math.min(1, Math.max(0, params.strength)) : 0.6,
        init_images: [init.dataUrl],
      }
      if (params.mode === 'inpaint') {
        if (!params.maskImageUrl) throw new Error('inpaint requires maskImageUrl for A1111.')
        const mask = await fetchToBase64DataUrl(params.maskImageUrl)
        body.mask = mask.dataUrl
        body.inpainting_fill = 1
        body.inpaint_full_res = true
      }

      const resp = await postJsonWithTimeout(`${base}/sdapi/v1/img2img`, body, headers, timeoutMs)
      if (resp.status < 200 || resp.status >= 300) {
        throw new Error(`A1111 img2img ${resp.status}: ${resp.text.slice(0, 300)}`)
      }
      const j = JSON.parse(resp.text || '{}') as { images?: string[] }
      const b64 = j.images?.[0]
      if (!b64) throw new Error('A1111 returned no images')
      const url = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`
      return {
        result: { url, width: w, height: h },
        meta: {
          provider: 'a1111',
          revisedPrompt: prompt,
          generationTimeMs: Date.now() - started,
        },
      }
    }

    // txt2img
    const body: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
      width: w,
      height: h,
      steps,
      cfg_scale: cfgScale,
      sampler_name: sampler,
    }

    // If A1111 has a model with a specific preferred style, hint it (soft).
    if (style === 'illustration') {
      body.styles = ['illustration']
    }

    const resp = await postJsonWithTimeout(`${base}/sdapi/v1/txt2img`, body, headers, timeoutMs)
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`A1111 txt2img ${resp.status}: ${resp.text.slice(0, 300)}`)
    }
    const j = JSON.parse(resp.text || '{}') as { images?: string[] }
    const b64 = j.images?.[0]
    if (!b64) throw new Error('A1111 returned no images')
    const url = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`
    return {
      result: { url, width: w, height: h },
      meta: {
        provider: 'a1111',
        revisedPrompt: prompt,
        generationTimeMs: Date.now() - started,
      },
    }
  } catch (e) {
    const aborted =
      (e instanceof Error && e.name === 'AbortError') ||
      (e instanceof Error && e.message.toLowerCase().includes('abort'))
    const timedOut = e instanceof Error && e.message.toLowerCase().includes('timed out')
    if (aborted || timedOut) {
      throw new Error(
        `A1111 request timed out after ${Math.round(timeoutMs / 1000)}s. Set A1111_TIMEOUT_MS or reduce steps/resolution.`
      )
    }
    throw e
  }
}

/**
 * Order (see AI_IMAGE_PROVIDER in config):
 * - auto: Hugging Face if HUGGINGFACE_API_KEY, else A1111, else worker, else ComfyUI
 * - huggingface | a1111 | worker | comfy: force that backend
 */
export async function generateImage(params: GenerateImageParams): Promise<{
  result: MediaResult
  meta: ImageGenMeta
}> {
  const enhanced = enhancePromptAndNegatives(params)
  const effectiveParams: GenerateImageParams = {
    ...params,
    mode: params.mode ?? (params.maskImageUrl ? 'inpaint' : params.sourceImageUrl ? 'img2img' : 'txt2img'),
    prompt: enhanced.prompt,
    negativePrompt: enhanced.negativePrompt,
  }
  const mode = getAiImageProvider()
  const comfyReady =
    isComfyUiEnabled() && getComfyUiBaseUrl() && process.env.COMFYUI_TXT2IMG_WORKFLOW_PATH?.trim()
  const workerReady = Boolean(getImageWorkerUrl())
  const a1111Ready = Boolean(getA1111BaseUrl())
  const hfReady = Boolean(getHuggingFaceApiKey())

  const tryHf = async () => generateViaHuggingFace(effectiveParams)
  const tryA1111 = async () => generateViaA1111(effectiveParams)
  const tryWorker = async () => generateViaImageWorker(effectiveParams)
  const tryComfy = async () => generateViaComfyUi(effectiveParams)

  if (mode === 'huggingface') {
    return tryHf()
  }
  if (mode === 'a1111') {
    return tryA1111()
  }
  if (mode === 'worker') {
    return tryWorker()
  }
  if (mode === 'comfy') {
    return tryComfy()
  }

  // auto
  if (hfReady) {
    try {
      return await tryHf()
    } catch (e) {
      console.warn('[payaid/ai] Hugging Face image failed, trying fallbacks:', e)
      if (a1111Ready) {
        try {
          return await tryA1111()
        } catch (ae) {
          console.warn('[payaid/ai] A1111 failed:', ae)
        }
      }
      if (workerReady) {
        try {
          return await tryWorker()
        } catch (we) {
          console.warn('[payaid/ai] Image worker failed:', we)
        }
      }
      if (comfyReady) {
        return await tryComfy()
      }
      throw e
    }
  }

  if (a1111Ready) {
    return tryA1111()
  }

  if (workerReady) {
    return tryWorker()
  }

  if (comfyReady) {
    return tryComfy()
  }

  throw new Error(
    'No image backend configured. Set HUGGINGFACE_API_KEY (Hugging Face Inference), or A1111_URL (Automatic1111), or IMAGE_WORKER_URL (self-hosted), or USE_COMFYUI=true with COMFYUI_URL + COMFYUI_TXT2IMG_WORKFLOW_PATH.'
  )
}

export function isImageGenerationConfigured(): boolean {
  const comfy = Boolean(
    isComfyUiEnabled() &&
      getComfyUiBaseUrl() &&
      process.env.COMFYUI_TXT2IMG_WORKFLOW_PATH?.trim()
  )
  const worker = Boolean(getImageWorkerUrl())
  const a1111 = Boolean(getA1111BaseUrl())
  const hf = Boolean(getHuggingFaceApiKey())
  return comfy || worker || a1111 || hf
}
