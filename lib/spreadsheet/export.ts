/**
 * Convert stored spreadsheet data (legacy 2D array or x-spreadsheet format) to 2D string array.
 */
function sheetDataToArray(sheetData: Record<string, unknown>): string[][] {
  const rows = (sheetData.rows as Record<string, { cells?: Record<string, { text?: string }> }>) || {}
  const rowIndices = Object.keys(rows)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)
  if (rowIndices.length === 0) return [[]]
  const maxRow = Math.max(...rowIndices)
  const result: string[][] = []
  for (let ri = 0; ri <= maxRow; ri++) {
    const row = rows[ri]
    const cells = row?.cells || {}
    const colIndices = Object.keys(cells)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    const maxCol = colIndices.length ? Math.max(...colIndices) : -1
    const line: string[] = []
    for (let ci = 0; ci <= maxCol; ci++) {
      const cell = cells[ci]
      line.push(cell?.text != null ? String(cell.text) : '')
    }
    result.push(line)
  }
  return result
}

function isLegacyData(data: unknown): data is unknown[][] {
  return Array.isArray(data) && (data.length === 0 || Array.isArray(data[0]))
}

/** Normalize stored data to 2D string array (first sheet only) for CSV export */
export function spreadsheetDataTo2D(apiData: unknown): string[][] {
  if (apiData == null) return [[]]
  if (isLegacyData(apiData)) {
    return apiData.map((row) => (Array.isArray(row) ? row.map((c) => (c != null ? String(c) : '')) : []))
  }
  const arr = Array.isArray(apiData) ? apiData : [apiData]
  const first = arr[0] as Record<string, unknown> | undefined
  if (first && typeof first === 'object' && 'rows' in first) return sheetDataToArray(first)
  return [[]]
}

/** Escape CSV cell and join row with comma */
function escapeCsvCell(val: string): string {
  if (!val.includes('"') && !val.includes(',') && !val.includes('\n') && !val.includes('\r')) return val
  return `"${val.replace(/"/g, '""')}"`
}

/** Convert 2D array to CSV string */
export function toCsvString(grid: string[][]): string {
  return grid.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}
