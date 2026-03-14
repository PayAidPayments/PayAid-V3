/**
 * GET /api/finance/chart-of-accounts - List accounts for journal entry dropdowns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, accountCode: true, accountName: true, accountType: true, subType: true },
      orderBy: [{ accountType: 'asc' }, { accountCode: 'asc' }],
    })

    return NextResponse.json({ accounts })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
