/**
 * Asset Depreciation Calculations
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface DepreciationResult {
  assetId: string
  assetTag: string
  purchaseCost: number
  currentValue: number
  accumulatedDepreciation: number
  annualDepreciation: number
  monthlyDepreciation: number
  remainingValue: number
  yearsRemaining: number
}

/**
 * Calculate straight-line depreciation
 */
export function calculateStraightLineDepreciation(
  purchaseCost: number,
  usefulLifeYears: number,
  yearsElapsed: number = 0
): DepreciationResult {
  const annualDepreciation = purchaseCost / usefulLifeYears
  const accumulatedDepreciation = annualDepreciation * yearsElapsed
  const currentValue = Math.max(0, purchaseCost - accumulatedDepreciation)
  const remainingValue = Math.max(0, purchaseCost - accumulatedDepreciation)
  const yearsRemaining = Math.max(0, usefulLifeYears - yearsElapsed)
  const monthlyDepreciation = annualDepreciation / 12

  return {
    assetId: '',
    assetTag: '',
    purchaseCost,
    currentValue: Math.round(currentValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    remainingValue: Math.round(remainingValue * 100) / 100,
    yearsRemaining: Math.round(yearsRemaining * 100) / 100,
  }
}

/**
 * Calculate declining balance depreciation
 */
export function calculateDecliningBalanceDepreciation(
  purchaseCost: number,
  depreciationRate: number, // Annual percentage (e.g., 20 for 20%)
  yearsElapsed: number = 0,
  currentBookValue?: number
): DepreciationResult {
  let bookValue = currentBookValue ?? purchaseCost
  let accumulatedDepreciation = 0

  for (let year = 0; year < yearsElapsed; year++) {
    const annualDepreciation = bookValue * (depreciationRate / 100)
    accumulatedDepreciation += annualDepreciation
    bookValue = Math.max(0, bookValue - annualDepreciation)
  }

  const annualDepreciation = bookValue * (depreciationRate / 100)
  const monthlyDepreciation = annualDepreciation / 12
  const remainingValue = bookValue
  const yearsRemaining = depreciationRate > 0 ? bookValue / (purchaseCost * (depreciationRate / 100)) : 0

  return {
    assetId: '',
    assetTag: '',
    purchaseCost,
    currentValue: Math.round(bookValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    remainingValue: Math.round(remainingValue * 100) / 100,
    yearsRemaining: Math.round(yearsRemaining * 100) / 100,
  }
}

/**
 * Calculate depreciation for an asset
 */
export async function calculateAssetDepreciation(
  tenantId: string,
  assetId: string
): Promise<DepreciationResult | null> {
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      tenantId,
    },
  })

  if (!asset || !asset.purchaseDate || !asset.purchaseCostInr) {
    return null
  }

  const purchaseCost = Number(asset.purchaseCostInr)
  const purchaseDate = asset.purchaseDate
  const now = new Date()
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  let result: DepreciationResult

  if (asset.depreciationMethod === 'STRAIGHT_LINE' && asset.usefulLifeYears) {
    result = calculateStraightLineDepreciation(purchaseCost, asset.usefulLifeYears, yearsElapsed)
  } else if (asset.depreciationMethod === 'DECLINING_BALANCE' && asset.depreciationRate) {
    result = calculateDecliningBalanceDepreciation(
      purchaseCost,
      Number(asset.depreciationRate),
      yearsElapsed,
      asset.currentValue ? Number(asset.currentValue) : undefined
    )
  } else {
    // Default: straight line with 5 years
    result = calculateStraightLineDepreciation(purchaseCost, 5, yearsElapsed)
  }

  result.assetId = asset.id
  result.assetTag = asset.assetTag

  // Update asset current value
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      currentValue: new Decimal(result.currentValue),
    },
  })

  return result
}

/**
 * Calculate depreciation for all assets
 */
export async function calculateAllAssetsDepreciation(tenantId: string): Promise<DepreciationResult[]> {
  const assets = await prisma.asset.findMany({
    where: {
      tenantId,
      purchaseDate: { not: null },
      purchaseCostInr: { not: null },
    },
  })

  const results = await Promise.all(
    assets.map((asset) => calculateAssetDepreciation(tenantId, asset.id))
  )

  return results.filter((r): r is DepreciationResult => r !== null)
}

