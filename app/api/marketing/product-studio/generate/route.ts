import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { decrypt } from '@/lib/encryption'
import { getProductStudioTemplate } from '@/lib/marketing/product-studio-templates'
import { isSelfHostedImageAvailable, generateSelfHostedImage } from '@/lib/ai/self-hosted-image'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'

const MARKETPLACES = ['amazon', 'flipkart', 'myntra', 'shopify'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getPrompts(marketplace: string, templateSuffix?: string, brandSuffix?: string): { main: string; lifestyle: string; infographic: string } {
  const base = `Suitable for ${marketplace} marketplace listing. High quality, professional, high resolution.`
  const suffix = templateSuffix ? ` ${templateSuffix}` : ''
  const brand = brandSuffix ? ` ${brandSuffix}` : ''
  return {
    main: `Generate a single product listing image. The image must show ONLY the product from the uploaded image, placed on a pure white background (#FFFFFF). Product centered, no shadows or props. Clean, minimal. ${base}${suffix}${brand}`,
    lifestyle: `Generate a lifestyle product image. Use the product from the uploaded image and place it in a realistic, appealing lifestyle setting (e.g. on a table, in a room, or in use). Natural lighting, professional photography style. ${base}${suffix}${brand}`,
    infographic: `Generate an infographic-style product image. Use the product from the uploaded image. Add a clean layout with the product as the hero; include space for key features or dimensions. Minimal text placeholders, professional and clear. White or light background. ${base}${suffix}${brand}`,
  }
}

const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'

type GeminiImageResult = { image: string | null; reason?: string; status?: number }

async function callGeminiWithImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  textPrompt: string
): Promise<GeminiImageResult> {
  const response = await fetch(GEMINI_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
            { text: `Generate an image: ${textPrompt}` },
          ],
        },
      ],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errMsg = data.error?.message || data.message || `HTTP ${response.status}`
    console.error('Gemini product-studio error:', response.status, errMsg)
    const isQuota = response.status === 429 || /quota|rate|limit/i.test(String(errMsg))
    return {
      image: null,
      reason: isQuota ? 'quota' : 'api_error',
      status: response.status,
    }
  }

  const promptFeedback = data.promptFeedback
  if (promptFeedback?.blockReason) {
    console.warn('Gemini blockReason:', promptFeedback.blockReason)
    return { image: null, reason: 'blocked' }
  }
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'END_TURN') {
    console.warn('Gemini finishReason:', finishReason)
    return { image: null, reason: finishReason === 'SAFETY' ? 'safety' : 'rejected' }
  }

  const parts = candidate?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mt = part.inlineData.mimeType || 'image/png'
      return { image: `data:${mt};base64,${part.inlineData.data}` }
    }
  }
  return { image: null, reason: 'no_image' }
}

