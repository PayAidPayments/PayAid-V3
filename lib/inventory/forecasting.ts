/**
 * Inventory Forecasting and Reorder Point Calculation
 */

import { prisma } from '@/lib/db/prisma'

export interface ForecastResult {
  productId: string
  productName: string
  currentStock: number
  averageDailySales: number
  forecastedDaysRemaining: number
  recommendedReorderQuantity: number
  reorderPoint: number
  safetyStock: number
}

/**
 * Calculate inventory forecast for a product
 */
export async function calculateInventoryForecast(
  tenantId: string,
  productId: string,
  days: number = 30
): Promise<ForecastResult | null> {
  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId, tenantId },
  })

  if (!product) {
    return null
  }

  // Get sales history for the last N days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        tenantId,
        status: 'confirmed',
        createdAt: { gte: startDate },
      },
    },
    select: {
      quantity: true,
      order: {
        select: {
          createdAt: true,
        },
      },
    },
  })

  // Calculate average daily sales
  const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const averageDailySales = days > 0 ? totalSold / days : 0

  // Calculate forecasted days remaining
  const forecastedDaysRemaining = averageDailySales > 0
    ? Math.floor(product.quantity / averageDailySales)
    : Infinity

  // Calculate safety stock (7 days of average sales)
  const safetyStock = Math.ceil(averageDailySales * 7)

  // Calculate reorder point (safety stock + lead time demand)
  // Assuming 5 days lead time
  const leadTimeDays = 5
  const leadTimeDemand = Math.ceil(averageDailySales * leadTimeDays)
  const reorderPoint = safetyStock + leadTimeDemand

  // Recommended reorder quantity (30 days of sales)
  const recommendedReorderQuantity = Math.ceil(averageDailySales * 30)

  return {
    productId: product.id,
    productName: product.name,
    currentStock: product.quantity,
    averageDailySales: Math.round(averageDailySales * 100) / 100,
    forecastedDaysRemaining,
    recommendedReorderQuantity,
    reorderPoint,
    safetyStock,
  }
}

/**
 * Get all products that need reordering
 */
export async function getProductsNeedingReorder(
  tenantId: string,
  days: number = 30
): Promise<ForecastResult[]> {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      quantity: { lte: prisma.product.fields.reorderLevel },
    },
  })

  const forecasts = await Promise.all(
    products.map((product) => calculateInventoryForecast(tenantId, product.id, days))
  )

  return forecasts.filter((f): f is ForecastResult => f !== null)
}

/**
 * ABC Analysis - Classify products by value
 */
export interface ABCAnalysis {
  productId: string
  productName: string
  category: 'A' | 'B' | 'C'
  annualValue: number
  cumulativePercentage: number
}

export async function performABCAnalysis(tenantId: string): Promise<ABCAnalysis[]> {
  const products = await prisma.product.findMany({
    where: { tenantId },
    include: {
      orderItems: {
        where: {
          order: {
            tenantId,
            status: 'confirmed',
            createdAt: {
              gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
            },
          },
        },
        select: {
          quantity: true,
          price: true,
        },
      },
    },
  })

  // Calculate annual value for each product
  const productValues = products.map((product) => {
    const annualValue = product.orderItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.price),
      0
    )
    return {
      productId: product.id,
      productName: product.name,
      annualValue,
    }
  })

  // Sort by value descending
  productValues.sort((a, b) => b.annualValue - a.annualValue)

  // Calculate total value
  const totalValue = productValues.reduce((sum, p) => sum + p.annualValue, 0)

  // Classify as A, B, or C
  let cumulativeValue = 0
  const abcAnalysis: ABCAnalysis[] = productValues.map((product, index) => {
    cumulativeValue += product.annualValue
    const cumulativePercentage = (cumulativeValue / totalValue) * 100

    let category: 'A' | 'B' | 'C'
    if (cumulativePercentage <= 80) {
      category = 'A' // Top 80% of value
    } else if (cumulativePercentage <= 95) {
      category = 'B' // Next 15% of value
    } else {
      category = 'C' // Bottom 5% of value
    }

    return {
      productId: product.productId,
      productName: product.productName,
      category,
      annualValue: Math.round(product.annualValue),
      cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
    }
  })

  return abcAnalysis
}

