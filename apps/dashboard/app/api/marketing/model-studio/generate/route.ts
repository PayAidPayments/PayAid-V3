import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { decrypt } from '@/lib/encryption'

const POSES = ['auto', 'standing', 'walking', 'seated'] as const
const BACKGROUNDS = ['studio', 'outdoor', 'lifestyle', 'white'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function buildPrompt(pose: string, background: string): string {
  const poseDesc = pose === 'auto' ? 'natural standing pose' : pose
  const bgDesc =
    background === 'studio'
      ? 'neutral studio backdrop, soft lighting'
      : background === 'outdoor'
      ? 'outdoor setting, natural light'
      : background === 'lifestyle'
      ? 'lifestyle setting, realistic environment'
      : 'pure white background'
  return `Generate a single professional on-model fashion photograph. The garment shown in the uploaded image must be worn by a model. Indian model, ${poseDesc}, ${bgDesc}. Myntra-ready framing, white-space balance, high quality, realistic lighting, fashion photography. One output image only.`
}

async function callGeminiWithImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  textPrompt: string
): Promise<string | null> {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: imageBase64,
              },
            },
            {
              text: `Generate an image: ${textPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('Gemini model-studio error:', response.status, err)
    return null
  }

  const data = await response.json()
  const candidates = data.candidates || []
  if (candidates.length === 0) return null
  const parts = candidates[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mt = part.inlineData.mimeType || 'image/png'
      return `data:${mt};base64,${part.inlineData.data}`
    }
  }
  return null
}

// POST /api/marketing/model-studio/generate
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
    const pose = (formData.get('pose') as string) || 'auto'
    const background = (formData.get('background') as string) || 'studio'

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
    if (!POSES.includes(pose as (typeof POSES)[number])) {
      return NextResponse.json(
        { error: 'Validation error', message: `pose must be one of: ${POSES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!BACKGROUNDS.includes(background as (typeof BACKGROUNDS)[number])) {
      return NextResponse.json(
        { error: 'Validation error', message: `background must be one of: ${BACKGROUNDS.join(', ')}` },
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
          message: 'Google AI Studio API key is not configured. Add your key in Settings > AI Integrations to use Model Studio.',
          hint: 'Get your free API key from https://aistudio.google.com/app/apikey',
        },
        { status: 403 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const imageBase64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'
    const prompt = buildPrompt(pose, background)

    let imageUrl = await callGeminiWithImage(apiKey, imageBase64, mimeType, prompt)
    if (!imageUrl) {
      imageUrl = await callGeminiWithImage(apiKey, imageBase64, mimeType, prompt)
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Generation failed',
          message: 'Google AI Studio did not return an image. Try a different garment photo or check your API quota.',
          hint: 'Ensure your Google AI Studio key has access to Gemini 2.5 Flash Image and has quota remaining.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      imageUrl,
      pose,
      background,
    })
  } catch (error) {
    console.error('Model Studio generate error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate on-model image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
