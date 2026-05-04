import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { imageGenerationRequestSchema } from '@/lib/ai/generation/contracts'
import { normalizeImageProvider } from '@/lib/ai/generation/provider-plan'
import { orchestrateImageGeneration } from '@/lib/ai/generation/image-orchestrator'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { z } from 'zod'

// POST /api/ai/generate-image - Generate image using AI
export async function POST(request: NextRequest) {
  try {
    // Allow both AI Studio and Marketing modules for image generation flows.
    let tenantId: string
    let userId: string
    try {
      const access = await requireModuleAccess(request, 'ai-studio')
      tenantId = access.tenantId
      userId = access.userId
    } catch (accessError) {
      if (accessError && typeof accessError === 'object' && 'moduleId' in accessError) {
        const fallbackAccess = await requireModuleAccess(request, 'marketing')
        tenantId = fallbackAccess.tenantId
        userId = fallbackAccess.userId
      } else {
        throw accessError
      }
    }

    const body = await request.json()
    const validated = imageGenerationRequestSchema.parse(body)

    // Get token from request headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      aiGateway.setToken(token)
    }

    // Get provider preference from request (default: auto-detect)
    const provider = normalizeImageProvider(validated.provider)

    // Check if tenant has their own Google AI Studio key configured
    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleAiStudioApiKey: true },
      })
    )
    const run = await orchestrateImageGeneration(
      {
        provider,
        authHeader: request.headers.get('authorization') || '',
        tenantHasGoogleAiStudio: Boolean(tenant?.googleAiStudioApiKey),
      },
      {
        prompt: validated.prompt,
        style: validated.style,
        size: validated.size,
      }
    )

    if (run.success) {
      return NextResponse.json(run.success.payload)
    }

    const providerPlan = run.plan
    const failuresByProvider = Object.fromEntries(run.failures.map((f) => [f.provider, f]))
    const payAidWorkerAttemptedFirst = provider === 'auto' && providerPlan.includes('self-hosted')
    const hasHuggingFace = providerPlan.includes('huggingface')
    const hasNanoBanana = providerPlan.includes('nanobanana')
    const triedGoogle = providerPlan.includes('google-ai-studio')

    const payAidWorkerTroubleshoot =
      'PayAid image worker (IMAGE_WORKER_URL): start the service in services/text-to-image (see README), ensure POST /generate returns image_url, and that the dashboard can reach the URL (same machine: http://localhost:7860).'

    let errorMessage = 'Image generation service not configured.'
    let hint = ''
    
    // Check provider-specific errors
    if (provider === 'self-hosted') {
      const failure = failuresByProvider['self-hosted']
      errorMessage = failure?.error || 'Self-hosted image worker is not configured or not responding.'
      hint =
        failure?.hint ||
        'Set IMAGE_WORKER_URL in your environment to your text-to-image service (e.g. http://localhost:7860). See services/text-to-image/ for the included SDXL server.'
    } else if (provider === 'google-ai-studio') {
      const failure = failuresByProvider['google-ai-studio']
      errorMessage =
        failure?.error ||
        'Google AI Studio API key is not configured for your account. Each tenant must use their own API key.'
      hint =
        failure?.hint ||
        'Get your free API key from https://aistudio.google.com/app/apikey\n\n1. Go to https://aistudio.google.com/app/apikey\n2. Click "Create API Key"\n3. Copy the API key\n4. Go to Settings > AI Integrations\n5. Add your API key in the Google AI Studio section'
    } else if (provider === 'nanobanana') {
      const failure = failuresByProvider['nanobanana']
      if (!hasNanoBanana) {
        errorMessage = 'Nano Banana API key is not configured.'
        hint = 'Get API key from https://aistudio.google.com/app/apikey and add to .env:\n\n1. Go to https://aistudio.google.com/app/apikey\n2. Click "Create API Key"\n3. Copy the API key\n4. Add to .env: GEMINI_API_KEY="AIza_xxx"\n5. Restart dev server: npm run dev'
      } else {
        errorMessage = failure?.error || 'Nano Banana image generation failed. Please check your API key and try again.'
        hint =
          failure?.hint ||
          'Your GEMINI_API_KEY is configured, but image generation failed. Please check:\n1. API key is valid\n2. Server has been restarted after adding the key\n3. Check server logs for detailed error messages'
      }
    } else if (provider === 'huggingface') {
      const failure = failuresByProvider['huggingface']
      if (!hasHuggingFace) {
        errorMessage = 'Hugging Face Inference API key is not configured.'
        hint = 'Add HUGGINGFACE_API_KEY to your .env file:\n\n1. Get API key from https://huggingface.co/settings/tokens\n2. Add to .env: HUGGINGFACE_API_KEY="hf_your_token"\n3. Optional: Set HUGGINGFACE_IMAGE_MODEL (default: ByteDance/SDXL-Lightning)\n4. Restart dev server: npm run dev'
      } else {
        errorMessage = failure?.error || 'Hugging Face image generation failed. Please check your API key and try again.'
        hint =
          failure?.hint ||
          'Your HUGGINGFACE_API_KEY is configured, but image generation failed. Please check:\n1. API key is valid\n2. Server has been restarted after adding the key\n3. Check server logs for detailed error messages'
      }
    } else {
      // Auto mode - check what's available
      if (hasHuggingFace) {
        const workerPreamble = payAidWorkerAttemptedFirst
          ? `Auto mode tried the PayAid self-hosted worker first, but it did not return an image (${payAidWorkerTroubleshoot})\n\n`
          : ''
        if (triedGoogle) {
          errorMessage =
            'Image generation failed after trying the PayAid worker (if configured), Google AI Studio, and Hugging Face.'
          hint = `${workerPreamble}Cloud fallbacks were also attempted:\n\n1. Google AI Studio: failed (check Settings > AI Integrations)\n2. Hugging Face: failed (check HUGGINGFACE_API_KEY at https://huggingface.co/settings/tokens)\n\nCheck server logs for details. To use only your own generator, set IMAGE_WORKER_URL and choose provider "self-hosted" where available, or fix the worker until Auto succeeds without cloud keys.`
        } else {
          errorMessage =
            'Image generation failed after trying the PayAid worker (if configured) and Hugging Face.'
          hint = `${workerPreamble}Your HUGGINGFACE_API_KEY is set, but Hugging Face generation failed. Verify the key and model (HUGGINGFACE_IMAGE_MODEL). Alternatively configure Google AI Studio in Settings > AI Integrations, or run the PayAid text-to-image service and set IMAGE_WORKER_URL.`
        }
      } else {
        errorMessage =
          `Image generation service not configured, or every configured provider failed. Attempt plan: ${providerPlan.join(' -> ') || 'none'}.\n\nOptions:\n\n1. PayAid SDXL worker (own infra): set IMAGE_WORKER_URL and run services/text-to-image (see README)\n2. Google AI Studio: https://aistudio.google.com/app/apikey → Settings > AI Integrations\n3. Hugging Face: token at https://huggingface.co/settings/tokens → HUGGINGFACE_API_KEY in server env`
        hint = `Prefer your own generator: ${payAidWorkerTroubleshoot}\n\nCloud: Google AI Studio (per-tenant key) or Hugging Face (server env).`
      }
    }
    
    return NextResponse.json({
      error: 'Image generation service not configured',
      message: errorMessage,
      hint,
      setupInstructions: {
        nanoBanana: {
          url: 'https://aistudio.google.com/app/apikey',
          steps: [
            '1. Go to https://aistudio.google.com/app/apikey',
            '2. Click "Create API Key"',
            '3. Copy the API key',
            '4. Add to .env: GEMINI_API_KEY="AIza_xxx"',
            '5. Restart dev server: npm run dev',
          ],
          cost: '₹3.23 per image',
          features: 'Superior quality, faster (5-10s), image editing, multi-image fusion',
        },
        googleAiStudio: {
          url: 'https://aistudio.google.com/app/apikey',
          steps: [
            '1. Go to https://aistudio.google.com/app/apikey',
            '2. Click "Create API Key"',
            '3. Copy the API key',
            '4. Go to Dashboard > Settings > AI Integrations',
            '5. Add your API key in the Google AI Studio section',
          ],
        },
        huggingFace: {
          url: 'https://huggingface.co/settings/tokens',
          steps: [
            '1. Get API key from https://huggingface.co/settings/tokens',
            '2. Add to .env: HUGGINGFACE_API_KEY="hf_your_token"',
            '3. Optional: Set HUGGINGFACE_IMAGE_MODEL (default: ByteDance/SDXL-Lightning)',
            '4. Restart dev server: npm run dev',
          ],
        },
        payAidImageWorker: {
          steps: [
            '1. From repo root: cd services/text-to-image && pip install -r requirements.txt && python server.py (listens on http://localhost:7860)',
            '2. Set IMAGE_WORKER_URL=http://localhost:7860 in the same env as the dashboard server',
            '3. Confirm GET /health and POST /generate work from the machine running Next.js',
            '4. Restart the dashboard after changing env',
          ],
        },
      },
    }, { status: 503 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Image generation error:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to generate image'
    let hint = ''
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
      
      // Check for common error patterns
      if (error.message.includes('decrypt') || error.message.includes('ENCRYPTION_KEY')) {
        hint = 'Server encryption is not configured. Please contact support.'
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        hint = 'Network error. Please check your internet connection and try again.'
      } else if (error.message.includes('timeout')) {
        hint = 'Request timed out. Please try again.'
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        message: errorMessage,
        hint,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
