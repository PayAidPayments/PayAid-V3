/**
 * Flight Risk Calculator
 * Calculates employee flight risk based on multiple factors
 */

export interface FlightRiskFactors {
  // Performance factors
  lastPerformanceRating?: number // 1-5 scale
  performanceTrend?: 'IMPROVING' | 'STABLE' | 'DECLINING'
  
  // Attendance factors
  attendanceRate?: number // 0-100%
  lateArrivalsCount?: number
  absentDaysCount?: number
  
  // Engagement factors
  engagementScore?: number // 0-100
  lastSurveyDate?: Date
  surveyResponseRate?: number
  
  // Compensation factors
  monthsSinceLastRaise?: number
  currentSalary?: number
  marketSalary?: number // Market rate for role
  salaryGap?: number // Percentage gap vs market
  
  // Tenure factors
  monthsInCompany?: number
  monthsInCurrentRole?: number
  
  // External factors
  jobSearchActivity?: boolean
  linkedInProfileUpdates?: number
  competitorJobPostings?: number
  
  // Manager/Team factors
  managerRating?: number
  teamSatisfaction?: number
}

export interface FlightRiskResult {
  riskScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskWindow: '30_DAYS' | '60_DAYS' | '90_DAYS' | 'BEYOND_90'
  factors: {
    factor: string
    impact: number
    description: string
  }[]
  recommendations: {
    action: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    estimatedCost: number
    estimatedROI: number
  }[]
}

/**
 * Calculate flight risk score
 */
export function calculateFlightRisk(factors: FlightRiskFactors): FlightRiskResult {
  const factorScores: Array<{ factor: string; impact: number; description: string }> = []
  let totalScore = 0

  // Performance factors (20% weight)
  if (factors.performanceTrend === 'DECLINING') {
    const impact = 15
    totalScore += impact
    factorScores.push({
      factor: 'Performance Trend',
      impact,
      description: 'Performance has been declining',
    })
  } else if (factors.lastPerformanceRating !== undefined && factors.lastPerformanceRating < 3) {
    const impact = 10
    totalScore += impact
    factorScores.push({
      factor: 'Low Performance Rating',
      impact,
      description: `Performance rating: ${factors.lastPerformanceRating}/5`,
    })
  }

  // Attendance factors (15% weight)
  if (factors.attendanceRate !== undefined && factors.attendanceRate < 85) {
    const impact = 12
    totalScore += impact
    factorScores.push({
      factor: 'Low Attendance',
      impact,
      description: `Attendance rate: ${factors.attendanceRate}%`,
    })
  }
  if (factors.lateArrivalsCount && factors.lateArrivalsCount > 5) {
    const impact = 8
    totalScore += impact
    factorScores.push({
      factor: 'Frequent Late Arrivals',
      impact,
      description: `${factors.lateArrivalsCount} late arrivals this month`,
    })
  }

  // Engagement factors (20% weight)
  if (factors.engagementScore !== undefined && factors.engagementScore < 60) {
    const impact = 18
    totalScore += impact
    factorScores.push({
      factor: 'Low Engagement',
      impact,
      description: `Engagement score: ${factors.engagementScore}/100`,
    })
  }

  // Compensation factors (25% weight) - Highest impact
  if (factors.salaryGap !== undefined && factors.salaryGap > 20) {
    const impact = 20
    totalScore += impact
    factorScores.push({
      factor: 'Salary Gap',
      impact,
      description: `Salary ${factors.salaryGap}% below market rate`,
    })
  }
  if (factors.monthsSinceLastRaise !== undefined && factors.monthsSinceLastRaise > 18) {
    const impact = 12
    totalScore += impact
    factorScores.push({
      factor: 'No Recent Raise',
      impact,
      description: `No raise in ${factors.monthsSinceLastRaise} months`,
    })
  }

  // Tenure factors (10% weight)
  if (factors.monthsInCompany !== undefined) {
    // High risk if 12-24 months (common exit window) or >36 months (stagnation)
    if (factors.monthsInCompany >= 12 && factors.monthsInCompany <= 24) {
      const impact = 8
      totalScore += impact
      factorScores.push({
        factor: 'Tenure Risk Window',
        impact,
        description: 'In common exit window (12-24 months)',
      })
    } else if (factors.monthsInCompany > 36 && factors.monthsInCurrentRole && factors.monthsInCurrentRole > 24) {
      const impact = 10
      totalScore += impact
      factorScores.push({
        factor: 'Role Stagnation',
        impact,
        description: `Same role for ${factors.monthsInCurrentRole} months`,
      })
    }
  }

  // External factors (10% weight)
  if (factors.jobSearchActivity) {
    const impact = 15
    totalScore += impact
    factorScores.push({
      factor: 'Job Search Activity',
      impact,
      description: 'Detected job search activity',
    })
  }
  if (factors.linkedInProfileUpdates && factors.linkedInProfileUpdates > 3) {
    const impact = 8
    totalScore += impact
    factorScores.push({
      factor: 'LinkedIn Activity',
      impact,
      description: 'Recent LinkedIn profile updates',
    })
  }

  // Cap score at 100
  totalScore = Math.min(100, totalScore)

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  let riskWindow: '30_DAYS' | '60_DAYS' | '90_DAYS' | 'BEYOND_90'

  if (totalScore >= 75) {
    riskLevel = 'CRITICAL'
    riskWindow = '30_DAYS'
  } else if (totalScore >= 60) {
    riskLevel = 'HIGH'
    riskWindow = '60_DAYS'
  } else if (totalScore >= 40) {
    riskLevel = 'MEDIUM'
    riskWindow = '90_DAYS'
  } else {
    riskLevel = 'LOW'
    riskWindow = 'BEYOND_90'
  }

  // Generate recommendations
  const recommendations = generateRecommendations(factors, totalScore)

  return {
    riskScore: totalScore,
    riskLevel,
    riskWindow,
    factors: factorScores,
    recommendations,
  }
}

