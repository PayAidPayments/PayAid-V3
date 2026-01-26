/**
 * Financial Sync API Endpoint
 * POST /api/v1/financials/sync
 * 
 * Sync invoices and expenses to financial transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { TransactionSyncService } from '@/lib/services/financial/transaction-sync'
import { GLSyncService } from '@/lib/services/financial/gl-sync'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const { syncType } = body // 'invoices', 'expenses', 'all', 'gl'

    const transactionSync = new TransactionSyncService(tenantId)
    const glSync = new GLSyncService(tenantId)

    if (syncType === 'invoices' || syncType === 'all') {
      await transactionSync.syncAllInvoices()
    }

    if (syncType === 'expenses' || syncType === 'all') {
      await transactionSync.syncAllExpenses()
    }

    if (syncType === 'gl' || syncType === 'all') {
      const currentYear = new Date().getFullYear()
      await glSync.syncCurrentFiscalYear(currentYear)
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncType || 'all'}`,
    })
  } catch (error: any) {
    console.error('Financial Sync API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync financial data' },
      { status: 500 }
    )
  }
}
