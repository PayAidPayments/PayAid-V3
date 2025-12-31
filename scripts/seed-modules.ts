/**
 * Seed Module Definitions for Phase 1
 * 
 * This script populates the ModuleDefinition table with all available modules.
 * Run after database migration.
 * 
 * Usage:
 *   npx tsx scripts/seed-modules.ts
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

const modules = [
  // Core V2 Modules (8 main modules)
  {
    moduleId: 'crm',
    displayName: 'CRM',
    description: 'Customer relationship management - Contacts, Deals, Pipeline management',
    icon: 'users',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['contacts', 'deals', 'pipeline', 'lead_management'],
  },
  {
    moduleId: 'sales',
    displayName: 'Sales',
    description: 'Sales management, order processing, sales rep tracking',
    icon: 'shopping-cart',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['order_management', 'sales_rep_tracking', 'sales_reports', 'quotation_management'],
  },
  {
    moduleId: 'marketing',
    displayName: 'Marketing',
    description: 'Marketing automation, campaigns, social media management',
    icon: 'megaphone',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['campaigns', 'email_marketing', 'social_media', 'landing_pages', 'analytics'],
  },
  {
    moduleId: 'finance',
    displayName: 'Finance',
    description: 'Complete financial management - Invoicing, Accounting, Expenses',
    icon: 'wallet',
    isActive: true,
    starterPrice: new Decimal(2499),
    professionalPrice: new Decimal(3999),
    enterprisePrice: new Decimal(6999),
    features: ['invoicing', 'accounting', 'expense_tracking', 'financial_reports', 'gst_compliance'],
  },
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
  {
    moduleId: 'communication',
    displayName: 'Communication',
    description: 'Email, SMS, WhatsApp integration and messaging',
    icon: 'message-circle',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['email', 'sms', 'whatsapp', 'template_messages', 'campaigns'],
  },
  {
    moduleId: 'ai-studio',
    displayName: 'AI Studio',
    description: 'AI-powered features - Chatbot, Co-founder, Website Builder',
    icon: 'sparkles',
    isActive: true,
    starterPrice: new Decimal(2999),
    professionalPrice: new Decimal(4999),
    enterprisePrice: new Decimal(7999),
    features: ['ai_chatbot', 'ai_cofounder', 'website_builder', 'image_generation', 'content_generation'],
  },
  {
    moduleId: 'analytics',
    displayName: 'Analytics',
    description: 'Business intelligence and reporting',
    icon: 'bar-chart',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['custom_reports', 'dashboards', 'data_export', 'insights', 'pivot_tables'],
  },
  // Legacy modules (for backward compatibility)
  {
    moduleId: 'invoicing',
    displayName: 'Invoicing',
    description: 'Create and manage invoices with GST compliance (Legacy - use Finance module)',
    icon: 'file-text',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['invoice_creation', 'gst_compliance', 'payment_tracking', 'recurring_invoices'],
  },
  {
    moduleId: 'accounting',
    displayName: 'Accounting',
    description: 'Complete accounting and financial management (Legacy - use Finance module)',
    icon: 'calculator',
    isActive: true,
    starterPrice: new Decimal(2499),
    professionalPrice: new Decimal(3999),
    enterprisePrice: new Decimal(6999),
    features: ['general_ledger', 'expense_tracking', 'financial_reports', 'bank_reconciliation'],
  },
  {
    moduleId: 'whatsapp',
    displayName: 'WhatsApp',
    description: 'WhatsApp Business integration and messaging (Legacy - use Communication module)',
    icon: 'message-circle',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['whatsapp_messaging', 'template_messages', 'conversation_management', 'analytics'],
  },
]

async function seedModules() {
  console.log('🌱 Seeding module definitions...')

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

    console.log(`\n✅ Successfully seeded ${modules.length} module definitions`)
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
