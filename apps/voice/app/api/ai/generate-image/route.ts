import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { imageGenerationRequestSchema } from '@/lib/ai/generation/contracts'
import { normalizeImageProvider } from '@/lib/ai/generation/provider-plan'
import { orchestrateImageGeneration } from '@/lib/ai/generation/image-orchestrator'
import { prisma } from '@payaid/db'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const validated = imageGenerationRequestSchema.parse(body)
    const provider = normalizeImageProvider(validated.provider)

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (token) aiGateway.setToken(token)

    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleAiStudioApiKey: true },
      })
    )

    const run = await orchestrateImageGeneration(
      {
        provider,
        authHeader,
        tenantHasGoogleAiStudio: Boolean(tenant?.googleAiStudioApiKey),
      },
      {
        prompt: validated.prompt,
        style: validated.style,
        size: validated.size,
      }
    )

    if (run.success) return NextResponse.json(run.success.payload)

    const plan = run.plan.join(' -> ') || 'none'
    const firstFailure = run.failures[0]
    return NextResponse.json(
      {
        error: 'Image generation service not configured',
        message:
          firstFailure?.error ||
          `Image generation failed for all providers in plan: ${plan}.`,
        hint:
          firstFailure?.hint ||
          'Check provider configuration and server logs for the attempted providers.',
        attemptedProviders: run.plan,
      },
      { status: firstFailure?.status || 503 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}


