/**
 * Phase 2: Tally integration - export payroll as journal entries (CSV/JSON for import)
 */
import { prisma } from '@/lib/db/prisma'

export interface TallyJournalEntry {
  date: string
  ledgerName: string
  debit: number
  credit: number
  narration?: string
}

export async function getPayrollJournalEntries(
  tenantId: string,
  options: { cycleId?: string; month?: number; year?: number }
): Promise<{ entries: TallyJournalEntry[]; summary: { totalDebit: number; totalCredit: number; employeeCount: number } }> {
  let cycleId: string | undefined = options.cycleId
  if (!cycleId && options.month != null && options.year != null) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { tenantId, month: options.month, year: options.year },
    })
    cycleId = cycle?.id
  }
  if (!cycleId) {
    return { entries: [], summary: { totalDebit: 0, totalCredit: 0, employeeCount: 0 } }
  }

  const runs = await prisma.payrollRun.findMany({
    where: { tenantId, cycleId },
    include: { employee: true, cycle: true },
  })

  const entries: TallyJournalEntry[] = []
  let totalDebit = 0
  let totalCredit = 0
  const payDate = new Date(runs[0]?.cycle?.year ?? 0, (runs[0]?.cycle?.month ?? 1) - 1, 25).toISOString().slice(0, 10)

  for (const run of runs) {
    const netPay = Number(run.netPayInr)
    const gross = Number(run.grossEarningsInr)
    const pfEmp = Number(run.pfEmployeeInr)
    const pfEmpl = Number(run.pfEmployerInr)
    const esiEmp = Number(run.esiEmployeeInr)
    const esiEmpl = Number(run.esiEmployerInr)
    const pt = Number(run.ptInr)
    const tds = Number(run.tdsInr)
    const name = `${run.employee.firstName} ${run.employee.lastName}`

    entries.push({ date: payDate, ledgerName: 'Salary - ' + name, debit: gross, credit: 0, narration: `Payroll ${run.cycle.month}/${run.cycle.year}` })
    entries.push({ date: payDate, ledgerName: 'Bank Account', debit: 0, credit: netPay, narration: `Net pay ${name}` })
    if (pfEmp + pfEmpl > 0) {
      entries.push({ date: payDate, ledgerName: 'PF Employee Contribution', debit: pfEmp, credit: 0 })
      entries.push({ date: payDate, ledgerName: 'PF Employer Contribution', debit: pfEmpl, credit: 0 })
      entries.push({ date: payDate, ledgerName: 'PF Payable', debit: 0, credit: pfEmp + pfEmpl })
    }
    if (esiEmp + esiEmpl > 0) {
      entries.push({ date: payDate, ledgerName: 'ESI Employee', debit: esiEmp, credit: 0 })
      entries.push({ date: payDate, ledgerName: 'ESI Employer', debit: esiEmpl, credit: 0 })
      entries.push({ date: payDate, ledgerName: 'ESI Payable', debit: 0, credit: esiEmp + esiEmpl })
    }
    if (pt > 0) entries.push({ date: payDate, ledgerName: 'Professional Tax', debit: pt, credit: 0 })
    if (tds > 0) entries.push({ date: payDate, ledgerName: 'TDS Payable', debit: tds, credit: 0 })

    totalDebit += gross + pfEmp + pfEmpl + esiEmp + esiEmpl + pt + tds
    totalCredit += netPay + (pfEmp + pfEmpl) + (esiEmp + esiEmpl) + tds
  }

  return {
    entries,
    summary: { totalDebit, totalCredit, employeeCount: runs.length },
  }
}

export function formatTallyExportAsCSV(entries: TallyJournalEntry[]): string {
  const header = 'Date,Ledger Name,Debit,Credit,Narration'
  const rows = entries.map(
    (e) => `${e.date},${e.ledgerName.replace(/,/g, ' ')},${e.debit},${e.credit},${e.narration ?? ''}`
  )
  return header + '\n' + rows.join('\n')
}

/** Deferred Phase 2: Tally XML format for import into Tally. */
export function formatTallyExportAsXML(entries: TallyJournalEntry[]): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const rows = entries
    .map(
      (e) =>
        `  <ENTRY><DATE>${e.date}</DATE><LEDGER>${escape(e.ledgerName)}</LEDGER><DEBIT>${e.debit}</DEBIT><CREDIT>${e.credit}</CREDIT><NARRATION>${escape(e.narration ?? '')}</NARRATION></ENTRY>`
    )
    .join('\n')
  return '<?xml version="1.0" encoding="UTF-8"?>\n<TALLY>\n<PAYROLL_JOURNAL>\n' + rows + '\n</PAYROLL_JOURNAL>\n</TALLY>'
}
