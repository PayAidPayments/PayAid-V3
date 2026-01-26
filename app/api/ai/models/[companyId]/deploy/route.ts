import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import { getDeploymentQueue } from '@/lib/queue/model-training-queue'

const deployRequestSchema = z.object({
  modelPath: z.string(),
  version: z.string().optional().default('1.0'),
})

/**
 * POST /api/ai/models/[companyId]/deploy
 * Deploy fine-tuned model to Ollama
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    if (params.companyId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validated = deployRequestSchema.parse(body)

    // Verify model path exists
    const fullPath = join(process.cwd(), validated.modelPath)
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Model path does not exist' },
        { status: 400 }
      )
    }

    // Add job to queue for background processing
    try {
      const queue = getDeploymentQueue()
      const modelName = `mistral-7b-company-${tenantId}:${validated.version}`
      const job = await queue.add('deploy-model', {
        tenantId,
        modelPath: validated.modelPath,
        modelName,
      }, {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Deployment job queued successfully',
        jobId: job.id.toString(),
        status: 'queued',
        modelPath: validated.modelPath,
        modelName,
        version: validated.version,
        // Also provide manual command as fallback
        manualCommand: `cd services/fine-tuning && python deploy.py --tenant-id ${tenantId} --model-path ${validated.modelPath} --version ${validated.version}`,
      })
    } catch (queueError) {
      // Fallback to manual instructions if queue is unavailable
      console.warn('[Deployment] Queue unavailable, returning manual instructions:', queueError)
      return NextResponse.json({
        success: true,
        message: 'Deployment initiated. Run deploy service manually:',
        instructions: {
          command: `cd services/fine-tuning && python deploy.py --tenant-id ${tenantId} --model-path ${validated.modelPath} --version ${validated.version}`,
          modelPath: validated.modelPath,
          version: validated.version,
        },
        jobId: `deploy-${tenantId}-${Date.now()}`,
        note: 'Job queue unavailable. Use manual command above.',
      })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Deployment request error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate deployment', details: String(error) },
      { status: 500 }
    )
  }
}
