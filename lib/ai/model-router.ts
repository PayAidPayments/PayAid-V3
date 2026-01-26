/**
 * Model Router
 * Routes AI requests to company-specific fine-tuned models or base model
 */

import { prisma } from '@/lib/db/prisma'

export interface ModelConfig {
  tenantId: string
  modelName: string // e.g., "mistral-7b-company-123"
  baseModel: string // e.g., "mistral:7b"
  version: string
  isActive: boolean
  accuracyImprovement?: number // Percentage improvement over base model
  createdAt: Date
  lastUsed?: Date
}

/**
 * Get model configuration for a tenant
 */
export async function getModelConfig(tenantId: string): Promise<ModelConfig | null> {
  // Check if custom model exists in Ollama
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const modelName = `mistral-7b-company-${tenantId}`

  try {
    // Check if model exists in Ollama
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      const data = await response.json()
      const models = data.models || []
      const hasCustomModel = models.some(
        (m: any) => m.name === modelName || m.name.startsWith(`${modelName}:`)
      )

      if (hasCustomModel) {
        // Get version from model name or default to 1.0
        const model = models.find(
          (m: any) => m.name === modelName || m.name.startsWith(`${modelName}:`)
        )
        const version = model?.name.includes(':') ? model.name.split(':')[1] : '1.0'

        return {
          tenantId,
          modelName,
          baseModel: 'mistral:7b',
          version,
          isActive: true,
          createdAt: new Date(),
          lastUsed: new Date(),
        }
      }
    }
  } catch (error) {
    console.warn('Failed to check Ollama for custom model:', error)
  }

  return null
}

/**
 * Route AI request to appropriate model
 */
export async function routeToModel(tenantId: string): Promise<{
  useCustomModel: boolean
  modelName: string
  baseModel: string
}> {
  const config = await getModelConfig(tenantId)

  if (config && config.isActive) {
    return {
      useCustomModel: true,
      modelName: config.modelName,
      baseModel: config.baseModel,
    }
  }

  // Default to base model
  return {
    useCustomModel: false,
    modelName: 'mistral:7b', // or 'groq:mixtral-8x7b' for Groq
    baseModel: 'mistral:7b',
  }
}

/**
 * Record model usage for analytics
 */
export async function recordModelUsage(
  tenantId: string,
  modelName: string,
  success: boolean,
  latency?: number
): Promise<void> {
  // In production, this would log to a ModelUsage table
  // For now, we'll update the lastUsed timestamp in the config
  try {
    const config = await getModelConfig(tenantId)
    if (config) {
      // Update lastUsed timestamp (in production, save to database)
      config.lastUsed = new Date()
    }
  } catch (error) {
    console.error('Failed to record model usage:', error)
  }

  console.log(`Model usage: ${tenantId} -> ${modelName} (success: ${success}, latency: ${latency}ms)`)
}

/**
 * Get model versioning information
 */
export async function getModelVersions(tenantId: string): Promise<string[]> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const modelName = `mistral-7b-company-${tenantId}`

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      const models = data.models || []
      return models
        .filter((m: any) => m.name.startsWith(`${modelName}:`))
        .map((m: any) => m.name.split(':')[1])
    }
  } catch (error) {
    console.error('Failed to get model versions:', error)
  }

  return []
}
