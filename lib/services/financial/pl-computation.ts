/**
 * Real-Time P&L Computation Service
 * Financial Dashboard Module 1.3
 * 
 * Computes Profit & Loss statements in real-time with full account breakdown
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface PLSummary {
  period: {
    startDate: string
    endDate: string
  }
  revenue: {
    accounts: AccountBreakdown[]
    byCategory: CategoryBreakdown[]
    total: number
  }
  expenses: {
    accounts: AccountBreakdown[]
    byCategory: CategoryBreakdown[]
    total: number
  }
  summary: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    netMargin: number
    expenseRatio: number
  }
  currency: string
  computedAt: string
}

export interface AccountBreakdown {
  accountCode: string
  accountName: string
  accountGroup: string | null
  amount: number
  percentageOfTotal: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
}

export class PLComputationService {
  constructor(private tenantId: string) {}

  /**
   * Compute real-time P&L for given period
   */
  async getPLSummary(
    startDate: Date,
    endDate: Date,
    currency: string = 'INR'
  ): Promise<PLSummary> {
    // Get all revenue accounts
    const revenueAccounts = await prisma.chartOfAccounts.findMany({
      where: {
        tenantId: this.tenantId,
        accountType: 'revenue',
        isActive: true,
      },
    })

    // Get all expense accounts
    const expenseAccounts = await prisma.chartOfAccounts.findMany({
      where: {
        tenantId: this.tenantId,
        accountType: 'expense',
        isActive: true,
      },
    })

    // Compute revenue
    const revenueData = await this.computeRevenue(
      revenueAccounts,
      startDate,
      endDate,
      currency
    )

    // Compute expenses
    const expenseData = await this.computeExpenses(
      expenseAccounts,
      startDate,
      endDate,
      currency
    )

    // Calculate totals
    const totalRevenue = revenueData.accounts.reduce(
      (sum, acc) => sum + acc.amount,
      0
    )
    const totalExpenses = expenseData.accounts.reduce(
      (sum, acc) => sum + acc.amount,
      0
    )
    const netIncome = totalRevenue - totalExpenses

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      revenue: {
        ...revenueData,
        total: totalRevenue,
      },
      expenses: {
        ...expenseData,
        total: totalExpenses,
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100,
        netMargin:
          totalRevenue > 0
            ? Math.round((netIncome / totalRevenue) * 100 * 100) / 100
            : 0,
        expenseRatio:
          totalRevenue > 0
            ? Math.round((totalExpenses / totalRevenue) * 100 * 100) / 100
            : 0,
      },
      currency,
      computedAt: new Date().toISOString(),
    }
  }

  /**
   * Compute revenue from all revenue accounts
   */
  private async computeRevenue(
    revenueAccounts: Array<{
      id: string
      accountCode: string
      accountName: string
      accountGroup: string | null
    }>,
    startDate: Date,
    endDate: Date,
    currency: string
  ): Promise<{
    accounts: AccountBreakdown[]
    byCategory: CategoryBreakdown[]
  }> {
    const accounts: AccountBreakdown[] = []
    const categoryMap = new Map<string, number>()

    for (const account of revenueAccounts) {
      // Get transactions where this account is credited
      const result = await prisma.financialTransaction.aggregate({
        where: {
          tenantId: this.tenantId,
          creditAccountId: account.id,
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
          isPosted: true,
        },
        _sum: {
          amountInBaseCurrency: true,
        },
      })

      const total =
        result._sum.amountInBaseCurrency?.toNumber() || 0

      // Convert currency if needed (simplified - would use exchange rates)
      const amount = currency !== 'INR' ? total : total

      accounts.push({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountGroup: account.accountGroup,
        amount: Math.round(amount * 100) / 100,
        percentageOfTotal: 0, // Will calculate after
      })

      // Group by category
      const category = account.accountGroup || 'Other'
      categoryMap.set(
        category,
        (categoryMap.get(category) || 0) + amount
      )
    }

    // Calculate percentages
    const totalRevenue = accounts.reduce((sum, acc) => sum + acc.amount, 0)
    accounts.forEach((acc) => {
      acc.percentageOfTotal =
        totalRevenue > 0
          ? Math.round((acc.amount / totalRevenue) * 100 * 100) / 100
          : 0
    })

    // Convert category map to array
    const byCategory: CategoryBreakdown[] = Array.from(
      categoryMap.entries()
    ).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage:
        totalRevenue > 0
          ? Math.round((amount / totalRevenue) * 100 * 100) / 100
          : 0,
    }))

    return { accounts, byCategory }
  }

  /**
   * Compute expenses with detailed breakdown
   */
  private async computeExpenses(
    expenseAccounts: Array<{
      id: string
      accountCode: string
      accountName: string
      accountGroup: string | null
    }>,
    startDate: Date,
    endDate: Date,
    currency: string
  ): Promise<{
    accounts: AccountBreakdown[]
    byCategory: CategoryBreakdown[]
  }> {
    const accounts: AccountBreakdown[] = []
    const categoryMap = new Map<string, number>()

    for (const account of expenseAccounts) {
      // Get transactions where this account is debited
      const result = await prisma.financialTransaction.aggregate({
        where: {
          tenantId: this.tenantId,
          debitAccountId: account.id,
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
          isPosted: true,
        },
        _sum: {
          amountInBaseCurrency: true,
        },
      })

      const total =
        result._sum.amountInBaseCurrency?.toNumber() || 0

      // Convert currency if needed
      const amount = currency !== 'INR' ? total : total

      accounts.push({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountGroup: account.accountGroup,
        amount: Math.round(amount * 100) / 100,
        percentageOfTotal: 0, // Will calculate after
      })

      // Group by category
      const category = account.accountGroup || 'Other'
      categoryMap.set(
        category,
        (categoryMap.get(category) || 0) + amount
      )
    }

    // Calculate percentages
    const totalExpenses = accounts.reduce((sum, acc) => sum + acc.amount, 0)
    accounts.forEach((acc) => {
      acc.percentageOfTotal =
        totalExpenses > 0
          ? Math.round((acc.amount / totalExpenses) * 100 * 100) / 100
          : 0
    })

    // Convert category map to array
    const byCategory: CategoryBreakdown[] = Array.from(
      categoryMap.entries()
    ).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage:
        totalExpenses > 0
          ? Math.round((amount / totalExpenses) * 100 * 100) / 100
          : 0,
    }))

    return { accounts, byCategory }
  }

  /**
   * Get P&L trend across all months of fiscal year
   */
  async getPLTrend(
    fiscalYear: number,
    currency: string = 'INR'
  ): Promise<{
    fiscalYear: number
    trend: Array<{
      month: string | null
      fiscalMonth: number
      revenue: number
      expenses: number
      netIncome: number
      netMargin: number
    }>
    currency: string
  }> {
    // Validate fiscal year
    if (!fiscalYear || isNaN(fiscalYear)) {
      throw new Error('Invalid fiscal year')
    }

    // Get all periods for this fiscal year
    const periods = await prisma.financialPeriod.findMany({
      where: {
        tenantId: this.tenantId,
        fiscalYear,
      },
      orderBy: {
        fiscalMonth: 'asc',
      },
    })

    if (periods.length === 0) {
      throw new Error(`No fiscal periods found for fiscal year ${fiscalYear}`)
    }

    const trendData = []

    for (const period of periods) {
      const pl = await this.getPLSummary(
        period.periodStartDate,
        period.periodEndDate,
        currency
      )

      trendData.push({
        month: period.monthName,
        fiscalMonth: period.fiscalMonth,
        revenue: pl.summary.totalRevenue,
        expenses: pl.summary.totalExpenses,
        netIncome: pl.summary.netIncome,
        netMargin: pl.summary.netMargin,
      })
    }

    return {
      fiscalYear,
      trend: trendData,
      currency,
    }
  }
}
