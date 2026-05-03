/**
 * Feature #5: Predictive Workforce Planning
 * Headcount forecast (simple linear from trend), skill-gap placeholder.
 */
import { prisma } from '@/lib/db/prisma'

export interface HeadcountForecastMonth {
  month: string
  year: number
  predictedHeadcount: number
  lowerBound?: number
  upperBound?: number
}

export interface WorkforceForecastResult {
  historicalTrend: { month: string; count: number }[]
  forecast6Months: HeadcountForecastMonth[]
  skillGapNote: string
  generatedAt: string
}

export async function getWorkforceForecast(tenantId: string): Promise<WorkforceForecastResult> {
  const now = new Date()
  const monthsBack = 12
  const historicalTrend: { month: string; count: number }[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const count = await prisma.employee.count({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'PROBATION'] },
        joiningDate: { lte: end },
        OR: [{ exitDate: null }, { exitDate: { gt: end } }],
      },
    })
    historicalTrend.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      count,
    })
  }

  const counts = historicalTrend.map((h) => h.count)
  const n = counts.length
  const sumX = (n * (n - 1)) / 2
  const sumY = counts.reduce((a, b) => a + b, 0)
  const sumXY = counts.reduce((acc, y, i) => acc + i * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0
  const intercept = n > 0 ? (sumY - slope * sumX) / n : sumY

  const forecast6Months: HeadcountForecastMonth[] = []
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const pred = Math.round(intercept + slope * (n + i - 1))
    forecast6Months.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      year: d.getFullYear(),
      predictedHeadcount: Math.max(0, pred),
      lowerBound: Math.max(0, pred - 2),
      upperBound: pred + 2,
    })
  }

  return {
    historicalTrend,
    forecast6Months,
    skillGapNote: 'Skill gap analysis: map designations to skills and compare with recruitment pipeline. Integrate with L&D and recruitment when data is available.',
    generatedAt: new Date().toISOString(),
  }
}
