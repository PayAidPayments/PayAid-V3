/**
 * Transaction Sync Service
 * Financial Dashboard Module 1.3
 * 
 * Syncs invoices and expenses to financial transactions
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export class TransactionSyncService {
  constructor(private tenantId: string) {}

  /**
   * Sync invoice to financial transaction
   */
  async syncInvoice(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice || invoice.tenantId !== this.tenantId) {
      throw new Error('Invoice not found')
    }

    // Get or create revenue account
    let revenueAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode: '401', // Sales Revenue
        accountType: 'revenue',
      },
    })

    if (!revenueAccount) {
      revenueAccount = await prisma.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode: '401',
          accountName: 'Sales Revenue',
          accountType: 'revenue',
          accountGroup: 'Revenue',
          currency: 'INR',
          isActive: true,
        },
      })
    }

    // Get or create accounts receivable account
    let arAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode: '120', // Accounts Receivable
        accountType: 'asset',
        subType: 'current_asset',
      },
    })

    if (!arAccount) {
      arAccount = await prisma.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode: '120',
          accountName: 'Accounts Receivable',
          accountType: 'asset',
          subType: 'current_asset',
          accountGroup: 'Current Assets',
          currency: 'INR',
          isActive: true,
        },
      })
    }

    // Check if transaction already exists
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        tenantId: this.tenantId,
        sourceModule: 'crm_invoice',
        sourceId: invoiceId,
      },
    })

    if (existing) {
      // Update existing transaction
      await prisma.financialTransaction.update({
        where: { id: existing.id },
        data: {
          amount: new Decimal(invoice.total),
          amountInBaseCurrency: new Decimal(invoice.total),
          description: `Invoice ${invoice.invoiceNumber}`,
          isPosted: invoice.status === 'paid',
          postedDate: invoice.status === 'paid' ? invoice.paidAt : null,
        },
      })
    } else {
      // Create new transaction
      await prisma.financialTransaction.create({
        data: {
          tenantId: this.tenantId,
          transactionDate: invoice.createdAt,
          transactionType: 'invoice',
          transactionCode: invoice.invoiceNumber,
          sourceModule: 'crm_invoice',
          sourceId: invoiceId,
          amount: new Decimal(invoice.total),
          amountInBaseCurrency: new Decimal(invoice.total),
          currency: 'INR',
          description: `Invoice ${invoice.invoiceNumber}`,
          debitAccountId: arAccount.id,
          creditAccountId: revenueAccount.id,
          isPosted: invoice.status === 'paid',
          postedDate: invoice.status === 'paid' ? invoice.paidAt : null,
        },
      })
    }

    // If invoice is paid, create payment transaction
    if (invoice.status === 'paid' && invoice.paidAt) {
      // Get or create bank account
      let bankAccount = await prisma.chartOfAccounts.findFirst({
        where: {
          tenantId: this.tenantId,
          accountCode: '101', // Bank Account
          accountType: 'asset',
          subType: 'cash',
        },
      })

      if (!bankAccount) {
        bankAccount = await prisma.chartOfAccounts.create({
          data: {
            tenantId: this.tenantId,
            accountCode: '101',
            accountName: 'Bank Account',
            accountType: 'asset',
            subType: 'cash',
            accountGroup: 'Current Assets',
            currency: 'INR',
            isActive: true,
          },
        })
      }

      // Check if payment transaction exists
      const paymentExists = await prisma.financialTransaction.findFirst({
        where: {
          tenantId: this.tenantId,
          sourceModule: 'crm_invoice',
          sourceId: `${invoiceId}_payment`,
        },
      })

      if (!paymentExists) {
        await prisma.financialTransaction.create({
          data: {
            tenantId: this.tenantId,
            transactionDate: invoice.paidAt,
            transactionType: 'payment',
            transactionCode: `PAY-${invoice.invoiceNumber}`,
            sourceModule: 'crm_invoice',
            sourceId: `${invoiceId}_payment`,
            amount: new Decimal(invoice.total),
            amountInBaseCurrency: new Decimal(invoice.total),
            currency: 'INR',
            description: `Payment received for Invoice ${invoice.invoiceNumber}`,
            debitAccountId: bankAccount.id,
            creditAccountId: arAccount.id,
            isPosted: true,
            postedDate: invoice.paidAt,
          },
        })
      }
    }
  }

  /**
   * Sync expense to financial transaction
   */
  async syncExpense(expenseId: string): Promise<void> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        expenseApprovals: true,
      },
    })

    if (!expense || expense.tenantId !== this.tenantId) {
      throw new Error('Expense not found')
    }

    // Get or create expense account based on category
    const categoryMap: Record<string, string> = {
      Travel: '501',
      Office: '502',
      Marketing: '503',
      Utilities: '504',
      Rent: '505',
    }

    const accountCode = categoryMap[expense.category] || '599' // Other Expenses

    let expenseAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode,
        accountType: 'expense',
      },
    })

    if (!expenseAccount) {
      expenseAccount = await prisma.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode,
          accountName: `${expense.category} Expenses`,
          accountType: 'expense',
          accountGroup: expense.category,
          currency: 'INR',
          isActive: true,
        },
      })
    }

    // Get or create bank account
    let bankAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode: '101',
        accountType: 'asset',
        subType: 'cash',
      },
    })

    if (!bankAccount) {
      bankAccount = await prisma.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode: '101',
          accountName: 'Bank Account',
          accountType: 'asset',
          subType: 'cash',
          accountGroup: 'Current Assets',
          currency: 'INR',
          isActive: true,
        },
      })
    }

    // Check if transaction already exists
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        tenantId: this.tenantId,
        sourceModule: 'expense',
        sourceId: expenseId,
      },
    })

    const isApproved = expense.expenseApprovals.some(
      (approval) => approval.status === 'approved'
    )

    if (existing) {
      await prisma.financialTransaction.update({
        where: { id: existing.id },
        data: {
          amount: expense.amount,
          amountInBaseCurrency: expense.amount,
          description: expense.description,
          isPosted: isApproved,
          postedDate: isApproved ? new Date() : null,
        },
      })
    } else {
      await prisma.financialTransaction.create({
        data: {
          tenantId: this.tenantId,
          transactionDate: expense.createdAt,
          transactionType: 'expense',
          transactionCode: `EXP-${expenseId.slice(0, 8)}`,
          sourceModule: 'expense',
          sourceId: expenseId,
          amount: expense.amount,
          amountInBaseCurrency: expense.amount,
          currency: 'INR',
          description: expense.description,
          debitAccountId: expenseAccount.id,
          creditAccountId: bankAccount.id,
          isPosted: isApproved,
          postedDate: isApproved ? new Date() : null,
        },
      })
    }
  }

  /**
   * Sync all invoices for tenant
   */
  async syncAllInvoices(): Promise<void> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: this.tenantId,
      },
    })

    for (const invoice of invoices) {
      await this.syncInvoice(invoice.id)
    }
  }

  /**
   * Sync all expenses for tenant
   */
  async syncAllExpenses(): Promise<void> {
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: this.tenantId,
      },
    })

    for (const expense of expenses) {
      await this.syncExpense(expense.id)
    }
  }

  /**
   * Sync all financial data for tenant
   */
  async syncAll(options?: {
    syncInvoices?: boolean
    syncPayments?: boolean
    syncExpenses?: boolean
    syncBankFeeds?: boolean
  }): Promise<void> {
    const opts = {
      syncInvoices: true,
      syncPayments: true,
      syncExpenses: true,
      syncBankFeeds: false,
      ...options,
    }

    if (opts.syncInvoices) {
      await this.syncAllInvoices()
    }

    if (opts.syncExpenses) {
      await this.syncAllExpenses()
    }

    // Payments are handled as part of invoice sync
    // Bank feeds would be handled separately
  }
}

/**
 * Sync financial data for a tenant
 * Convenience function for deployment scripts
 */
export async function syncFinancialData(
  tenantId: string,
  options?: {
    syncInvoices?: boolean
    syncPayments?: boolean
    syncExpenses?: boolean
    syncBankFeeds?: boolean
  }
): Promise<void> {
  const service = new TransactionSyncService(tenantId)
  await service.syncAll(options)
}
