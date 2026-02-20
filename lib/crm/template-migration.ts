/**
 * Pipeline Template Migration Service
 * Migrates existing deals to new industry-specific templates
 */

import { prisma } from '@/lib/db/prisma'
import { IndustryTemplate, getAllTemplates, getTemplateById } from './industry-templates'

export interface MigrationResult {
  success: boolean
  dealsMigrated: number
  customFieldsCreated: number
  errors: string[]
}

/**
 * Apply template to a tenant
 * Creates custom fields and updates deal stages
 */
export async function applyTemplate(
  tenantId: string,
  templateId: string
): Promise<MigrationResult> {
  const template = getTemplateById(templateId)
  if (!template) {
    return {
      success: false,
      dealsMigrated: 0,
      customFieldsCreated: 0,
      errors: ['Template not found'],
    }
  }

  const errors: string[] = []
  let customFieldsCreated = 0

  try {
    // Create custom fields for this template
    for (const fieldDef of template.customFields) {
      try {
        // Check if field already exists
        const existing = await prisma.customField.findUnique({
          where: {
            tenantId_model_name: {
              tenantId,
              model: 'Deal',
              name: fieldDef.name,
            },
          },
        })

        if (!existing) {
          await prisma.customField.create({
            data: {
              tenantId,
              name: fieldDef.name,
              fieldType: fieldDef.fieldType,
              isRequired: fieldDef.isRequired,
              model: 'Deal',
              options: fieldDef.options ? (fieldDef.options as any) : null,
              defaultValue: fieldDef.defaultValue || null,
              displayOrder: template.customFields.indexOf(fieldDef),
              isActive: true,
            },
          })
          customFieldsCreated++
        }
      } catch (error) {
        errors.push(`Failed to create field ${fieldDef.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Store template configuration in tenant industrySettings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industrySettings: true },
    })

    const industrySettings = (tenant?.industrySettings as any) || {}
    industrySettings.pipelineTemplate = {
      templateId: template.id,
      industry: template.industry,
      stages: template.stages,
      appliedAt: new Date().toISOString(),
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { industrySettings: industrySettings as any },
    })

    // Migrate existing deals to new stages (map old stages to new ones)
    const deals = await prisma.deal.findMany({
      where: { tenantId },
    })

    let dealsMigrated = 0
    for (const deal of deals) {
      try {
        // Map old stage to new stage (simple mapping - first stage if no match)
        const newStage = mapStageToTemplate(deal.stage, template)
        
        await prisma.deal.update({
          where: { id: deal.id },
          data: {
            stage: newStage,
            probability: template.stages.find((s) => s.id === newStage)?.probability || deal.probability,
          },
        })
        dealsMigrated++
      } catch (error) {
        errors.push(`Failed to migrate deal ${deal.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      dealsMigrated,
      customFieldsCreated,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      dealsMigrated: 0,
      customFieldsCreated,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Map old stage to new template stage
 */
function mapStageToTemplate(oldStage: string, template: IndustryTemplate): string {
  // Try to find a matching stage by name similarity
  const oldStageLower = oldStage.toLowerCase()
  
  for (const newStage of template.stages) {
    const newStageLower = newStage.name.toLowerCase()
    if (newStageLower.includes(oldStageLower) || oldStageLower.includes(newStageLower)) {
      return newStage.id
    }
  }

  // Default mapping based on common stage names
  const stageMappings: Record<string, string> = {
    'lead': template.stages[0]?.id || 'initial-interest',
    'qualified': template.stages[1]?.id || 'compliance-review',
    'proposal': template.stages[3]?.id || 'pricing-discussion',
    'negotiation': template.stages[4]?.id || 'contract-negotiation',
    'won': template.stages[template.stages.length - 1]?.id || 'go-live',
    'lost': 'lost',
  }

  return stageMappings[oldStageLower] || template.stages[0]?.id || 'initial-interest'
}

/**
 * Preview template changes before applying
 */
export async function previewTemplate(
  tenantId: string,
  templateId: string
): Promise<{
  template: IndustryTemplate
  existingDeals: number
  existingCustomFields: number
  newCustomFields: number
  stageMapping: Record<string, string>
}> {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error('Template not found')
  }

  // Get existing deals count
  const existingDeals = await prisma.deal.count({
    where: { tenantId },
  })

  // Get existing custom fields
  const existingCustomFields = await prisma.customField.count({
    where: {
      tenantId,
      model: 'Deal',
    },
  })

  // Calculate new fields that will be created
  const existingFieldNames = (
    await prisma.customField.findMany({
      where: {
        tenantId,
        model: 'Deal',
      },
      select: { name: true },
    })
  ).map((f) => f.name)

  const newCustomFields = template.customFields.filter(
    (f) => !existingFieldNames.includes(f.name)
  ).length

  // Get unique stages from existing deals
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    select: { stage: true },
    distinct: ['stage'],
  })

  const stageMapping: Record<string, string> = {}
  for (const deal of deals) {
    stageMapping[deal.stage] = mapStageToTemplate(deal.stage, template)
  }

  return {
    template,
    existingDeals,
    existingCustomFields,
    newCustomFields,
    stageMapping,
  }
}