async function callGeminiTextOnly(apiKey: string, textPrompt: string): Promise<string | null> {
  const response = await fetch(GEMINI_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${textPrompt}` }] }],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mt = part.inlineData.mimeType || 'image/png'
      return `data:${mt};base64,${part.inlineData.data}`
    }
  }
  return null
}

async function describeProduct(apiKey: string, imageBase64: string, mimeType: string): Promise<string> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
            { text: 'Describe this product in one short sentence for an e-commerce listing. Only output the description, no preamble.' },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 150 },
    }),
  })
  if (!response.ok) return ''
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text?.trim() || ''
  return text
}

// POST /api/marketing/product-studio/generate
export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const result = await requireModuleAccess(request, 'marketing')
    tenantId = result.tenantId
  } catch (licenseError) {
    return handleLicenseError(licenseError)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const marketplace = (formData.get('marketplace') as string) || 'amazon'
    const templateId = formData.get('templateId') as string | null
    const templateSuffix = templateId ? getProductStudioTemplate(templateId)?.promptSuffix : undefined
    const brandColor = formData.get('brandColor') as string | null
    const brandTagline = formData.get('brandTagline') as string | null
    const brandSuffix =
      brandColor?.trim() || brandTagline?.trim()
        ? [
            brandColor?.trim() && `Use brand color ${brandColor.trim()} where relevant.`,
            brandTagline?.trim() && `Incorporate tagline: "${brandTagline.trim()}" where it fits.`,
          ]
            .filter(Boolean)
            .join(' ')
        : undefined

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Missing or invalid file. Upload an image file.' },
        { status: 400 }
      )
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Validation error', message: 'File must be an image (e.g. PNG, JPEG).' },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Validation error', message: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }
    if (!MARKETPLACES.includes(marketplace as (typeof MARKETPLACES)[number])) {
      return NextResponse.json(
        { error: 'Validation error', message: `marketplace must be one of: ${MARKETPLACES.join(', ')}` },
        { status: 400 }
      )
    }

    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleAiStudioApiKey: true },
      })
    )

    let apiKey: string | null = null
    if (tenant?.googleAiStudioApiKey) {
      const raw = tenant.googleAiStudioApiKey
      const isEncrypted = raw.includes(':') && raw.split(':').length === 2
      if (isEncrypted) {
        if (!process.env.ENCRYPTION_KEY) {
          return NextResponse.json(
            { error: 'Encryption not configured', message: 'Server encryption key is not configured.' },
            { status: 500 }
          )
        }
        try {
          apiKey = decrypt(raw)
        } catch {
          return NextResponse.json(
            { error: 'API key decryption failed', message: 'Please remove and re-add your API key in Settings > AI Integrations.' },
            { status: 500 }
          )
        }
      } else {
        apiKey = raw
      }
    }

    const hasHuggingFace = Boolean(process.env.HUGGINGFACE_API_KEY)
    if (!apiKey && !isSelfHostedImageAvailable() && !hasHuggingFace) {
      return NextResponse.json(
        {
          error: 'Image generation not configured',
          message: 'Configure one of: self-hosted worker (IMAGE_WORKER_URL), Google AI Studio key (Settings > AI Integrations), or Hugging Face key (HUGGINGFACE_API_KEY).',
          hint: 'Zero cost: get a free key from https://huggingface.co/settings/tokens and set HUGGINGFACE_API_KEY in your server env.',
        },
        { status: 403 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const imageBase64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'

    const prompts = getPrompts(marketplace, templateSuffix, brandSuffix)

    // Prefer self-hosted image worker when configured (no Google quota or key required for images)
    if (isSelfHostedImageAvailable()) {
      const description = apiKey
        ? await describeProduct(apiKey, imageBase64, mimeType)
        : ''
      const desc = description ? ` Product: ${description}.` : ' Product.'
      const mainRes = await generateSelfHostedImage({
        prompt: prompts.main + desc,
        style: 'realistic',
        size: '1024x1024',
      })
      const lifestyleRes = await generateSelfHostedImage({
        prompt: prompts.lifestyle + desc,
        style: 'realistic',
        size: '1024x1024',
      })
      const infographicRes = await generateSelfHostedImage({
        prompt: prompts.infographic + desc,
        style: 'realistic',
        size: '1024x1024',
      })
      if (mainRes?.imageUrl && lifestyleRes?.imageUrl && infographicRes?.imageUrl) {
        console.log('✅ Product Studio: images from self-hosted worker')
        return NextResponse.json({
          main: mainRes.imageUrl,
          lifestyle: lifestyleRes.imageUrl,
          infographic: infographicRes.imageUrl,
          marketplace,
        })
      }
    }

    let main: string | null = null
    let lifestyle: string | null = null
    let infographic: string | null = null

    if (apiKey) {
      const withRetry = async (
        fn: () => Promise<GeminiImageResult>
      ): Promise<string | null> => {
        let r = await fn()
        if (r.image) return r.image
        r = await fn()
        return r.image
      }
      main = (await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.main))) ?? null
      lifestyle = (await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.lifestyle))) ?? null
      infographic = (await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.infographic))) ?? null
      if (!main || !lifestyle || !infographic) {
        const description = await describeProduct(apiKey, imageBase64, mimeType)
        const desc = description ? ` Product: ${description}.` : ''
        if (!main) main = await callGeminiTextOnly(apiKey, prompts.main + desc)
        if (!lifestyle) lifestyle = await callGeminiTextOnly(apiKey, prompts.lifestyle + desc)
        if (!infographic) infographic = await callGeminiTextOnly(apiKey, prompts.infographic + desc)
      }
    }

    if ((!main || !lifestyle || !infographic) && hasHuggingFace) {
      const hf = getHuggingFaceClient()
      const desc = ' Product. High quality, professional.'
      try {
        if (!main) {
          const r = await hf.textToImage({ prompt: prompts.main + desc, style: 'realistic', size: '1024x1024' })
          main = r.image_url
        }
        if (!lifestyle) {
          const r = await hf.textToImage({ prompt: prompts.lifestyle + desc, style: 'realistic', size: '1024x1024' })
          lifestyle = r.image_url
        }
        if (!infographic) {
          const r = await hf.textToImage({ prompt: prompts.infographic + desc, style: 'realistic', size: '1024x1024' })
          infographic = r.image_url
        }
      } catch (e) {
        console.warn('Product Studio Hugging Face fallback error:', e)
      }
    }

    if (!main || !lifestyle || !infographic) {
      const hintPhoto = 'Try a clearer product photo (good lighting, single product, minimal background).'
      const hintQuota = 'If using Google: check quota at https://aistudio.google.com. Zero cost: set HUGGINGFACE_API_KEY (free at https://huggingface.co/settings/tokens).'
      return NextResponse.json(
        {
          error: 'Generation failed',
          message: 'No image provider returned images. ' + hintPhoto + ' ' + hintQuota,
          hint: hintQuota,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      main: main || null,
      lifestyle: lifestyle || null,
      infographic: infographic || null,
      marketplace,
    })
  } catch (error) {
    console.error('Product Studio generate error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image set',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
