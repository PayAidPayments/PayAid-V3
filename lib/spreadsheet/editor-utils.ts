/**
 * Utilities for spreadsheet editor: find/replace, sort, filter, pivot.
 */

/** Replace find with replace in grid. If replaceAll, replace all; else only first occurrence. Returns { grid, count }. */
export function applyFindReplace(
  grid: string[][],
  find: string,
  replace: string,
  replaceAll: boolean
): { grid: string[][]; count: number } {
  if (!find) return { grid, count: 0 }
  const next = grid.map((row) => row.map((cell) => String(cell)))
  let count = 0
  const f = find.trim()
  const r = replace
  for (let ri = 0; ri < next.length; ri++) {
    for (let ci = 0; ci < next[ri].length; ci++) {
      const cell = next[ri][ci]
      if (!cell.includes(f)) continue
      if (replaceAll) {
        next[ri][ci] = cell.split(f).join(r)
        count += (cell.match(new RegExp(escapeRegex(f), 'g')) || []).length
      } else {
        next[ri][ci] = cell.replace(f, r)
        count = 1
        return { grid: next, count }
      }
    }
  }
  return { grid: next, count }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Count occurrences of find in grid */
export function countFind(grid: string[][], find: string): number {
  if (!find.trim()) return 0
  const f = find.trim()
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      const s = String(cell)
      const matches = s.match(new RegExp(escapeRegex(f), 'g'))
      if (matches) count += matches.length
    }
  }
  return count
}

/** Sort grid by column (0-based). Header row (row 0) stays fixed. */
export function applySort(grid: string[][], colIndex: number, ascending: boolean): string[][] {
  if (grid.length <= 1) return grid
  const [header, ...rows] = grid
  const sorted = [...rows].sort((a, b) => {
    const av = a[colIndex] != null ? String(a[colIndex]).trim().toLowerCase() : ''
    const bv = b[colIndex] != null ? String(b[colIndex]).trim().toLowerCase() : ''
    const cmp = av.localeCompare(bv, undefined, { numeric: true })
    return ascending ? cmp : -cmp
  })
  return [header, ...sorted]
}

export type FilterCondition = 'contains' | 'equals' | 'notEquals' | 'startsWith' | 'greater' | 'less'

/** Filter grid: keep header + rows matching condition on column. */
export function applyFilter(
  grid: string[][],
  colIndex: number,
  condition: FilterCondition,
  value: string
): string[][] {
  if (grid.length <= 1) return grid
  const [header, ...rows] = grid
  const v = value.trim().toLowerCase()
  const filtered = rows.filter((row) => {
    const cell = (row[colIndex] != null ? String(row[colIndex]).trim() : '').toLowerCase()
    const numCell = parseFloat(row[colIndex] as string)
    const numVal = parseFloat(value)
    const isNum = !Number.isNaN(numCell) && !Number.isNaN(numVal)
    switch (condition) {
      case 'contains':
        return cell.includes(v)
      case 'equals':
        return isNum ? numCell === numVal : cell === v
      case 'notEquals':
        return isNum ? numCell !== numVal : cell !== v
      case 'startsWith':
        return cell.startsWith(v)
      case 'greater':
        return isNum ? numCell > numVal : cell > v
      case 'less':
        return isNum ? numCell < numVal : cell < v
      default:
        return true
    }
  })
  return [header, ...filtered]
}

/** Get unique non-empty values from a column (for filter dropdown). Skips header row by default. */
export function getColumnUniqueValues(grid: string[][], colIndex: number, skipHeader = true): string[] {
  if (grid.length <= 1) return []
  const start = skipHeader ? 1 : 0
  const set = new Set<string>()
  for (let ri = start; ri < grid.length; ri++) {
    const cell = grid[ri]?.[colIndex]
    const v = cell != null ? String(cell).trim() : ''
    if (v !== '') set.add(v)
  }
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
}

/** Filter grid by selected values: keep header + rows where column value is in selectedValues. */
export function applyFilterByValues(
  grid: string[][],
  colIndex: number,
  selectedValues: string[]
): string[][] {
  if (grid.length <= 1 || selectedValues.length === 0) return grid
  const set = new Set(selectedValues.map((v) => v.trim().toLowerCase()))
  const [header, ...rows] = grid
  const filtered = rows.filter((row) => {
    const cell = (row[colIndex] != null ? String(row[colIndex]).trim() : '').toLowerCase()
    return set.has(cell)
  })
  return [header, ...filtered]
}

/** Simple pivot: group by rowCol, aggregate valueCol with agg. Returns 2D array. */
export function computePivot(
  grid: string[][],
  rowCol: number,
  valueCol: number,
  agg: 'sum' | 'count' | 'avg'
): string[][] {
  if (grid.length <= 1) return []
  const [header, ...rows] = grid
  const groups = new Map<string, number[]>()
  for (const row of rows) {
    const key = String(row[rowCol] ?? '').trim() || '(blank)'
    const val = parseFloat(String(row[valueCol] ?? ''))
    if (!groups.has(key)) groups.set(key, [])
    if (!Number.isNaN(val)) groups.get(key)!.push(val)
  }
  const result: string[][] = [[header[rowCol] || 'Category', header[valueCol] || 'Value']]
  for (const [key, vals] of groups.entries()) {
    let aggVal: number
    if (agg === 'sum') aggVal = vals.reduce((a, b) => a + b, 0)
    else if (agg === 'count') aggVal = vals.length
    else aggVal = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    result.push([key, String(aggVal)])
  }
  return result
}

/** Detect simple pattern for smart fill: next value in sequence. */
export function smartFillNext(values: string[]): string | null {
  if (values.length === 0) return null
  const last = values[values.length - 1]
  const nums = values.map((v) => parseFloat(v)).filter((n) => !Number.isNaN(n))
  if (nums.length === values.length && nums.length >= 2) {
    const d = nums[1] - nums[0]
    return String(nums[nums.length - 1] + d)
  }
  const months = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',')
  const mi = months.indexOf(last)
  if (mi >= 0 && mi < 11) return months[mi + 1]
  const monthsFull = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(',')
  const mf = monthsFull.indexOf(last)
  if (mf >= 0 && mf < 11) return monthsFull[mf + 1]
  return null
}
