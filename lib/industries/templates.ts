/**
 * Industry Template Loading System
 * Loads industry-specific templates, workflows, and configurations
 */

import { prisma } from '@/lib/db/prisma'
import { getIndustryConfig } from './config'

export interface IndustryTemplate {
  id: string
  name: string
  type: 'workflow' | 'form' | 'report' | 'dashboard' | 'settings'
  data: Record<string, any>
  description?: string
}

/**
 * Load industry templates for a tenant
 */
export async function loadIndustryTemplates(
  tenantId: string,
  industryId: string,
  industrySubType?: string | null
): Promise<{ loaded: number; templates: IndustryTemplate[] }> {
  const industryConfig = getIndustryConfig(industryId)
  if (!industryConfig) {
    return { loaded: 0, templates: [] }
  }

  const templates: IndustryTemplate[] = []
  let loadedCount = 0

  // Load templates based on industry config
  for (const templateId of industryConfig.templates) {
    const template = await getTemplateById(templateId, industryId, industrySubType)
    if (template) {
      templates.push(template)
      
      // Apply template to tenant
      await applyTemplate(tenantId, template)
      loadedCount++
    }
  }

  // Load default settings
  if (industryConfig.defaultSettings) {
    await applyDefaultSettings(tenantId, industryConfig.defaultSettings)
  }

  return {
    loaded: loadedCount,
    templates,
  }
}

/**
 * Get template by ID
 */
async function getTemplateById(
  templateId: string,
  industryId: string,
  industrySubType?: string | null
): Promise<IndustryTemplate | null> {
  // Template definitions (in production, these would be in a database)
  const templateDefinitions: Record<string, IndustryTemplate> = {
    restaurant_menu_template: {
      id: 'restaurant_menu_template',
      name: 'Restaurant Menu Template',
      type: 'form',
      description: 'Pre-configured menu structure for restaurants',
      data: {
        categories: ['Appetizers', 'Main Course', 'Desserts', 'Beverages'],
        fields: ['name', 'description', 'price', 'category', 'image', 'dietary_info'],
      },
    },
    restaurant_staff_roles: {
      id: 'restaurant_staff_roles',
      name: 'Restaurant Staff Roles',
      type: 'settings',
      description: 'Pre-configured staff roles for restaurants',
      data: {
        roles: ['Manager', 'Chef', 'Waiter', 'Cashier', 'Kitchen Staff'],
      },
    },
    retail_product_categories: {
      id: 'retail_product_categories',
      name: 'Retail Product Categories',
      type: 'form',
      description: 'Pre-configured product categories for retail',
      data: {
        categories: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
      },
    },
  }

  return templateDefinitions[templateId] || null
}

/**
 * Apply template to tenant
 */
async function applyTemplate(tenantId: string, template: IndustryTemplate): Promise<void> {
  // Store template data in tenant settings or create records
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industrySettings: true },
  })

  const currentSettings = (tenant?.industrySettings as any) || {}
  const templates = currentSettings.templates || []

  // Add template if not already applied
  if (!templates.find((t: any) => t.id === template.id)) {
    templates.push({
      id: template.id,
      name: template.name,
      type: template.type,
      appliedAt: new Date().toISOString(),
    })

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        industrySettings: {
          ...currentSettings,
          templates,
        } as any,
      },
    })
  }

  // Apply template-specific data
  switch (template.type) {
    case 'settings':
      // Apply settings to tenant configuration
      await applySettingsTemplate(tenantId, template)
      break
    case 'form':
      // Create form fields or structures
      await applyFormTemplate(tenantId, template)
      break
    case 'workflow':
      // Create workflow definitions
      await applyWorkflowTemplate(tenantId, template)
      break
  }
}

/**
 * Apply settings template
 */
async function applySettingsTemplate(tenantId: string, template: IndustryTemplate): Promise<void> {
  // For restaurant staff roles, create default roles if they don't exist
  if (template.id === 'restaurant_staff_roles' && template.data.roles) {
    // This would create default roles in the HR module
    // Implementation depends on your role management system
  }
}

/**
 * Apply form template
 */
async function applyFormTemplate(tenantId: string, template: IndustryTemplate): Promise<void> {
  // For menu/product templates, create default categories
  if (template.data.categories) {
    // This would create default categories in Inventory/Products module
    // Implementation depends on your category management system
  }
}

/**
 * Apply workflow template
 */
async function applyWorkflowTemplate(tenantId: string, template: IndustryTemplate): Promise<void> {
  // Create workflow definitions
  // Implementation depends on your workflow system
}

/**
 * Apply default settings
 */
async function applyDefaultSettings(tenantId: string, settings: Record<string, any>): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industrySettings: true },
  })

  const currentSettings = (tenant?.industrySettings as any) || {}

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      industrySettings: {
        ...currentSettings,
        defaultSettings: settings,
      } as any,
    },
  })
}

