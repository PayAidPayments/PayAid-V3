/**
 * Initialize Financial Dashboard Module
 * 
 * Sets up default chart of accounts and financial periods
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.env.TENANT_ID

  if (!tenantId) {
    console.error('TENANT_ID environment variable is required')
    process.exit(1)
  }

  console.log(`Initializing Financial Dashboard for tenant: ${tenantId}`)

  // Initialize default chart of accounts
  const defaultAccounts = [
    // Assets
    {
      code: '101',
      name: 'Bank Account',
      type: 'asset',
      subType: 'cash',
      group: 'Current Assets',
    },
    {
      code: '120',
      name: 'Accounts Receivable',
      type: 'asset',
      subType: 'current_asset',
      group: 'Current Assets',
    },
    // Revenue
    {
      code: '401',
      name: 'Sales Revenue',
      type: 'revenue',
      group: 'Revenue',
    },
    // Expenses
    {
      code: '501',
      name: 'Travel Expenses',
      type: 'expense',
      group: 'Travel',
    },
    {
      code: '502',
      name: 'Office Expenses',
      type: 'expense',
      group: 'Office',
    },
    {
      code: '503',
      name: 'Marketing Expenses',
      type: 'expense',
      group: 'Marketing',
    },
    {
      code: '504',
      name: 'Utilities',
      type: 'expense',
      group: 'Utilities',
    },
    {
      code: '505',
      name: 'Rent',
      type: 'expense',
      group: 'Rent',
    },
    {
      code: '599',
      name: 'Other Expenses',
      type: 'expense',
      group: 'Other',
    },
  ]

  for (const account of defaultAccounts) {
    await prisma.chartOfAccounts.upsert({
      where: {
        tenantId_accountCode: {
          tenantId,
          accountCode: account.code,
        },
      },
      create: {
        tenantId,
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
    console.log(`✓ Created/Updated account: ${account.code} - ${account.name}`)
  }

  // Initialize financial periods for current and next fiscal year
  const currentYear = new Date().getFullYear()
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

  for (const year of [currentYear, currentYear + 1]) {
    for (let month = 1; month <= 12; month++) {
      const periodStart = new Date(year, month - 1, 1)
      const periodEnd = new Date(year, month, 0)

      await prisma.financialPeriod.upsert({
        where: {
          tenantId_fiscalYear_fiscalMonth: {
            tenantId,
            fiscalYear: year,
            fiscalMonth: month,
          },
        },
        create: {
          tenantId,
          fiscalYear: year,
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
    console.log(`✓ Created/Updated periods for fiscal year: ${year}`)
  }

  console.log('Financial Dashboard initialization complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
