/**
 * Create Budgets for Variance Analysis
 * 
 * Creates sample budgets for fiscal year 2026 to enable variance analysis
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.argv[2] || 'cmjimytmb0000snopu3p8h3b9'
  const fiscalYear = parseInt(process.argv[3]) || 2026

  console.log(`📊 Creating budgets for variance analysis`)
  console.log(`Tenant: ${tenantId}`)
  console.log(`Fiscal Year: ${fiscalYear}\n`)

  try {
    // Get revenue and expense accounts
    const revenueAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId,
        accountCode: '401',
        accountType: 'revenue',
      },
    })

    const expenseAccount = await prisma.chartOfAccounts.findFirst({
      where: {
        tenantId,
        accountCode: '501',
        accountType: 'expense',
      },
    })

    if (!revenueAccount || !expenseAccount) {
      console.error('❌ Required accounts not found. Run create-fiscal-period-data.ts first.')
      return
    }

    console.log('Creating budgets for each month...')

    let budgetCount = 0
    for (let month = 1; month <= 12; month++) {
      // Revenue budget (higher for later months)
      const revenueBudget = new Decimal(60000 + (month * 5000))
      
      await prisma.financialBudget.upsert({
        where: {
          tenantId_budgetName_fiscalYear_accountId_fiscalMonth: {
            tenantId,
            budgetName: `FY${fiscalYear} Budget`,
            fiscalYear,
            accountId: revenueAccount.id,
            fiscalMonth: month,
          },
        },
        create: {
          tenantId,
          fiscalYear,
          fiscalMonth: month,
          accountId: revenueAccount.id,
          budgetedAmount: revenueBudget,
          budgetName: `FY${fiscalYear} Budget`,
          isApproved: true,
        },
        update: {
          budgetedAmount: revenueBudget,
          isApproved: true,
        },
      })

      // Expense budget
      const expenseBudget = new Decimal(25000 + (month * 2000))
      
      await prisma.financialBudget.upsert({
        where: {
          tenantId_budgetName_fiscalYear_accountId_fiscalMonth: {
            tenantId,
            budgetName: `FY${fiscalYear} Budget`,
            fiscalYear,
            accountId: expenseAccount.id,
            fiscalMonth: month,
          },
        },
        create: {
          tenantId,
          fiscalYear,
          fiscalMonth: month,
          accountId: expenseAccount.id,
          budgetedAmount: expenseBudget,
          budgetName: `FY${fiscalYear} Budget`,
          isApproved: true,
        },
        update: {
          budgetedAmount: expenseBudget,
          isApproved: true,
        },
      })

      budgetCount += 2
    }

    console.log(`✓ Created ${budgetCount} budgets (2 per month for 12 months)\n`)
    console.log('✅ Budgets created successfully!')
    console.log('\n🎯 Variance analysis should now work.')

  } catch (error) {
    console.error('Error creating budgets:', error)
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
