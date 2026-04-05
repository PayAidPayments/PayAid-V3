/**
 * Minimal ComfyUI HTTP client: submit /prompt, poll /history for image output.
 * Workflow JSON should use placeholders __PAYAID_PROMPT__, __WIDTH__, __HEIGHT__.
 */

import { readFileSync } from 'node:fs'
import { getComfyUiBaseUrl } from './config'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function loadWorkflowFromPath(path: string, replacements: Record<string, string>): object {
  let raw = readFileSync(path, 'utf8')
  for (const [k, v] of Object.entries(replacements)) {
    raw = raw.split(k).join(v)
  }
  return JSON.parse(raw) as object
}

function applyComfyOverrides(workflow: object): object {
  const wf = workflow as Record<string, any>
  const ckptOverride = process.env.COMFYUI_CKPT_NAME?.trim()
  const maxStepsEnv = process.env.COMFYUI_MAX_STEPS?.trim()
  const maxSteps = maxStepsEnv ? Number(maxStepsEnv) : undefined

  for (const node of Object.values(wf)) {
    if (!node || typeof node !== 'object') continue
    if (node.class_type === 'CheckpointLoaderSimple' && ckptOverride) {
      node.inputs = node.inputs || {}
      node.inputs.ckpt_name = ckptOverride
    }
    if (node.class_type === 'KSampler' && typeof maxSteps === 'number' && Number.isFinite(maxSteps) && maxSteps > 0) {
      node.inputs = node.inputs || {}
      node.inputs.steps = Math.max(1, Math.floor(maxSteps))
    }
  }
  return wf
}

function firstImageUrlFromHistory(
  baseUrl: string,
  entry: Record<string, unknown>
): string | null {
  const outputs = entry?.outputs as Record<string, { images?: Array<Record<string, string>> }> | undefined
  if (!outputs) return null
  for (const node of Object.values(outputs)) {
    const imgs = node?.images
    if (!imgs?.length) continue
    const { filename, subfolder, type } = imgs[0]
    if (!filename) continue
    const sub = subfolder ? `&subfolder=${encodeURIComponent(subfolder)}` : ''
    const t = type ? `&type=${encodeURIComponent(type)}` : '&type=output'
    return `${baseUrl}/view?filename=${encodeURIComponent(filename)}${sub}${t}`
  }
  return null
}

export interface ComfyGenerateOptions {
  /** Absolute or cwd-relative path to workflow JSON (API format) */
  workflowPath: string
  prompt: string
  width: number
  height: number
  clientId?: string
  pollTimeoutMs?: number
  pollIntervalMs?: number
}

export async function runComfyTxt2Img(opts: ComfyGenerateOptions): Promise<{ imageUrl: string }> {
  const baseUrl = getComfyUiBaseUrl()
  if (!baseUrl) throw new Error('COMFYUI_URL is not set')

  // We inject the prompt into a JSON workflow template. We must escape all control characters
  // that would otherwise break JSON parsing (e.g. newlines, tabs). JSON.stringify handles this.
  const escapedPrompt = JSON.stringify(opts.prompt).slice(1, -1)

  const workflow = loadWorkflowFromPath(opts.workflowPath, {
    __PAYAID_PROMPT__: escapedPrompt,
    __WIDTH__: String(opts.width),
    __HEIGHT__: String(opts.height),
  })
  const finalWorkflow = applyComfyOverrides(workflow)

  const clientId = opts.clientId ?? `payaid-${Date.now()}`
  const submit = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: finalWorkflow, client_id: clientId }),
  })

  if (!submit.ok) {
    const t = await submit.text().catch(() => submit.statusText)
    throw new Error(`ComfyUI /prompt failed: ${submit.status} ${t.slice(0, 300)}`)
  }

  const submitted = (await submit.json()) as { prompt_id?: string; error?: string }
  if (submitted.error) throw new Error(`ComfyUI: ${submitted.error}`)
  const promptId = submitted.prompt_id
  if (!promptId) throw new Error('ComfyUI did not return prompt_id')

  const timeout = opts.pollTimeoutMs ?? 180_000
  const interval = opts.pollIntervalMs ?? 2000
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const hAll = await fetch(`${baseUrl}/history?max_items=64`)
    if (hAll.ok) {
      const all = (await hAll.json()) as Record<string, Record<string, unknown>>
      const entry = all[promptId]
      if (entry) {
        const url = firstImageUrlFromHistory(baseUrl, entry)
        if (url) return { imageUrl: url }
      }
    }

    await sleep(interval)
  }

  throw new Error('ComfyUI: timed out waiting for image output')
}
