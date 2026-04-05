import ExcelJS from 'exceljs'

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null) {
    if ('richText' in value && Array.isArray((value as ExcelJS.CellRichTextValue).richText)) {
      return (value as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('')
    }
    if ('formula' in value) {
      const r = (value as ExcelJS.CellFormulaValue).result
      return r == null ? '' : String(r)
    }
    if ('sharedFormula' in value) {
      const r = (value as { result?: unknown }).result
      return r == null ? '' : String(r)
    }
    if ('hyperlink' in value) return (value as ExcelJS.CellHyperlinkValue).text
    if ('error' in value) return ''
  }
  return String(value)
}

/** First worksheet as matrix of strings (for spreadsheet import / parity with former xlsx sheet_to_json header:1). */
export async function workbookFirstSheetToMatrix(buffer: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const sheet = wb.worksheets[0]
  if (!sheet) return [[]]
  const out: string[][] = []
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const vals: string[] = []
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      while (vals.length < colNumber - 1) vals.push('')
      vals[colNumber - 1] = cellValueToString(cell.value)
    })
    out.push(vals)
  })
  return out
}

function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '_').slice(0, 31) || 'Sheet1'
}

/** Single sheet from array-of-arrays (e.g. CSV grid). */
export async function xlsxBufferFromAoA(
  grid: (string | number | null | undefined)[][],
  sheetName = 'Sheet1'
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(safeSheetName(sheetName))
  for (const row of grid) {
    ws.addRow((row ?? []).map((c) => c ?? ''))
  }
  const u8 = await wb.xlsx.writeBuffer()
  return Buffer.from(u8)
}

/** Multiple sheets from header row + object rows. Skips sheets with zero rows. */
export async function xlsxBufferFromJsonSheets(
  sheets: { name: string; rows: Record<string, unknown>[] }[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  for (const { name, rows } of sheets) {
    if (!rows.length) continue
    const ws = wb.addWorksheet(safeSheetName(name))
    const keys = Object.keys(rows[0])
    ws.addRow(keys)
    for (const r of rows) {
      ws.addRow(keys.map((k) => r[k] ?? ''))
    }
  }
  if (wb.worksheets.length === 0) {
    wb.addWorksheet('Sheet1')
  }
  const u8 = await wb.xlsx.writeBuffer()
  return Buffer.from(u8)
}

/** One sheet from objects (keys = columns). Optional column widths (Excel character width, same spirit as xlsx wch). */
export async function xlsxBufferFromJsonRows(
  sheetName: string,
  rows: Record<string, unknown>[],
  columnWidths?: number[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(safeSheetName(sheetName))
  if (rows.length === 0) {
    const u8 = await wb.xlsx.writeBuffer()
    return Buffer.from(u8)
  }
  const keys = Object.keys(rows[0])
  ws.addRow(keys)
  for (const r of rows) {
    ws.addRow(keys.map((k) => r[k] ?? ''))
  }
  if (columnWidths?.length) {
    columnWidths.forEach((w, i) => {
      const col = ws.getColumn(i + 1)
      if (col) col.width = w
    })
  }
  const u8 = await wb.xlsx.writeBuffer()
  return Buffer.from(u8)
}
