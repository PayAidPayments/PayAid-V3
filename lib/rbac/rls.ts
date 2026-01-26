import { prisma } from '../db/prisma'
import type { JWTPayload } from '../auth/jwt'

/**
 * Phase 1: Row-Level Security (RLS) Helpers
 * Based on PayAid V3 Architecture Document
 * 
 * Note: Actual RLS policies must be created in PostgreSQL via migrations.
 * This file provides helper functions to set RLS context.
 */

/**
 * Set RLS context for a database session
 * This sets PostgreSQL session variables that RLS policies can use
 * 
 * Note: Prisma doesn't directly support setting session variables.
 * For Supabase, use the Supabase client's RLS features.
 * For direct PostgreSQL, you would need to execute raw SQL.
 */
export async function setRLSContext(tenantId: string, userId: string) {
  // For Supabase, RLS is handled automatically via the service role key
  // or by using the authenticated user's JWT token
  
  // For direct PostgreSQL connections, you would execute:
  // await prisma.$executeRaw`SET app.current_tenant_id = ${tenantId}::uuid`
  // await prisma.$executeRaw`SET app.current_user_id = ${userId}::uuid`
  
  // Store in a context that can be accessed by queries
  // This is a simplified approach - in production, use proper context management
  return {
    tenantId,
    userId,
  }
}

/**
 * Create a tenant-aware Prisma client wrapper
 * Automatically filters queries by tenant_id
 */
export class TenantAwareDB {
  constructor(
    private tenantId: string,
    private userId?: string
  ) {}

  /**
   * Select with automatic tenant filtering
   */
  async select<T extends { tenantId: string }>(
    model: any,
    where: any = {}
  ): Promise<T[]> {
    return model.findMany({
      where: {
        ...where,
        tenantId: this.tenantId,
      },
    })
  }

  /**
   * Insert with automatic tenant assignment
   */
  async insert<T extends { tenantId: string }>(
    model: any,
    data: Omit<T, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    return model.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    })
  }

  /**
   * Update with tenant validation
   */
  async update<T extends { tenantId: string }>(
    model: any,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    // First verify the record belongs to the tenant
    const existing = await model.findUnique({
      where: { id },
    })

    if (!existing || existing.tenantId !== this.tenantId) {
      throw new Error('Record not found or unauthorized')
    }

    return model.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete with tenant validation
   */
  async delete<T extends { tenantId: string }>(
    model: any,
    id: string
  ): Promise<T> {
    // First verify the record belongs to the tenant
    const existing = await model.findUnique({
      where: { id },
    })

    if (!existing || existing.tenantId !== this.tenantId) {
      throw new Error('Record not found or unauthorized')
    }

    return model.delete({
      where: { id },
    })
  }
}

/**
 * Validate tenant context from JWT token
 */
export function validateTenantContext(token: JWTPayload, requiredTenantId?: string): void {
  const tokenTenantId = token.tenant_id || token.tenantId
  
  if (!tokenTenantId) {
    throw new Error('No tenant context in token')
  }

  if (requiredTenantId && tokenTenantId !== requiredTenantId) {
    throw new Error('Tenant mismatch')
  }
}

/**
 * SQL template for creating RLS policies
 * These should be run as database migrations
 */
export const RLS_POLICY_TEMPLATES = {
  // Enable RLS on a table
  enableRLS: (tableName: string) => `
    ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
  `,

  // Policy: Users can only see records from their tenant
  tenantIsolation: (tableName: string) => `
    CREATE POLICY "${tableName}_tenant_isolation" ON ${tableName}
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text);
  `,

  // Policy: Users can only see their own records
  ownRecords: (tableName: string, userIdColumn: string = 'created_by') => `
    CREATE POLICY "${tableName}_own_records" ON ${tableName}
    FOR SELECT
    USING (
      tenant_id = current_setting('app.current_tenant_id', true)::text
      AND ${userIdColumn} = current_setting('app.current_user_id', true)::text
    );
  `,

  // Policy: Admins can see all records in tenant
  adminAccess: (tableName: string) => `
    CREATE POLICY "${tableName}_admin_access" ON ${tableName}
    FOR ALL
    USING (
      tenant_id = current_setting('app.current_tenant_id', true)::text
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = current_setting('app.current_user_id', true)::text
          AND r.role_name = 'admin'
      )
    );
  `,
}

/**
 * Generate RLS policies for a table
 */
export function generateRLSPolicies(tableName: string, options: {
  enableTenantIsolation?: boolean
  enableOwnRecords?: boolean
  enableAdminAccess?: boolean
  userIdColumn?: string
}): string[] {
  const policies: string[] = []

  // Enable RLS
  policies.push(RLS_POLICY_TEMPLATES.enableRLS(tableName))

  // Tenant isolation (always enabled)
  if (options.enableTenantIsolation !== false) {
    policies.push(RLS_POLICY_TEMPLATES.tenantIsolation(tableName))
  }

  // Own records policy
  if (options.enableOwnRecords) {
    policies.push(
      RLS_POLICY_TEMPLATES.ownRecords(tableName, options.userIdColumn)
    )
  }

  // Admin access policy
  if (options.enableAdminAccess) {
    policies.push(RLS_POLICY_TEMPLATES.adminAccess(tableName))
  }

  return policies
}
