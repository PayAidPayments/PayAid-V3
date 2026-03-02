import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { decrypt } from '@/lib/encryption'
import { getProductStudioTemplate } from '@/lib/marketing/product-studio-templates'

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

async function callGeminiWithImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  textPrompt: string
): Promise<string | null> {
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
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('Gemini product-studio error:', response.status, err)
    return null
  }

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

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Google AI Studio not configured',
          message: 'Google AI Studio API key is not configured. Add your key in Settings > AI Integrations to use Product Studio.',
          hint: 'Get your free API key from https://aistudio.google.com/app/apikey',
        },
        { status: 403 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const imageBase64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'

    const prompts = getPrompts(marketplace, templateSuffix, brandSuffix)

    const withRetry = async (
      fn: () => Promise<string | null>
    ): Promise<string | null> => {
      let r = await fn()
      if (r) return r
      r = await fn()
      return r
    }

    let main = await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.main))
    let lifestyle = await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.lifestyle))
    let infographic = await withRetry(() => callGeminiWithImage(apiKey, imageBase64, mimeType, prompts.infographic))

    if (!main || !lifestyle || !infographic) {
      const description = await describeProduct(apiKey, imageBase64, mimeType)
      const desc = description ? ` Product: ${description}.` : ''
      if (!main) main = await callGeminiTextOnly(apiKey, prompts.main + desc)
      if (!lifestyle) lifestyle = await callGeminiTextOnly(apiKey, prompts.lifestyle + desc)
      if (!infographic) infographic = await callGeminiTextOnly(apiKey, prompts.infographic + desc)
    }

    if (!main && !lifestyle && !infographic) {
      return NextResponse.json(
        {
          error: 'Generation failed',
          message: 'Google AI Studio did not return images. The model may not support image editing with your input. Try a different photo or check your API quota.',
          hint: 'Ensure your Google AI Studio key has access to Gemini 2.5 Flash Image and has quota remaining.',
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
