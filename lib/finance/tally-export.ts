/**
 * Tally integration: export Chart of Accounts and Financial Transactions
 * for import into Tally (CSV/JSON formats).
 */
import { prisma } from '@/lib/db/prisma'

export interface TallyCoARow {
  accountCode: string
  accountName: string
  accountType: string
  subType: string | null
  parentCode: string | null
  openingBalance: number
  currency: string
}

export interface TallyTransactionRow {
  date: string
  debitLedger: string
  creditLedger: string
  amount: number
  narration: string | null
  voucherType: string
}

export async function getCoAForTally(tenantId: string): Promise<TallyCoARow[]> {
  const accounts = await prisma.chartOfAccounts.findMany({
    where: { tenantId, isActive: true },
    select: {
      accountCode: true,
      accountName: true,
      accountType: true,
      subType: true,
      parentAccountId: true,
      openingBalance: true,
      currency: true,
      parentAccount: { select: { accountCode: true } },
    },
    orderBy: [{ accountType: 'asc' }, { accountCode: 'asc' }],
  })
  return accounts.map((a) => ({
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountType: a.accountType,
    subType: a.subType ?? null,
    parentCode: a.parentAccount?.accountCode ?? null,
    openingBalance: Number(a.openingBalance),
    currency: a.currency ?? 'INR',
  }))
}

export async function getTransactionsForTally(
  tenantId: string,
  options: { fromDate?: Date; toDate?: Date; limit?: number } = {}
): Promise<{ rows: TallyTransactionRow[]; summary: { count: number; totalAmount: number } }> {
  const { fromDate, toDate, limit = 5000 } = options
  const where: { tenantId: string; isPosted?: boolean; transactionDate?: { gte?: Date; lte?: Date } } = {
    tenantId,
    isPosted: true,
  }
  if (fromDate || toDate) {
    where.transactionDate = {}
    if (fromDate) where.transactionDate.gte = fromDate
    if (toDate) where.transactionDate.lte = toDate
  }

  const txns = await prisma.financialTransaction.findMany({
    where,
    include: {
      debitAccount: { select: { accountCode: true, accountName: true } },
      creditAccount: { select: { accountCode: true, accountName: true } },
    },
    orderBy: { transactionDate: 'asc' },
    take: limit,
  })

  const rows: TallyTransactionRow[] = txns.map((t) => ({
    date: new Date(t.transactionDate).toISOString().slice(0, 10),
    debitLedger: `${t.debitAccount.accountCode} - ${t.debitAccount.accountName}`,
    creditLedger: `${t.creditAccount.accountCode} - ${t.creditAccount.accountName}`,
    amount: Number(t.amount),
    narration: t.description ?? t.referenceNumber ?? null,
    voucherType: t.transactionType === 'journal' ? 'Journal' : 'Contra',
  }))

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0)
  return { rows, summary: { count: rows.length, totalAmount } }
}

export function formatCoAAsCSV(rows: TallyCoARow[]): string {
  const header = 'Account Code,Account Name,Account Type,Sub Type,Parent Code,Opening Balance,Currency'
  const line = (r: TallyCoARow) =>
    [r.accountCode, `"${(r.accountName || '').replace(/"/g, '""')}"`, r.accountType, r.subType ?? '', r.parentCode ?? '', r.openingBalance, r.currency].join(',')
  return header + '\n' + rows.map(line).join('\n')
}

export function formatTransactionsAsCSV(rows: TallyTransactionRow[]): string {
  const header = 'Date,Debit Ledger,Credit Ledger,Amount,Narration,Voucher Type'
  const line = (r: TallyTransactionRow) =>
    [r.date, `"${(r.debitLedger || '').replace(/"/g, '""')}"`, `"${(r.creditLedger || '').replace(/"/g, '""')}"`, r.amount, `"${(r.narration || '').replace(/"/g, '""')}"`, r.voucherType].join(',')
  return header + '\n' + rows.map(line).join('\n')
}
