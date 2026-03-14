import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { exportTrainingDataForFineTuning, getTrainingDataset } from '@/lib/ai/company-fine-tuning'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getTrainingQueue } from '@/lib/queue/model-training-queue'

const trainRequestSchema = z.object({
  epochs: z.number().min(1).max(10).optional().default(3),
  batchSize: z.number().min(1).max(16).optional().default(4),
  learningRate: z.number().min(1e-5).max(1e-2).optional().default(2e-4),
})

/**
 * POST /api/ai/models/[companyId]/train
 * Trigger fine-tuning for a company
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
    const validated = trainRequestSchema.parse(body)

    // Get training dataset
    const dataset = await getTrainingDataset(tenantId)
    if (!dataset) {
      return NextResponse.json(
        { error: 'Insufficient or invalid training data. Need at least 100 quality examples.' },
        { status: 400 }
      )
    }

    // Export training data
    const trainingData = await exportTrainingDataForFineTuning(tenantId, 'jsonl')

    // Save training data to temporary file
    const trainingDir = join(process.cwd(), 'services', 'fine-tuning', 'data')
    await mkdir(trainingDir, { recursive: true })
    const dataPath = join(trainingDir, `${tenantId}-training.jsonl`)
    await writeFile(dataPath, trainingData, 'utf-8')

    // Add job to queue for background processing
    try {
      const queue = getTrainingQueue()
      const job = await queue.add('train-model', {
        tenantId,
        epochs: validated.epochs,
        batchSize: validated.batchSize,
        learningRate: validated.learningRate,
      }, {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Training job queued successfully',
        jobId: job.id.toString(),
        status: 'queued',
        datasetSize: dataset.totalCount,
        qualityScore: dataset.qualityScore,
        // Also provide manual command as fallback
        manualCommand: `cd services/fine-tuning && python train.py --tenant-id ${tenantId} --data ${dataPath} --epochs ${validated.epochs} --batch-size ${validated.batchSize} --learning-rate ${validated.learningRate}`,
      })
    } catch (queueError) {
      // Fallback to manual instructions if queue is unavailable
      console.warn('[Training] Queue unavailable, returning manual instructions:', queueError)
      return NextResponse.json({
        success: true,
        message: 'Training data prepared. Run fine-tuning service manually:',
        instructions: {
          command: `cd services/fine-tuning && python train.py --tenant-id ${tenantId} --data ${dataPath} --epochs ${validated.epochs} --batch-size ${validated.batchSize} --learning-rate ${validated.learningRate}`,
          dataPath,
          datasetSize: dataset.totalCount,
          qualityScore: dataset.qualityScore,
        },
        jobId: `train-${tenantId}-${Date.now()}`,
        note: 'Job queue unavailable. Use manual command above.',
      })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Training request error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate training', details: String(error) },
      { status: 500 }
    )
  }
}
