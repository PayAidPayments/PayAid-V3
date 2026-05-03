/**
 * Feature #22: Loan & Advance - EMI calculation
 */
export function emi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0
  const r = annualRatePercent / 100 / 12
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
}

export function emiBreakdown(principal: number, annualRatePercent: number, tenureMonths: number): { month: number; principal: number; interest: number; emi: number; balance: number }[] {
  const e = emi(principal, annualRatePercent, tenureMonths)
  const r = annualRatePercent / 100 / 12
  const rows: { month: number; principal: number; interest: number; emi: number; balance: number }[] = []
  let balance = principal
  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    const interest = balance * r
    const principalPart = Math.min(e - interest, balance)
    balance -= principalPart
    rows.push({ month, principal: Math.round(principalPart * 100) / 100, interest: Math.round(interest * 100) / 100, emi: Math.round(e * 100) / 100, balance: Math.round(balance * 100) / 100 })
  }
  return rows
}
