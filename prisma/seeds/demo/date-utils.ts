/**
 * Date Range Utilities for Demo Business Seeding
 * Ensures all demo data falls within March 2025 - February 2026
 */

export const DEMO_DATE_RANGE = {
  start: new Date('2025-03-01T00:00:00.000Z'),
  end: new Date('2026-02-28T23:59:59.999Z'), // Feb 28, 2026 (2026 is not a leap year, so Feb 29 doesn't exist)
}

export interface DateRange {
  start: Date
  end: Date
}

/**
 * Generate a random date within the specified range
 */
export function randomDateInRange(range: DateRange = DEMO_DATE_RANGE): Date {
  const diff = range.end.getTime() - range.start.getTime()
  return new Date(range.start.getTime() + Math.random() * diff)
}

/**
 * Generate a random date within a specific month
 */
export function randomDateInMonth(year: number, month: number): Date {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return randomDateInRange({ start, end })
}

/**
 * Get dates for each month in the range
 */
export function getMonthsInRange(range: DateRange = DEMO_DATE_RANGE): Date[] {
  const months: Date[] = []
  const current = new Date(range.start)
  
  while (current <= range.end) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

/**
 * Distribute records across months (ensures each month has some data)
 * CRITICAL: This ensures data is spread evenly across ALL 12 months (Mar 2025 - Feb 2026)
 * to avoid clustering in Jan/Feb only
 */
export function distributeAcrossMonths<T>(
  items: T[],
  range: DateRange = DEMO_DATE_RANGE
): Array<{ item: T; date: Date }> {
  const months = getMonthsInRange(range)
  const itemsPerMonth = Math.ceil(items.length / months.length)
  
  return items.map((item, index) => {
    // Distribute evenly across all months
    const monthIndex = Math.floor(index / itemsPerMonth)
    const month = months[Math.min(monthIndex, months.length - 1)]
    const date = randomDateInRange({
      start: new Date(month.getFullYear(), month.getMonth(), 1),
      end: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
    })
    return { item, date }
  })
}

/**
 * Ensure records are distributed with guaranteed coverage across all months
 * This function guarantees at least minPerMonth records in each month
 */
export function ensureMonthlyDistribution<T>(
  items: T[],
  minPerMonth: number = 1,
  range: DateRange = DEMO_DATE_RANGE
): Array<{ item: T; date: Date }> {
  const months = getMonthsInRange(range)
  const totalMin = months.length * minPerMonth
  const itemsToUse = items.length >= totalMin ? items : items.concat(Array(totalMin - items.length).fill(null) as T[])
  
  const result: Array<{ item: T; date: Date }> = []
  let itemIndex = 0
  
  // First pass: ensure minimum per month
  for (const month of months) {
    for (let i = 0; i < minPerMonth && itemIndex < itemsToUse.length; i++) {
      const item = itemsToUse[itemIndex++]
      if (item) {
        result.push({
          item,
          date: randomDateInRange({
            start: new Date(month.getFullYear(), month.getMonth(), 1),
            end: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
          }),
        })
      }
    }
  }
  
  // Second pass: distribute remaining items evenly
  const remaining = itemsToUse.slice(itemIndex)
  const remainingPerMonth = Math.floor(remaining.length / months.length)
  let remainingIndex = 0
  
  for (const month of months) {
    for (let i = 0; i < remainingPerMonth && remainingIndex < remaining.length; i++) {
      const item = remaining[remainingIndex++]
      if (item) {
        result.push({
          item,
          date: randomDateInRange({
            start: new Date(month.getFullYear(), month.getMonth(), 1),
            end: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
          }),
        })
      }
    }
  }
  
  // Distribute any leftover items randomly across months
  while (remainingIndex < remaining.length) {
    const item = remaining[remainingIndex++]
    if (item) {
      const randomMonth = months[Math.floor(Math.random() * months.length)]
      result.push({
        item,
        date: randomDateInRange({
          start: new Date(randomMonth.getFullYear(), randomMonth.getMonth(), 1),
          end: new Date(randomMonth.getFullYear(), randomMonth.getMonth() + 1, 0, 23, 59, 59, 999),
        }),
      })
    }
  }
  
  return result
}

/**
 * Generate dates with realistic distribution (more recent = more activity)
 * But still within the full range
 */
export function realisticDateInRange(
  bias: 'recent' | 'uniform' | 'early' = 'uniform',
  range: DateRange = DEMO_DATE_RANGE
): Date {
  if (bias === 'uniform') {
    return randomDateInRange(range)
  }
  
  const diff = range.end.getTime() - range.start.getTime()
  let offset: number
  
  if (bias === 'recent') {
    // Bias toward recent dates (last 30% of range)
    offset = diff * (0.7 + Math.random() * 0.3)
  } else {
    // Bias toward early dates (first 30% of range)
    offset = diff * (Math.random() * 0.3)
  }
  
  return new Date(range.start.getTime() + offset)
}

/**
 * Get start and end dates for a specific month
 */
export function getMonthRange(year: number, month: number): DateRange {
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  }
}

/**
 * Get financial year quarters (India: Apr-Mar)
 * For Mar 2025 - Feb 2026, this spans FY 2025-26
 */
export function getQuarterRanges(range: DateRange = DEMO_DATE_RANGE): DateRange[] {
  const quarters: DateRange[] = []
  
  // Q1: Apr-Jun 2025
  quarters.push({
    start: new Date('2025-04-01T00:00:00.000Z'),
    end: new Date('2025-06-30T23:59:59.999Z'),
  })
  
  // Q2: Jul-Sep 2025
  quarters.push({
    start: new Date('2025-07-01T00:00:00.000Z'),
    end: new Date('2025-09-30T23:59:59.999Z'),
  })
  
  // Q3: Oct-Dec 2025
  quarters.push({
    start: new Date('2025-10-01T00:00:00.000Z'),
    end: new Date('2025-12-31T23:59:59.999Z'),
  })
  
  // Q4: Jan-Mar 2026 (but we only go to Feb 28)
  quarters.push({
    start: new Date('2026-01-01T00:00:00.000Z'),
    end: new Date('2026-02-28T23:59:59.999Z'),
  })
  
  return quarters
}
