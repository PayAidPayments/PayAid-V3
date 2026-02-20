import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/assets/[id]/depreciation
 * Get depreciation schedule for an asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    // Get asset details
    const asset = await prisma.asset.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Get existing depreciation records
    const depreciationRecords = await prisma.assetDepreciation.findMany({
      where: { assetId: id },
      orderBy: { period: 'asc' },
    })

    // Calculate projected schedule if needed
    const purchaseValue = asset.purchaseCostInr ? parseFloat(asset.purchaseCostInr.toString()) : 0
    const depreciationRate = asset.depreciationRate ? parseFloat(asset.depreciationRate.toString()) : 20
    const purchaseDate = asset.purchaseDate || new Date()
    const usefulLifeYears = asset.usefulLifeYears || 5

    const schedule: Array<{
      period: string
      openingValue: number
      depreciationAmount: number
      closingValue: number
    }> = []

    // Generate schedule for next 5 years or until fully depreciated
    let currentValue = purchaseValue
    const currentYear = new Date().getFullYear()
    
    for (let year = 0; year < usefulLifeYears && currentValue > 0; year++) {
      const yearValue = currentYear + year
      const existingRecord = depreciationRecords.find(
        r => new Date(r.period).getFullYear() === yearValue
      )

      if (existingRecord) {
        schedule.push({
          period: new Date(existingRecord.period).toISOString(),
          openingValue: parseFloat(existingRecord.openingValue.toString()),
          depreciationAmount: parseFloat(existingRecord.depreciationAmount.toString()),
          closingValue: parseFloat(existingRecord.closingValue.toString()),
        })
        currentValue = parseFloat(existingRecord.closingValue.toString())
      } else {
        const depreciationAmount = currentValue * (depreciationRate / 100)
        const closingValue = Math.max(0, currentValue - depreciationAmount)
        
        schedule.push({
          period: new Date(yearValue, 0, 1).toISOString(),
          openingValue: currentValue,
          depreciationAmount,
          closingValue,
        })
        currentValue = closingValue
      }
    }

    return NextResponse.json({ schedule })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
