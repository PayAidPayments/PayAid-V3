/**
 * Script to enable RLS policies for all tables
 * 
 * This script generates RLS policies for tenant isolation.
 * Since we're using Prisma with application-level auth, RLS provides defense-in-depth.
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Tables that should allow service role (Prisma) full access
// but restrict regular users to their tenant
const TENANT_SCOPED_TABLES = [
  'Tenant',
  'User',
  'TenantMember',
  'Contact',
  'Deal',
  'Task',
  'Product',
  'Order',
  'OrderItem',
  'Invoice',
  'Employee',
  'Project',
  'Expense',
  // Add all other tenant-scoped tables here
]

// Tables that might need special policies (e.g., shared data)
const SPECIAL_TABLES = [
  'ModuleDefinition', // Shared across all tenants
  'NewsItem', // May have tenant-specific and general items
]

async function generateRLSPolicies() {
  console.log('🔒 Generating RLS policies for tenant isolation...\n')

  const policies: string[] = []

  // Generate policies for tenant-scoped tables
  for (const table of TENANT_SCOPED_TABLES) {
    policies.push(`
-- Policies for ${table}
CREATE POLICY IF NOT EXISTS "${table}_select_tenant"
  ON "${table}"
  FOR SELECT
  USING (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
    OR EXISTS (
      SELECT 1 FROM "TenantMember" tm
      WHERE tm."tenantId" = "${table}"."tenantId"
      AND tm."userId" = auth.user_id()::text
    )
  );

CREATE POLICY IF NOT EXISTS "${table}_insert_tenant"
  ON "${table}"
  FOR INSERT
  WITH CHECK (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
  );

CREATE POLICY IF NOT EXISTS "${table}_update_tenant"
  ON "${table}"
  FOR UPDATE
  USING (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
  );

CREATE POLICY IF NOT EXISTS "${table}_delete_tenant"
  ON "${table}"
  FOR DELETE
  USING (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
  );
`)
  }

  const sql = `
-- ============================================
-- RLS POLICIES FOR TENANT ISOLATION
-- ============================================
-- Generated automatically by enable-rls-policies.ts
-- Date: ${new Date().toISOString()}

${policies.join('\n')}
`

  // Write to file
  const outputPath = path.join(__dirname, '../prisma/migrations/rls_policies.sql')
  fs.writeFileSync(outputPath, sql)
  
  console.log(`✅ Generated RLS policies file: ${outputPath}`)
  console.log(`\n📋 Next steps:`)
  console.log(`1. Review the generated policies in: ${outputPath}`)
  console.log(`2. Apply the policies using: psql < ${outputPath}`)
  console.log(`3. Or run via Supabase SQL Editor`)
}

generateRLSPolicies()
  .catch((e) => {
    console.error('❌ Error generating RLS policies:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

