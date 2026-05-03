/**
 * Bank statement CSV parser with flexible column detection.
 * Supports common Indian bank exports: HDFC, ICICI, SBI-style headers.
 */

export interface ParsedStatementLine {
  transactionDate: Date
  description: string | null
  referenceNumber: string | null
  debitAmount: number
  creditAmount: number
  balanceAfter: number | null
  rawDescription: string | null
}

export interface ParseResult {
  lines: ParsedStatementLine[]
  headers: string[]
  columnMap: Record<string, string>
  errors: string[]
}

const DATE_HEADERS = ['date', 'transaction date', 'value date', 'txn date', 'posting date', 'transaction_date', 'value_date']
const DESC_HEADERS = ['description', 'narration', 'particulars', 'details', 'remark', 'remarks', 'narrative']
const REF_HEADERS = ['reference', 'chq no', 'chq/ref no', 'cheque no', 'ref no', 'refno', 'transaction ref', 'reference_number']
const DEBIT_HEADERS = ['debit', 'withdrawal', 'withdrawals', 'withdrawal amt', 'dr', 'debit amount']
const CREDIT_HEADERS = ['credit', 'deposit', 'deposits', 'deposit amt', 'cr', 'credit amount']
const BALANCE_HEADERS = ['balance', 'closing balance', 'running balance', 'balance amt']

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, ' ').trim()
}

function findColumnIndex(headers: string[], normalized: string[], synonyms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normalized[i]
    if (synonyms.some((s) => n.includes(s) || s.includes(n))) return i
  }
  return -1
}

/** Parse amount: strip commas, ₹, ( ) as negative */
function parseAmount(val: string): number {
  if (val == null || String(val).trim() === '') return 0
  let s = String(val).trim().replace(/,/g, '').replace(/₹|Rs\.?|INR/gi, '')
  const neg = /^\(.*\)$/.test(s) || s.startsWith('-')
  s = s.replace(/[()]/g, '').replace(/^-/, '').trim()
  const num = parseFloat(s)
  if (Number.isNaN(num)) return 0
  return neg ? -num : num
}

/** Parse date: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD */
function parseDate(val: string): Date | null {
  if (val == null || String(val).trim() === '') return null
  const s = String(val).trim()
  const d = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (d) {
    const day = parseInt(d[1], 10)
    const month = parseInt(d[2], 10) - 1
    const year = parseInt(d[3], 10)
    const date = new Date(year, month, day)
    if (!Number.isNaN(date.getTime())) return date
  }
  const iso = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (iso) {
    const date = new Date(s)
    if (!Number.isNaN(date.getTime())) return date
  }
  return null
}

export function parseCSV(csvText: string): ParseResult {
  const errors: string[] = []
  const lines: ParsedStatementLine[] = []
  const rows = csvText.split(/\r?\n/).map((r) => r.trim()).filter(Boolean)
  if (rows.length < 2) {
    return { lines: [], headers: [], columnMap: {}, errors: ['CSV has no header or data rows'] }
  }

  const headerRow = rows[0]
  const headers = parseCSVRow(headerRow)
  const normalized = headers.map(normalizeHeader)

  const dateIdx = findColumnIndex(headers, normalized, DATE_HEADERS)
  const descIdx = findColumnIndex(headers, normalized, DESC_HEADERS)
  const refIdx = findColumnIndex(headers, normalized, REF_HEADERS)
  const debitIdx = findColumnIndex(headers, normalized, DEBIT_HEADERS)
  const creditIdx = findColumnIndex(headers, normalized, CREDIT_HEADERS)
  const balanceIdx = findColumnIndex(headers, normalized, BALANCE_HEADERS)

  if (dateIdx < 0) errors.push('No date column found. Use a column named Date, Transaction Date, or Value Date.')

  const columnMap: Record<string, string> = {}
  if (dateIdx >= 0) columnMap.date = headers[dateIdx]
  if (descIdx >= 0) columnMap.description = headers[descIdx]
  if (refIdx >= 0) columnMap.reference = headers[refIdx]
  if (debitIdx >= 0) columnMap.debit = headers[debitIdx]
  if (creditIdx >= 0) columnMap.credit = headers[creditIdx]
  if (balanceIdx >= 0) columnMap.balance = headers[balanceIdx]

  for (let i = 1; i < rows.length; i++) {
    const cells = parseCSVRow(rows[i])
    if (cells.every((c) => !c || c.trim() === '')) continue
    const date = dateIdx >= 0 && cells[dateIdx] != null ? parseDate(cells[dateIdx]) : null
    if (!date) {
      errors.push(`Row ${i + 1}: invalid or missing date (${cells[dateIdx] ?? 'empty'})`)
      continue
    }
    const desc = descIdx >= 0 && cells[descIdx] != null ? String(cells[descIdx]).trim() || null : null
    const ref = refIdx >= 0 && cells[refIdx] != null ? String(cells[refIdx]).trim() || null : null
    let debit = debitIdx >= 0 && cells[debitIdx] != null ? parseAmount(cells[debitIdx]) : 0
    let credit = creditIdx >= 0 && cells[creditIdx] != null ? parseAmount(cells[creditIdx]) : 0
    if (debit < 0) {
      credit = Math.abs(debit)
      debit = 0
    }
    if (credit < 0) {
      debit = Math.abs(credit)
      credit = 0
    }
    const balance = balanceIdx >= 0 && cells[balanceIdx] != null ? parseAmount(cells[balanceIdx]) : null
    lines.push({
      transactionDate: date,
      description: desc,
      referenceNumber: ref,
      debitAmount: Math.round(debit * 100) / 100,
      creditAmount: Math.round(credit * 100) / 100,
      balanceAfter: balance != null ? Math.round(balance * 100) / 100 : null,
      rawDescription: desc,
    })
  }

  return { lines, headers, columnMap, errors }
}

