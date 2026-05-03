/**
 * General Ledger Sync Service
 * Financial Dashboard Module 1.3
 * 
 * Syncs transactions to General Ledger for performance
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export class GLSyncService {
  constructor(private tenantId: string) {}

  /**
   * Sync all transactions to General Ledger for a period
   */
  async syncPeriod(
    fiscalYear: number,
    fiscalMonth: number,
    periodStartDate: Date,
    periodEndDate: Date
  ): Promise<void> {
    // Get all posted transactions for this period
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        tenantId: this.tenantId,
        transactionDate: {
          gte: periodStartDate,
          lte: periodEndDate,
        },
        isPosted: true,
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    })

    // Get all unique accounts involved
    const accountIds = new Set<string>()
    transactions.forEach((trans) => {
      accountIds.add(trans.debitAccountId)
      accountIds.add(trans.creditAccountId)
    })

    // Sync each account
    for (const accountId of accountIds) {
      await this.syncAccountForPeriod(
        accountId,
        fiscalYear,
        fiscalMonth,
        periodStartDate,
        periodEndDate,
        transactions
      )
    }
  }

  /**
   * Sync a specific account for a period
   */
  private async syncAccountForPeriod(
    accountId: string,
    fiscalYear: number,
    fiscalMonth: number,
    periodStartDate: Date,
    periodEndDate: Date,
    transactions: Array<{
      debitAccountId: string
      creditAccountId: string
      amountInBaseCurrency: Decimal
    }>
  ): Promise<void> {
    // Get account
    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: accountId },
    })

    if (!account) return

    // Calculate opening balance (from previous period)
    const previousPeriod = await prisma.generalLedger.findFirst({
      where: {
        tenantId: this.tenantId,
        accountId,
        OR: [
          {
            fiscalYear: fiscalYear - 1,
            fiscalMonth: 12,
          },
          {
            fiscalYear,
            fiscalMonth: fiscalMonth - 1,
          },
        ],
      },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalMonth: 'desc' },
      ],
    })

    const openingBalance = previousPeriod?.closingBalance || account.openingBalance

    // Calculate debits and credits for this account
    let debitTotal = new Decimal(0)
    let creditTotal = new Decimal(0)
    let transactionCount = 0

    for (const trans of transactions) {
      if (trans.debitAccountId === accountId) {
        debitTotal = debitTotal.add(trans.amountInBaseCurrency)
        transactionCount++
      }
      if (trans.creditAccountId === accountId) {
        creditTotal = creditTotal.add(trans.amountInBaseCurrency)
        transactionCount++
      }
    }

    // Calculate closing balance based on account type
    let closingBalance: Decimal
    if (account.accountType === 'asset' || account.accountType === 'expense') {
      // Assets and Expenses: Opening + Debits - Credits
      closingBalance = openingBalance.add(debitTotal).sub(creditTotal)
    } else {
      // Liabilities, Equity, Revenue: Opening + Credits - Debits
      closingBalance = openingBalance.add(creditTotal).sub(debitTotal)
    }

    // Upsert GL record
    await prisma.generalLedger.upsert({
      where: {
        tenantId_fiscalYear_fiscalMonth_accountId: {
          tenantId: this.tenantId,
          fiscalYear,
          fiscalMonth,
          accountId,
        },
      },
      create: {
        tenantId: this.tenantId,
        fiscalYear,
        fiscalMonth,
        periodStartDate,
        periodEndDate,
        accountId,
        openingBalance,
        debitTotal,
        creditTotal,
        closingBalance,
        transactionCount,
        lastUpdated: new Date(),
      },
      update: {
        openingBalance,
        debitTotal,
        creditTotal,
        closingBalance,
        transactionCount,
        lastUpdated: new Date(),
      },
    })
  }

  /**
   * Sync all periods for current fiscal year
   */
  async syncCurrentFiscalYear(fiscalYear: number): Promise<void> {
    const periods = await prisma.financialPeriod.findMany({
      where: {
        tenantId: this.tenantId,
        fiscalYear,
      },
    })

    for (const period of periods) {
      await this.syncPeriod(
        period.fiscalYear,
        period.fiscalMonth,
        period.periodStartDate,
        period.periodEndDate
      )
    }
  }
}
