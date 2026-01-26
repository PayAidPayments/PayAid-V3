/**
 * Variance Detection Service
 * Financial Dashboard Module 1.3
 * 
 * Automated variance analysis and anomaly detection
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface VarianceRecord {
  accountCode: string
  accountName: string
  accountType: string
  budgeted: number
  actual: number
  variance: number
  variancePercentage: number
  varianceType: 'favorable' | 'unfavorable' | 'neutral'
  requiresInvestigation: boolean
}

export interface VarianceSummary {
  period: {
    fiscalYear: number
    fiscalMonth: number
  }
  summary: {
    totalFavorableVariances: number
    totalUnfavorableVariances: number
    accountsRequiringInvestigation: number
  }
  favorable: VarianceRecord[]
  unfavorable: VarianceRecord[]
  topVariances: VarianceRecord[]
}

export interface AnomalyDetection {
  accountId: string
  periodsAnalyzed: number
  mean: number
  stdDev: number
  anomaliesDetected: number
  anomalies: Array<{
    month: number
    year: number
    amount: number
    zScore: number
    deviationFromMean: number
  }>
}

export class VarianceDetectionService {
  constructor(private tenantId: string) {}

  /**
   * Compute variance for specific period
   */
  async computePeriodVariance(
    fiscalYear: number,
    fiscalMonth: number
  ): Promise<VarianceRecord[]> {
    // Get budgets for this period
    const budgets = await prisma.financialBudget.findMany({
      where: {
        tenantId: this.tenantId,
        fiscalYear,
        fiscalMonth,
      },
      include: {
        account: true,
      },
    })

    const variances: VarianceRecord[] = []

    for (const budget of budgets) {
      // Get GL closing balance for this account
      const gl = await prisma.generalLedger.findUnique({
        where: {
          tenantId_fiscalYear_fiscalMonth_accountId: {
            tenantId: this.tenantId,
            fiscalYear,
            fiscalMonth,
            accountId: budget.accountId,
          },
        },
      })

      const actualAmount = gl?.closingBalance.toNumber() || 0
      const budgetedAmount = budget.budgetedAmount.toNumber()

      // Calculate variance
      const varianceAmount = actualAmount - budgetedAmount
      const variancePct =
        budgetedAmount !== 0
          ? (varianceAmount / budgetedAmount) * 100
          : 0

      // Determine if variance is favorable
      // For revenue: actual > budget (positive variance) is favorable
      // For expense: actual < budget (negative variance) is favorable
      const isFavorable =
        (budget.account.accountType === 'revenue' && varianceAmount > 0) ||
        (budget.account.accountType === 'expense' && varianceAmount < 0)

      const varianceType = isFavorable
        ? 'favorable'
        : varianceAmount === 0
          ? 'neutral'
          : 'unfavorable'

      // Store variance record
      await prisma.financialVariance.upsert({
        where: {
          tenantId_fiscalYear_fiscalMonth_accountId: {
            tenantId: this.tenantId,
            fiscalYear,
            fiscalMonth,
            accountId: budget.accountId,
          },
        },
        create: {
          tenantId: this.tenantId,
          fiscalYear,
          fiscalMonth,
          accountId: budget.accountId,
          budgetedAmount: new Decimal(budgetedAmount),
          actualAmount: new Decimal(actualAmount),
          varianceAmount: new Decimal(varianceAmount),
          variancePercentage: new Decimal(variancePct),
          varianceType,
          requiresInvestigation: Math.abs(variancePct) > 10,
        },
        update: {
          budgetedAmount: new Decimal(budgetedAmount),
          actualAmount: new Decimal(actualAmount),
          varianceAmount: new Decimal(varianceAmount),
          variancePercentage: new Decimal(variancePct),
          varianceType,
          requiresInvestigation: Math.abs(variancePct) > 10,
          computedAt: new Date(),
        },
      })

      variances.push({
        accountCode: budget.account.accountCode,
        accountName: budget.account.accountName,
        accountType: budget.account.accountType,
        budgeted: Math.round(budgetedAmount * 100) / 100,
        actual: Math.round(actualAmount * 100) / 100,
        variance: Math.round(varianceAmount * 100) / 100,
        variancePercentage: Math.round(variancePct * 100) / 100,
        varianceType,
        requiresInvestigation: Math.abs(variancePct) > 10,
      })
    }

    // Sort by variance percentage (descending)
    variances.sort(
      (a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage)
    )

    return variances
  }

  /**
   * Get summary of variances for period
   */
  async getVarianceSummary(
    fiscalYear: number,
    fiscalMonth: number
  ): Promise<VarianceSummary> {
    const variances = await this.computePeriodVariance(fiscalYear, fiscalMonth)

    const favorable = variances.filter((v) => v.varianceType === 'favorable')
    const unfavorable = variances.filter(
      (v) => v.varianceType === 'unfavorable'
    )

    return {
      period: {
        fiscalYear,
        fiscalMonth,
      },
      summary: {
        totalFavorableVariances: favorable.length,
        totalUnfavorableVariances: unfavorable.length,
        accountsRequiringInvestigation: variances.filter(
          (v) => v.requiresInvestigation
        ).length,
      },
      favorable,
      unfavorable,
      topVariances: variances.slice(0, 10),
    }
  }

  /**
   * Detect statistical anomalies using Z-score method
   */
  async detectAnomalies(
    accountId: string,
    monthsLookback: number = 12
  ): Promise<AnomalyDetection> {
    // Get historical GL data
    const glRecords = await prisma.generalLedger.findMany({
      where: {
        tenantId: this.tenantId,
        accountId,
      },
      orderBy: [
        { fiscalYear: 'asc' },
        { fiscalMonth: 'asc' },
      ],
      take: monthsLookback,
    })

    if (glRecords.length < 3) {
      return {
        accountId,
        periodsAnalyzed: glRecords.length,
        mean: 0,
        stdDev: 0,
        anomaliesDetected: 0,
        anomalies: [],
      }
    }

    // Extract amounts
    const amounts = glRecords.map((r) => r.closingBalance.toNumber())

    // Calculate mean
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length

    // Calculate standard deviation
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length
    const stdDev = Math.sqrt(variance)

    // Detect anomalies (Z-score > 2)
    const anomalies = []

    for (let i = 0; i < glRecords.length; i++) {
      const amount = amounts[i]
      const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0

      if (Math.abs(zScore) > 2) {
        anomalies.push({
          month: glRecords[i].fiscalMonth,
          year: glRecords[i].fiscalYear,
          amount: Math.round(amount * 100) / 100,
          zScore: Math.round(zScore * 100) / 100,
          deviationFromMean: Math.round((amount - mean) * 100) / 100,
        })
      }
    }

    return {
      accountId,
      periodsAnalyzed: glRecords.length,
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      anomaliesDetected: anomalies.length,
      anomalies,
    }
  }
}