/**
 * Generate retention recommendations
 */
function generateRecommendations(
  factors: FlightRiskFactors,
  riskScore: number
): Array<{ action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; estimatedCost: number; estimatedROI: number }> {
  const recommendations: Array<{ action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; estimatedCost: number; estimatedROI: number }> = []

  // Salary-related recommendations
  if (factors.salaryGap !== undefined && factors.salaryGap > 15) {
    recommendations.push({
      action: 'Salary Review & Market Adjustment',
      priority: 'HIGH',
      estimatedCost: factors.currentSalary ? factors.currentSalary * 0.15 : 200000, // 15% increase
      estimatedROI: 500, // 5x ROI (prevent exit cost ~₹10L)
    })
  }

  if (factors.monthsSinceLastRaise !== undefined && factors.monthsSinceLastRaise > 18) {
    recommendations.push({
      action: 'Performance-based Raise',
      priority: 'HIGH',
      estimatedCost: factors.currentSalary ? factors.currentSalary * 0.10 : 150000,
      estimatedROI: 400,
    })
  }

  // Role-related recommendations
  if (factors.monthsInCurrentRole !== undefined && factors.monthsInCurrentRole > 24) {
    recommendations.push({
      action: 'Role Enhancement or Promotion',
      priority: 'MEDIUM',
      estimatedCost: 50000, // Training/development
      estimatedROI: 300,
    })
  }

  // Engagement recommendations
  if (factors.engagementScore !== undefined && factors.engagementScore < 60) {
    recommendations.push({
      action: 'One-on-One with Manager',
      priority: 'HIGH',
      estimatedCost: 0, // Time cost only
      estimatedROI: 200,
    })
  }

  // Performance recommendations
  if (factors.performanceTrend === 'DECLINING') {
    recommendations.push({
      action: 'Performance Improvement Plan',
      priority: 'MEDIUM',
      estimatedCost: 30000, // Training/coaching
      estimatedROI: 150,
    })
  }

  // Retention bonus (if critical)
  if (riskScore >= 75) {
    recommendations.push({
      action: 'Retention Bonus',
      priority: 'HIGH',
      estimatedCost: factors.currentSalary ? factors.currentSalary * 0.20 : 300000,
      estimatedROI: 600,
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

/**
 * Calculate market salary gap
 */
export function calculateSalaryGap(currentSalary: number, marketSalary: number): number {
  if (!marketSalary || marketSalary === 0) return 0
  return ((marketSalary - currentSalary) / marketSalary) * 100
}
