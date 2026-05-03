/**
 * Sync Financial Data for All Tenants (Standalone)
 * 
 * This script syncs financial data for all active tenants
 * Uses its own PrismaClient instance to avoid server-only imports
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

class TransactionSyncService {
  constructor(private tenantId: string, private db: PrismaClient) {}

  /**
   * Sync invoice to financial transaction
   */
  async syncInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice || invoice.tenantId !== this.tenantId) {
      throw new Error('Invoice not found')
    }

    // Get or create revenue account
    let revenueAccount = await this.db.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode: '401', // Sales Revenue
        accountType: 'revenue',
      },
    })

    if (!revenueAccount) {
      revenueAccount = await this.db.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode: '401',
          accountName: 'Sales Revenue',
          accountType: 'revenue',
          currency: 'INR',
          openingBalance: new Decimal(0),
        },
      })
    }

    // Get or create accounts receivable account
    let arAccount = await this.db.chartOfAccounts.findFirst({
      where: {
        tenantId: this.tenantId,
        accountCode: '120', // Accounts Receivable
        accountType: 'asset',
        subType: 'current_asset',
      },
    })

    if (!arAccount) {
      arAccount = await this.db.chartOfAccounts.create({
        data: {
          tenantId: this.tenantId,
          accountCode: '120',
          accountName: 'Accounts Receivable',
          accountType: 'asset',
          subType: 'current_asset',
          currency: 'INR',
          openingBalance: new Decimal(0),
        },
      })
    }

    // Check if transaction already exists
    const existing = await this.db.financialTransaction.findFirst({
      where: {
        tenantId: this.tenantId,
        sourceModule: 'crm_invoice',
        sourceId: invoiceId,
      },
    })

    if (existing) {
      console.log(`  ⏭️  Invoice ${invoiceId} already synced`)
      return
    }

    // Create financial transaction
    const amount = new Decimal(invoice.totalAmount || 0)
    
    await this.db.financialTransaction.create({
      data: {
        tenantId: this.tenantId,
        transactionDate: invoice.invoiceDate || new Date(),
        transactionType: 'invoice',
        transactionCode: invoice.invoiceNumber || `INV-${invoiceId}`,
        sourceModule: 'crm_invoice',
        sourceId: invoiceId,
        amount,
        amountInBaseCurrency: amount,
        currency: 'INR',
        exchangeRate: new Decimal(1),
        description: `Invoice ${invoice.invoiceNumber || invoiceId}`,
        debitAccountId: arAccount.id,
        creditAccountId: revenueAccount.id,
        isPosted: invoice.status === 'paid' || invoice.status === 'posted',
        postedDate: invoice.status === 'paid' ? new Date() : null,
        relatedEntityId: invoice.contactId || undefined,
        relatedEntityType: invoice.contactId ? 'customer' : undefined,
      },
    })

    console.log(`  ✓ Synced invoice ${invoice.invoiceNumber || invoiceId}`)
  }

  /**
   * Sync all invoices for tenant
   */
  async syncAllInvoices(): Promise<void> {
    const invoices = await this.db.invoice.findMany({
      where: {
        tenantId: this.tenantId,
      },
    })

    console.log(`  Found ${invoices.length} invoices to sync`)

    for (const invoice of invoices) {
      try {
        await this.syncInvoice(invoice.id)
      } catch (error: any) {
        console.error(`  ✗ Error syncing invoice ${invoice.id}:`, error.message)
      }
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
      syncExpenses: false,
      syncBankFeeds: false,
      ...options,
    }

    if (opts.syncInvoices) {
      await this.syncAllInvoices()
    }
  }
}

async function main() {
  console.log('🔄 Syncing financial data for all tenants...\n')

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`Found ${tenants.length} active tenants\n`)

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant.id})`)

      try {
        const service = new TransactionSyncService(tenant.id, prisma)
        await service.syncAll({
          syncInvoices: true,
          syncPayments: true,
          syncExpenses: false,
          syncBankFeeds: false,
        })

        console.log(`✅ Synced financial data for ${tenant.name}\n`)
      } catch (error: any) {
        console.error(`❌ Error syncing ${tenant.name}:`, error.message)
        console.error('')
        // Continue with other tenants
      }
    }

    console.log('✅ Financial data sync complete!')
  } catch (error) {
    console.error('Error syncing financial data:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
