import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { decrypt } from '@/lib/encryption'

const PRESETS = ['hook-product', 'price-drop', 'benefit-cta', 'custom'] as const
const OVERLAY_STYLES = ['none', 'minimal', 'bold-cta', 'price-badge', 'discount-sticker', 'trust-badge', 'countdown'] as const
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'

function overlayGuidance(overlay: string, ctaText?: string): string {
  if (!overlay || overlay === 'none') return ''
  const cta = ctaText?.trim() || 'Shop Now'
  switch (overlay) {
    case 'minimal':
      return ` Overlay: minimal text only, subtle and elegant, no heavy graphics.`
    case 'bold-cta':
      return ` Overlay: bold CTA button or bar (e.g. "${cta}") at bottom or corner, high contrast, clickable feel.`
    case 'price-badge':
      return ` Overlay: clear price badge or price tag, prominent but clean, e-commerce style.`
    case 'discount-sticker':
      return ` Overlay: discount sticker or "X% OFF" badge, corner or top, sale feel.`
    case 'trust-badge':
      return ` Overlay: trust element (e.g. "Free shipping", "Verified", "1M+ sold") subtle badge or text.`
    case 'countdown':
      return ` Overlay: countdown or "Limited time" element, urgency without clutter.`
    default:
      return ''
  }
}

function buildAdPrompt(
  preset: string,
  hook?: string,
  price?: string,
  customPrompt?: string,
  overlayStyle?: string,
  ctaText?: string,
  brandSuffix?: string
): string {
  if (preset === 'custom' && customPrompt) return customPrompt
  const hookText = hook?.trim() || 'Discover this product'
  const priceText = price?.trim() ? ` Show price or discount: ${price}.` : ''
  const overlay = overlayGuidance(overlayStyle || 'none', ctaText)
  const brand = brandSuffix ? ` ${brandSuffix}` : ''
  switch (preset) {
    case 'hook-product':
      return `Generate a single static ad image for social media. Eye-catching hook at the top: "${hookText}". Center: premium product shot on clean background. Professional, scroll-stopping, high quality. No body text except the hook.${priceText}${overlay}${brand}`
    case 'price-drop':
      return `Generate a single sale/discount ad image. Prominent price or discount badge. Headline: "${hookText}".${priceText}${overlay}${brand} Clean, bold, e-commerce style. High quality, professional.`
    case 'benefit-cta':
      return `Generate a single benefit-focused ad image. Main benefit or CTA: "${hookText}".${priceText}${overlay}${brand} Clean layout, trust-building, call-to-action feel. Professional, high quality.`
    default:
      return `Generate a single static ad image for social media. "${hookText}".${priceText}${overlay}${brand} Professional, scroll-stopping, high quality.`
  }
}

async function callGeminiTextOnly(apiKey: string, textPrompt: string): Promise<string | null> {
  const response = await fetch(GEMINI_IMAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
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

export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const result = await requireModuleAccess(request, 'marketing')
    tenantId = result.tenantId
  } catch (licenseError) {
    return handleLicenseError(licenseError)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const preset = (body.preset as string) || 'hook-product'
    const hook = body.hook as string | undefined
    const price = body.price as string | undefined
    const customPrompt = body.customPrompt as string | undefined
    const overlayStyle = (body.overlayStyle as string) || 'none'
    const ctaText = body.ctaText as string | undefined
    const brandColor = body.brandColor as string | undefined
    const brandTagline = body.brandTagline as string | undefined
    const brandSuffix =
      brandColor?.trim() || brandTagline?.trim()
        ? [
            brandColor?.trim() && `Use brand color ${brandColor.trim()} where relevant.`,
            brandTagline?.trim() && `Incorporate tagline: "${brandTagline.trim()}" where it fits.`,
          ]
            .filter(Boolean)
            .join(' ')
        : undefined

    if (!PRESETS.includes(preset as (typeof PRESETS)[number])) {
      return NextResponse.json(
        { error: 'Validation error', message: `preset must be one of: ${PRESETS.join(', ')}` },
        { status: 400 }
      )
    }
    if (preset === 'custom' && !customPrompt?.trim()) {
      return NextResponse.json(
        { error: 'Validation error', message: 'customPrompt is required when preset is custom.' },
        { status: 400 }
      )
    }
    if (overlayStyle && !OVERLAY_STYLES.includes(overlayStyle as (typeof OVERLAY_STYLES)[number])) {
      return NextResponse.json(
        { error: 'Validation error', message: `overlayStyle must be one of: ${OVERLAY_STYLES.join(', ')}` },
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
          message: 'Google AI Studio API key is not configured. Add your key in Settings > AI Integrations to use Image Ads.',
          hint: 'Get your free API key from https://aistudio.google.com/app/apikey',
        },
        { status: 403 }
      )
    }

    const prompt = buildAdPrompt(preset, hook, price, customPrompt, overlayStyle, ctaText, brandSuffix)
    let imageUrl = await callGeminiTextOnly(apiKey, prompt)
    if (!imageUrl) imageUrl = await callGeminiTextOnly(apiKey, prompt)

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Generation failed',
          message: 'Google AI Studio did not return an image. Try a different preset or check your API quota.',
          hint: 'Ensure your Google AI Studio key has access to Gemini 2.5 Flash Image.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ imageUrl, preset })
  } catch (error) {
    console.error('Image Ads generate error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate ad image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
