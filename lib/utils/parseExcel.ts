import ExcelJS from 'exceljs'

/**
 * Parse XLSX/XLS buffer to array of row objects (first row = headers).
 * Replaces xlsx.utils.sheet_to_json for security (exceljs has no known audit issues).
 */
export async function parseExcelToRows(buffer: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headers: string[] = []
  const rows: Record<string, unknown>[] = []

  sheet.eachRow((row, rowNumber) => {
    const values = row.values as (string | number | undefined)[]
    if (rowNumber === 1) {
      for (let i = 1; i < (values?.length ?? 0); i++) {
        headers.push(String(values[i] ?? '').trim())
      }
    } else {
      const obj: Record<string, unknown> = {}
      for (let i = 0; i < headers.length; i++) {
        const v = values?.[i + 1]
        obj[headers[i]] = v === undefined || v === null ? '' : v
      }
      rows.push(obj)
    }
  })

  return rows
}
