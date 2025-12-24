/**
 * Seed Module Definitions for V2 - 8 Module Structure
 * 
 * This script populates the ModuleDefinition table with the new 8-module structure.
 * Run after database migration.
 * 
 * Usage:
 *   npx tsx scripts/seed-modules-v2.ts
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

const modules = [
  // 1. CRM Module
  {
    moduleId: 'crm',
    displayName: 'CRM',
    description: 'Customer relationship management - Contacts, Deals, Pipeline, Tasks',
    icon: 'users',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['contacts', 'deals', 'pipeline', 'tasks', 'products', 'orders'],
  },
  
  // 2. Sales Module (NEW)
  {
    moduleId: 'sales',
    displayName: 'Sales',
    description: 'Sales pages, checkout, and order management',
    icon: 'shopping-cart',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['landing_pages', 'checkout_pages', 'order_management', 'sales_analytics'],
  },
  
  // 3. Marketing Module (NEW)
  {
    moduleId: 'marketing',
    displayName: 'Marketing',
    description: 'Campaigns, social media, email templates, events, WhatsApp',
    icon: 'megaphone',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['campaigns', 'social_media', 'email_templates', 'events', 'whatsapp'],
  },
  
  // 4. Finance Module (NEW - merged invoicing + accounting)
  {
    moduleId: 'finance',
    displayName: 'Finance',
    description: 'Invoices, accounting, GST reports, and financial analytics',
    icon: 'dollar-sign',
    isActive: true,
    starterPrice: new Decimal(2499),
    professionalPrice: new Decimal(3999),
    enterprisePrice: new Decimal(6999),
    features: ['invoices', 'accounting', 'gst_reports', 'financial_analytics', 'expense_tracking'],
  },
  
  // 5. HR Module (unchanged)
  {
    moduleId: 'hr',
    displayName: 'HR & Payroll',
    description: 'Employee management, payroll, attendance, leave management',
    icon: 'briefcase',
    isActive: true,
    starterPrice: new Decimal(2499),
    professionalPrice: new Decimal(3999),
    enterprisePrice: new Decimal(6999),
    features: ['employee_management', 'payroll', 'attendance', 'leave_management', 'tax_compliance'],
  },
  
  // 6. Communication Module (NEW)
  {
    moduleId: 'communication',
    displayName: 'Communication',
    description: 'Email accounts, webmail, and team chat',
    icon: 'message-square',
    isActive: true,
    starterPrice: new Decimal(1499),
    professionalPrice: new Decimal(2499),
    enterprisePrice: new Decimal(3999),
    features: ['email_accounts', 'webmail', 'team_chat', 'email_management'],
  },
  
  // 7. AI Studio Module (NEW)
  {
    moduleId: 'ai-studio',
    displayName: 'AI Studio',
    description: 'AI-powered website builder, logo generator, AI chat, and calling bot',
    icon: 'sparkles',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['website_builder', 'logo_generator', 'ai_chat', 'ai_calling', 'ai_insights'],
  },
  
  // 8. Analytics & Reporting Module (renamed from analytics)
  {
    moduleId: 'analytics',
    displayName: 'Analytics & Reporting',
    description: 'Business intelligence, custom reports, and dashboards',
    icon: 'bar-chart',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['custom_reports', 'dashboards', 'data_export', 'insights', 'cross_module_analytics'],
  },
]

async function seedModules() {
  console.log('🌱 Seeding module definitions (V2 - 8 Module Structure)...\n')

  try {
    for (const module of modules) {
      const result = await prisma.moduleDefinition.upsert({
        where: { moduleId: module.moduleId },
        update: {
          displayName: module.displayName,
          description: module.description,
          icon: module.icon,
          isActive: module.isActive,
          starterPrice: module.starterPrice,
          professionalPrice: module.professionalPrice,
          enterprisePrice: module.enterprisePrice,
          features: module.features,
        },
        create: {
          moduleId: module.moduleId,
          displayName: module.displayName,
          description: module.description,
          icon: module.icon,
          isActive: module.isActive,
          starterPrice: module.starterPrice,
          professionalPrice: module.professionalPrice,
          enterprisePrice: module.enterprisePrice,
          features: module.features,
        },
      })

      console.log(`  ✅ ${module.moduleId}: ${module.displayName}`)
    }

    // Mark old modules as deprecated (but keep them for backward compatibility)
    const deprecatedModules = ['invoicing', 'accounting', 'whatsapp']
    for (const oldModuleId of deprecatedModules) {
      await prisma.moduleDefinition.updateMany({
        where: { moduleId: oldModuleId },
        data: { isActive: false },
      })
      console.log(`  ⚠️  ${oldModuleId}: Marked as deprecated (inactive)`)
    }

    console.log(`\n✅ Successfully seeded ${modules.length} module definitions`)
    console.log(`⚠️  ${deprecatedModules.length} old modules marked as deprecated`)
  } catch (error) {
    console.error('❌ Error seeding modules:', error)
    throw error
  }
}

async function main() {
  try {
    await seedModules()
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
