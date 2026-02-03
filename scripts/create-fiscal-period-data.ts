/**
 * Create Fiscal Period Data for Testing
 * 
 * Creates fiscal periods and sample financial data for a tenant
 * Run this to fix P&L Trend and Variance Analysis API test failures
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.argv[2] || 'cmjimytmb0000snopu3p8h3b9'
  const fiscalYear = parseInt(process.argv[3]) || 2026

  console.log(`📊 Creating fiscal period data for tenant: ${tenantId}`)
  console.log(`📅 Fiscal Year: ${fiscalYear}\n`)

  try {
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    })

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`)
      return
    }

    console.log(`✓ Tenant: ${tenant.name}\n`)

    // Step 1: Create/Ensure fiscal periods exist
    console.log('1. Creating fiscal periods...')
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]

    for (let month = 1; month <= 12; month++) {
      const periodStart = new Date(fiscalYear, month - 1, 1)
      const periodEnd = new Date(fiscalYear, month, 0) // Last day of month

      await prisma.financialPeriod.upsert({
        where: {
          tenantId_fiscalYear_fiscalMonth: {
            tenantId,
            fiscalYear,
            fiscalMonth: month,
          },
        },
        create: {
          tenantId,
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
    console.log(`✓ Created/Updated 12 fiscal periods for ${fiscalYear}\n`)

    // Step 2: Get or create chart of accounts
    console.log('2. Ensuring chart of accounts exist...')
    
    const revenueAccount = await prisma.chartOfAccounts.upsert({
      where: {
        tenantId_accountCode: {
          tenantId,
          accountCode: '401',
        },
      },
      create: {
        tenantId,
        accountCode: '401',
        accountName: 'Sales Revenue',
        accountType: 'revenue',
        currency: 'INR',
        openingBalance: new Decimal(0),
        isActive: true,
      },
      update: {
        isActive: true,
      },
    })

    const expenseAccount = await prisma.chartOfAccounts.upsert({
      where: {
        tenantId_accountCode: {
          tenantId,
          accountCode: '501',
        },
      },
      create: {
        tenantId,
        accountCode: '501',
        accountName: 'Operating Expenses',
        accountType: 'expense',
        currency: 'INR',
        openingBalance: new Decimal(0),
        isActive: true,
      },
      update: {
        isActive: true,
      },
    })

    const cashAccount = await prisma.chartOfAccounts.upsert({
      where: {
        tenantId_accountCode: {
          tenantId,
          accountCode: '101',
        },
      },
      create: {
        tenantId,
        accountCode: '101',
        accountName: 'Cash Account',
        accountType: 'asset',
        subType: 'cash',
        currency: 'INR',
        openingBalance: new Decimal(0),
        isActive: true,
      },
      update: {
        isActive: true,
      },
    })

    console.log(`✓ Chart of accounts ready\n`)

    // Step 3: Create sample financial transactions for each month
    console.log('3. Creating sample financial transactions...')
    
    let transactionCount = 0
    for (let month = 1; month <= 12; month++) {
      // Create 2-3 transactions per month
      const transactionsPerMonth = 2 + (month % 2) // 2 or 3 transactions
      
      for (let i = 0; i < transactionsPerMonth; i++) {
        const day = 1 + (i * 10) // Spread across month
        const transactionDate = new Date(fiscalYear, month - 1, day)
        
        // Revenue transaction
        const revenueAmount = new Decimal(50000 + (month * 10000) + (i * 5000))
        
        await prisma.financialTransaction.create({
          data: {
            tenantId,
            transactionDate,
            transactionType: 'invoice',
            transactionCode: `INV-${fiscalYear}-${month.toString().padStart(2, '0')}-${i + 1}`,
            sourceModule: 'test_data',
            sourceId: `test-${fiscalYear}-${month}-${i}`,
            amount: revenueAmount,
            amountInBaseCurrency: revenueAmount,
            currency: 'INR',
            exchangeRate: new Decimal(1),
            description: `Test Revenue Transaction ${month}/${i + 1}`,
            debitAccountId: cashAccount.id,
            creditAccountId: revenueAccount.id,
            isPosted: true,
            postedDate: transactionDate,
          },
        })

        // Expense transaction
        const expenseAmount = new Decimal(20000 + (month * 5000) + (i * 2000))
        
        await prisma.financialTransaction.create({
          data: {
            tenantId,
            transactionDate,
            transactionType: 'expense',
            transactionCode: `EXP-${fiscalYear}-${month.toString().padStart(2, '0')}-${i + 1}`,
            sourceModule: 'test_data',
            sourceId: `test-exp-${fiscalYear}-${month}-${i}`,
            amount: expenseAmount,
            amountInBaseCurrency: expenseAmount,
            currency: 'INR',
            exchangeRate: new Decimal(1),
            description: `Test Expense Transaction ${month}/${i + 1}`,
            debitAccountId: expenseAccount.id,
            creditAccountId: cashAccount.id,
            isPosted: true,
            postedDate: transactionDate,
          },
        })

        transactionCount += 2
      }
    }
    console.log(`✓ Created ${transactionCount} financial transactions\n`)

    // Step 4: Create General Ledger entries for each period
    console.log('4. Creating General Ledger entries...')
    
    let glCount = 0
    for (let month = 1; month <= 12; month++) {
      const periodStart = new Date(fiscalYear, month - 1, 1)
      const periodEnd = new Date(fiscalYear, month, 0)

      // Get transactions for this period
      const periodTransactions = await prisma.financialTransaction.findMany({
        where: {
          tenantId,
          transactionDate: {
            gte: periodStart,
            lte: periodEnd,
          },
          isPosted: true,
        },
      })

      // Calculate totals for each account
      const accountTotals = new Map<string, { debits: Decimal; credits: Decimal }>()

      for (const txn of periodTransactions) {
        // Debit account
        const debitKey = txn.debitAccountId
        if (!accountTotals.has(debitKey)) {
          accountTotals.set(debitKey, { debits: new Decimal(0), credits: new Decimal(0) })
        }
        const debitTotals = accountTotals.get(debitKey)!
        debitTotals.debits = debitTotals.debits.add(txn.amountInBaseCurrency)

        // Credit account
        const creditKey = txn.creditAccountId
        if (!accountTotals.has(creditKey)) {
          accountTotals.set(creditKey, { debits: new Decimal(0), credits: new Decimal(0) })
        }
        const creditTotals = accountTotals.get(creditKey)!
        creditTotals.credits = creditTotals.credits.add(txn.amountInBaseCurrency)
      }

      // Create GL entries for each account
      for (const [accountId, totals] of accountTotals.entries()) {
        const account = await prisma.chartOfAccounts.findUnique({
          where: { id: accountId },
        })

        if (!account) continue

        // Calculate closing balance based on account type
        let closingBalance = totals.debits.sub(totals.credits)
        if (account.accountType === 'liability' || account.accountType === 'revenue' || account.accountType === 'equity') {
          closingBalance = totals.credits.sub(totals.debits)
        }

        await prisma.generalLedger.upsert({
          where: {
            tenantId_fiscalYear_fiscalMonth_accountId: {
              tenantId,
              fiscalYear,
              fiscalMonth: month,
              accountId,
            },
          },
          create: {
            tenantId,
            fiscalYear,
            fiscalMonth: month,
            periodStartDate: periodStart,
            periodEndDate: periodEnd,
            accountId,
            openingBalance: new Decimal(0),
            debitTotal: totals.debits,
            creditTotal: totals.credits,
            closingBalance,
            transactionCount: periodTransactions.filter(
              t => t.debitAccountId === accountId || t.creditAccountId === accountId
            ).length,
            lastUpdated: new Date(),
          },
          update: {
            debitTotal: totals.debits,
            creditTotal: totals.credits,
            closingBalance,
            transactionCount: periodTransactions.filter(
              t => t.debitAccountId === accountId || t.creditAccountId === accountId
            ).length,
            lastUpdated: new Date(),
          },
        })

        glCount++
      }
    }
    console.log(`✓ Created/Updated ${glCount} General Ledger entries\n`)

    // Step 5: Refresh materialized views
    console.log('5. Refreshing materialized views...')
    try {
      await prisma.$executeRawUnsafe('SELECT refresh_all_financial_views()')
      console.log(`✓ Materialized views refreshed\n`)
    } catch (error: any) {
      console.log(`⚠ Could not refresh views: ${error.message}\n`)
    }

    console.log('✅ Fiscal period data creation complete!')
    console.log(`\n📊 Summary:`)
    console.log(`   - Fiscal Periods: 12 months for ${fiscalYear}`)
    console.log(`   - Financial Transactions: ${transactionCount}`)
    console.log(`   - General Ledger Entries: ${glCount}`)
    console.log(`\n🎯 You can now re-run API tests:`)
    console.log(`   BASE_URL="http://localhost:3000" npx tsx scripts/test-financial-api-endpoints.ts ${tenantId}`)

  } catch (error) {
    console.error('Error creating fiscal period data:', error)
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
