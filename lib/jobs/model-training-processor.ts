/**
 * Background Job Processor for Model Training and Deployment
 * Uses Bull.js for queue management
 */

import { Job } from 'bull'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { exportTrainingDataForFineTuning } from '@/lib/ai/company-fine-tuning'

const execAsync = promisify(exec)

export interface TrainingJobData {
  tenantId: string
  epochs?: number
  batchSize?: number
  learningRate?: number
}

export interface DeploymentJobData {
  tenantId: string
  modelPath: string
  modelName?: string
}

/**
 * Process model training job
 */
export async function processTrainingJob(job: Job<TrainingJobData>) {
  const { tenantId, epochs = 3, batchSize = 4, learningRate = 2e-4 } = job.data

  try {
    job.progress(10)

    // Step 1: Export training data
    const trainingData = await exportTrainingDataForFineTuning(tenantId, 'jsonl')
    const trainingDir = join(process.cwd(), 'services', 'fine-tuning', 'data')
    await mkdir(trainingDir, { recursive: true })
    const dataPath = join(trainingDir, `${tenantId}-training.jsonl`)
    await writeFile(dataPath, trainingData, 'utf-8')

    job.progress(30)

    // Step 2: Run training script
    const trainScript = join(process.cwd(), 'services', 'fine-tuning', 'train.py')
    const trainCommand = `python "${trainScript}" --tenant-id "${tenantId}" --data "${dataPath}" --epochs ${epochs} --batch-size ${batchSize} --learning-rate ${learningRate}`

    job.progress(40)
    const { stdout, stderr } = await execAsync(trainCommand, {
      cwd: join(process.cwd(), 'services', 'fine-tuning'),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    if (stderr && !stderr.includes('INFO')) {
      throw new Error(`Training failed: ${stderr}`)
    }

    job.progress(90)

    // Step 3: Extract model path from output
    const modelPath = join(process.cwd(), 'services', 'fine-tuning', 'models', tenantId)

    job.progress(100)

    return {
      success: true,
      tenantId,
      modelPath,
      output: stdout,
    }
  } catch (error) {
    console.error('[Training Job] Error:', error)
    throw error
  }
}

/**
 * Process model deployment job
 */
export async function processDeploymentJob(job: Job<DeploymentJobData>) {
  const { tenantId, modelPath, modelName } = job.data

  try {
    job.progress(10)

    // Step 1: Convert to GGUF if needed
    const deployScript = join(process.cwd(), 'services', 'fine-tuning', 'deploy.py')
    const modelNameFinal = modelName || `mistral-7b-company-${tenantId}`

    job.progress(30)

    // Step 2: Deploy to Ollama
    const deployCommand = `python "${deployScript}" --tenant-id "${tenantId}" --model-path "${modelPath}" --model-name "${modelNameFinal}"`

    job.progress(50)
    const { stdout, stderr } = await execAsync(deployCommand, {
      cwd: join(process.cwd(), 'services', 'fine-tuning'),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    if (stderr && !stderr.includes('INFO')) {
      throw new Error(`Deployment failed: ${stderr}`)
    }

    job.progress(90)

    // Step 3: Verify deployment
    // This would check if model is available in Ollama

    job.progress(100)

    return {
      success: true,
      tenantId,
      modelName: modelNameFinal,
      output: stdout,
    }
  } catch (error) {
    console.error('[Deployment Job] Error:', error)
    throw error
  }
}
