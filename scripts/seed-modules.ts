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
    moduleId: 'invoicing',
    displayName: 'Invoicing',
    description: 'Create and manage invoices with GST compliance',
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
    description: 'Complete accounting and financial management',
    icon: 'calculator',
    isActive: true,
    starterPrice: new Decimal(2499),
    professionalPrice: new Decimal(3999),
    enterprisePrice: new Decimal(6999),
    features: ['general_ledger', 'expense_tracking', 'financial_reports', 'bank_reconciliation'],
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
    moduleId: 'whatsapp',
    displayName: 'WhatsApp',
    description: 'WhatsApp Business integration and messaging',
    icon: 'message-circle',
    isActive: true,
    starterPrice: new Decimal(1999),
    professionalPrice: new Decimal(2999),
    enterprisePrice: new Decimal(4999),
    features: ['whatsapp_messaging', 'template_messages', 'conversation_management', 'analytics'],
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
    features: ['custom_reports', 'dashboards', 'data_export', 'insights'],
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
