/**
 * Financial Period Manager
 * Financial Dashboard Module 1.3
 * 
 * Manages financial periods and ensures they exist
 */

import { prisma } from '@/lib/db/prisma'

export class FinancialPeriodManager {
  constructor(private tenantId: string) {}

  /**
   * Ensure financial periods exist for a fiscal year
   */
  async ensurePeriodsForFiscalYear(fiscalYear: number): Promise<void> {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]

    for (let month = 1; month <= 12; month++) {
      const periodStart = new Date(fiscalYear, month - 1, 1)
      const periodEnd = new Date(fiscalYear, month, 0) // Last day of month

      await prisma.financialPeriod.upsert({
        where: {
          tenantId_fiscalYear_fiscalMonth: {
            tenantId: this.tenantId,
            fiscalYear,
            fiscalMonth: month,
          },
        },
        create: {
          tenantId: this.tenantId,
          fiscalYear,
          fiscalMonth: month,
          monthName: monthNames[month - 1],
          periodStartDate: periodStart,
          periodEndDate: periodEnd,
          isClosed: false,
        },
        update: {
          monthName: monthNames[month - 1],
          periodStartDate: periodStart,
          periodEndDate: periodEnd,
        },
      })
    }
  }

  /**
   * Initialize default chart of accounts
   */
  async initializeDefaultChartOfAccounts(): Promise<void> {
    const defaultAccounts = [
      // Assets
      { code: '101', name: 'Bank Account', type: 'asset', subType: 'cash', group: 'Current Assets' },
      { code: '120', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset', group: 'Current Assets' },
      // Revenue
      { code: '401', name: 'Sales Revenue', type: 'revenue', group: 'Revenue' },
      // Expenses
      { code: '501', name: 'Travel Expenses', type: 'expense', group: 'Travel' },
      { code: '502', name: 'Office Expenses', type: 'expense', group: 'Office' },
      { code: '503', name: 'Marketing Expenses', type: 'expense', group: 'Marketing' },
      { code: '504', name: 'Utilities', type: 'expense', group: 'Utilities' },
      { code: '505', name: 'Rent', type: 'expense', group: 'Rent' },
      { code: '599', name: 'Other Expenses', type: 'expense', group: 'Other' },
    ]

    for (const account of defaultAccounts) {
      await prisma.chartOfAccounts.upsert({
        where: {
          tenantId_accountCode: {
            tenantId: this.tenantId,
            accountCode: account.code,
          },
        },
        create: {
          tenantId: this.tenantId,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type as any,
          subType: account.subType as any,
          accountGroup: account.group,
          currency: 'INR',
          isActive: true,
        },
        update: {
          accountName: account.name,
          isActive: true,
        },
      })
    }
  }
}
