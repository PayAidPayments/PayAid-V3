/**
 * Advanced HR calculations: Gratuity, Leave encashment, Bonus (India).
 */

/** Gratuity: 15 days wages per completed year; cap 20 lakh */
export function gratuity(
  lastDrawnBasicPlusDa: number,
  completedYears: number,
  completedMonthsInPartialYear: number = 0
): number {
  const totalYears = completedYears + completedMonthsInPartialYear / 12
  const fifteenDaysWages = (lastDrawnBasicPlusDa * 15) / 26
  return Math.min(fifteenDaysWages * totalYears, 20_00_000)
}

/** Leave encashment: (days * monthly gross / 30), optional cap */
export function leaveEncashment(
  leaveDays: number,
  monthlyGross: number,
  capDays: number = 30
): number {
  return (monthlyGross / 30) * Math.min(leaveDays, capDays)
}

/** Statutory bonus 8.33%–20%; min salary 7K for eligibility */
export function statutoryBonus(eligibleEarnings: number, percentage: number = 8.33): number {
  if (eligibleEarnings <= 7000) return 0
  return (eligibleEarnings * percentage) / 100
}

/** PF employer 12% (cap) */
export function pfEmployerContribution(basicPlusDa: number): number {
  return Math.min(basicPlusDa * 0.12, 1800 * 12)
}

/** ESI employee 0.75%, employer 3.25% (wages <= 21k) */
export function esiContributions(grossMonthly: number): { employee: number; employer: number } {
  if (grossMonthly > 21000) return { employee: 0, employer: 0 }
  return {
    employee: (grossMonthly * 0.75) / 100,
    employer: (grossMonthly * 3.25) / 100,
  }
}