/** Simple CSV row parse (handles quoted fields with commas) */
function parseCSVRow(row: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const c = row[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      cur += c
    } else if (c === ',' || c === '\t') {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

/** OFX 1.x (SGML) / 2.x (XML): extract STMTTRN blocks and parse DTPOSTED, TRNAMT, NAME, MEMO, CHECKNUM */
export interface OFXParseResult {
  lines: ParsedStatementLine[]
  errors: string[]
}

function ofxTag(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i')
  const m = block.match(regex)
  return m ? m[1].trim() || null : null
}

export function parseOFX(ofxText: string): OFXParseResult {
  const errors: string[] = []
  const lines: ParsedStatementLine[] = []
  const upper = ofxText.toUpperCase()
  const stmtTrnStart = upper.indexOf('<STMTTRN>')
  if (stmtTrnStart < 0) {
    return { lines: [], errors: ['No STMTTRN (transaction) blocks found in OFX.'] }
  }

  const rest = ofxText.slice(stmtTrnStart)
  const blockRegex = /<STMTTRN>[\s\S]*?(?=<STMTTRN>|$)/gi
  const blocks = rest.match(blockRegex) || []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const dtPosted = ofxTag(block, 'DTPOSTED')
    const trnAmt = ofxTag(block, 'TRNAMT')
    const name = ofxTag(block, 'NAME') || ofxTag(block, 'MEMO') || ofxTag(block, 'PAYEE')
    const checkNum = ofxTag(block, 'CHECKNUM') || ofxTag(block, 'REFNUM')
    const fitId = ofxTag(block, 'FITID')

    if (!dtPosted || trnAmt === null || trnAmt === undefined) {
      errors.push(`OFX transaction ${i + 1}: missing DTPOSTED or TRNAMT`)
      continue
    }
    const dateStr = dtPosted.replace(/\D/g, '').slice(0, 8)
    const y = parseInt(dateStr.slice(0, 4), 10)
    const m = parseInt(dateStr.slice(4, 6), 10) - 1
    const d = parseInt(dateStr.slice(6, 8), 10)
    const transactionDate = new Date(y, m, d)
    if (Number.isNaN(transactionDate.getTime())) {
      errors.push(`OFX transaction ${i + 1}: invalid date ${dtPosted}`)
      continue
    }
    const amt = parseFloat(String(trnAmt).replace(/,/g, ''))
    const amount = Number.isNaN(amt) ? 0 : Math.round(amt * 100) / 100
    const debitAmount = amount < 0 ? Math.abs(amount) : 0
    const creditAmount = amount >= 0 ? amount : 0
    const description = name || (fitId ? `FITID ${fitId}` : null)
    const referenceNumber = checkNum || fitId || null
    lines.push({
      transactionDate,
      description,
      referenceNumber,
      debitAmount,
      creditAmount,
      balanceAfter: null,
      rawDescription: description,
    })
  }

  return { lines, errors }
}
