/**
 * Tally Sync Conflict Resolution
 * Handles conflicts when syncing data between PayAid and Tally
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface Conflict {
  entityType: 'contact' | 'invoice' | 'product'
  entityId: string
  field: string
  payaidValue: unknown
  tallyValue: unknown
  conflictType: 'value_mismatch' | 'missing_in_payaid' | 'missing_in_tally' | 'timestamp_conflict'
}

export interface ResolutionStrategy {
  type: 'payaid_wins' | 'tally_wins' | 'manual' | 'merge' | 'newest_wins'
  field?: string
}

/**
 * Detect conflicts between PayAid and Tally data
 */
export async function detectConflicts(
  tenantId: string,
  entityType: 'contact' | 'invoice' | 'product',
  payaidData: Record<string, unknown>,
  tallyData: Record<string, unknown>
): Promise<Conflict[]> {
  const conflicts: Conflict[] = []

  // Compare common fields
  const commonFields = ['name', 'email', 'phone', 'address']
  if (entityType === 'invoice') {
    commonFields.push('total', 'invoiceNumber', 'invoiceDate')
  }

  for (const field of commonFields) {
    const payaidVal = payaidData[field]
    const tallyVal = tallyData[field]

    if (payaidVal !== undefined && tallyVal !== undefined && payaidVal !== tallyVal) {
      conflicts.push({
        entityType,
        entityId: payaidData.id as string,
        field,
        payaidValue: payaidVal,
        tallyValue: tallyVal,
        conflictType: 'value_mismatch',
      })
    } else if (payaidVal === undefined && tallyVal !== undefined) {
      conflicts.push({
        entityType,
        entityId: tallyData.id as string,
        field,
        payaidValue: null,
        tallyValue: tallyVal,
        conflictType: 'missing_in_payaid',
      })
    } else if (payaidVal !== undefined && tallyVal === undefined) {
      conflicts.push({
        entityType,
        entityId: payaidData.id as string,
        field,
        payaidValue: payaidVal,
        tallyValue: null,
        conflictType: 'missing_in_tally',
      })
    }
  }

  return conflicts
}

/**
 * Resolve conflicts using specified strategy
 */
export async function resolveConflicts(
  tenantId: string,
  conflicts: Conflict[],
  strategy: ResolutionStrategy
): Promise<{ resolved: number; failed: number }> {
  let resolved = 0
  let failed = 0

  for (const conflict of conflicts) {
    try {
      let resolvedValue: unknown

      switch (strategy.type) {
        case 'payaid_wins':
          resolvedValue = conflict.payaidValue
          break
        case 'tally_wins':
          resolvedValue = conflict.tallyValue
          break
        case 'newest_wins':
          // Compare timestamps if available
          resolvedValue = conflict.payaidValue // Simplified - would compare timestamps
          break
        case 'merge':
          // Merge values intelligently
          if (typeof conflict.payaidValue === 'string' && typeof conflict.tallyValue === 'string') {
            resolvedValue = conflict.payaidValue || conflict.tallyValue
          } else {
            resolvedValue = conflict.payaidValue ?? conflict.tallyValue
          }
          break
        case 'manual':
          // Skip - requires manual intervention
          continue
        default:
          resolvedValue = conflict.payaidValue
      }

      // Apply resolution
      if (conflict.entityType === 'contact') {
        await prisma.contact.update({
          where: { id: conflict.entityId, tenantId },
          data: { [conflict.field]: resolvedValue },
        })
      } else if (conflict.entityType === 'invoice') {
        await prisma.invoice.update({
          where: { id: conflict.entityId, tenantId },
          data: { [conflict.field]: resolvedValue },
        })
      }

      resolved++
    } catch (error) {
      console.error(`Failed to resolve conflict for ${conflict.entityId}:`, error)
      failed++
    }
  }

  return { resolved, failed }
}

/**
 * Get conflict resolution history
 */
export async function getConflictHistory(
  tenantId: string,
  limit = 50
): Promise<Array<Conflict & { resolvedAt: Date; strategy: string }>> {
  // In a real implementation, store conflict resolution history
  // For now, return empty array
  return []
}
