import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import {
  checkSelfHostedImageHealth,
  isSelfHostedImageAvailable,
} from '@/lib/ai/self-hosted-image'
import { getNanoBananaClient } from '@/lib/ai/nanobanana'
import { getImageProviderPlan } from '@/lib/ai/generation/provider-plan'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'

/**
 * GET /api/ai/image/status — non-secret readiness snapshot for image generation.
 * Requires ai-studio or marketing module (same family as generate-image).
 */
export async function GET(request: NextRequest) {
  try {
    let tenantId: string
    try {
      const access = await requireModuleAccess(request, 'ai-studio')
      tenantId = access.tenantId
    } catch (accessError) {
      if (accessError && typeof accessError === 'object' && 'moduleId' in accessError) {
        const fallback = await requireModuleAccess(request, 'marketing')
        tenantId = fallback.tenantId
      } else {
        throw accessError
      }
    }

    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleAiStudioApiKey: true },
      })
    )

    const selfHostedConfigured = isSelfHostedImageAvailable()
    let selfHostedHealthy = false
    if (selfHostedConfigured) {
      try {
        selfHostedHealthy = await checkSelfHostedImageHealth()
      } catch {
        selfHostedHealthy = false
      }
    }

    const huggingFace = Boolean(process.env.HUGGINGFACE_API_KEY)
    const nanoBanana = getNanoBananaClient().isAvailable()
    const googleAiStudioTenant = Boolean(tenant?.googleAiStudioApiKey)

    const capabilities = {
      selfHosted: selfHostedConfigured,
      googleAiStudio: googleAiStudioTenant,
      huggingFace,
      nanoBanana,
    }

    const autoPlan = getImageProviderPlan('auto', capabilities)

    return NextResponse.json({
      capabilities: {
        selfHostedConfigured,
        selfHostedHealthy,
        googleAiStudioTenantKey: googleAiStudioTenant,
        huggingFaceServerConfigured: huggingFace,
        nanoBananaConfigured: nanoBanana,
      },
      autoProviderOrder: autoPlan,
      reminders: [
        !selfHostedConfigured
          ? 'Set IMAGE_WORKER_URL (dashboard server env) to your PayAid text-to-image worker so Auto tries self-hosted first.'
          : !selfHostedHealthy
            ? 'IMAGE_WORKER_URL is set but GET /health did not return healthy within 8s (check URL, firewall, and worker logs).'
            : 'Self-hosted worker reports healthy.',
        !googleAiStudioTenant
          ? 'Tenant has no Google AI Studio key in Settings > AI Integrations (optional fallback).'
          : 'Tenant Google AI Studio key is present (fallback when in plan).',
        !huggingFace
          ? 'HUGGINGFACE_API_KEY is not set on the server (optional fallback).'
          : 'Hugging Face server key is set (optional fallback).',
      ],
    })
  } catch (error) {
    return handleLicenseError(error)
  }
}
