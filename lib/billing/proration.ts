/**
 * Proration calculations for subscription plan changes
 */

import { Decimal } from '@prisma/client/runtime/library'

export interface ProrationResult {
  creditAmount: Decimal
  chargeAmount: Decimal
  proratedDays: number
  dailyRate: Decimal
}

/**
 * Calculate proration when upgrading/downgrading subscription
 */
export function calculateProration(
  currentPlanPrice: Decimal,
  newPlanPrice: Decimal,
  billingCycleStart: Date,
  billingCycleEnd: Date,
  changeDate: Date = new Date()
): ProrationResult {
  const now = changeDate
  const cycleStart = billingCycleStart
  const cycleEnd = billingCycleEnd

  // Calculate days in billing cycle
  const totalDays = Math.ceil(
    (cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate days used
  const daysUsed = Math.ceil(
    (now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate days remaining
  const daysRemaining = totalDays - daysUsed

  // Calculate daily rates
  const currentDailyRate = currentPlanPrice.div(totalDays)
  const newDailyRate = newPlanPrice.div(totalDays)

  // Calculate credit for unused portion of current plan
  const creditAmount = currentDailyRate.mul(daysRemaining)

  // Calculate charge for remaining days at new plan rate
  const chargeAmount = newDailyRate.mul(daysRemaining)

  // Net amount to charge (could be negative for downgrades)
  const netAmount = chargeAmount.sub(creditAmount)

  return {
    creditAmount,
    chargeAmount: netAmount.greaterThan(0) ? netAmount : new Decimal(0),
    proratedDays: daysRemaining,
    dailyRate: newDailyRate,
  }
}

/**
 * Calculate proration for immediate plan change
 */
export function calculateImmediateProration(
  currentPlanPrice: Decimal,
  newPlanPrice: Decimal,
  billingCycleStart: Date,
  billingCycleEnd: Date
): ProrationResult {
  return calculateProration(
    currentPlanPrice,
    newPlanPrice,
    billingCycleStart,
    billingCycleEnd,
    new Date()
  )
}

/**
 * Calculate refund amount for cancellation
 */
export function calculateCancellationRefund(
  planPrice: Decimal,
  billingCycleStart: Date,
  billingCycleEnd: Date,
  cancellationDate: Date = new Date()
): Decimal {
  const totalDays = Math.ceil(
    (billingCycleEnd.getTime() - billingCycleStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  const daysRemaining = Math.ceil(
    (billingCycleEnd.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining <= 0) {
    return new Decimal(0)
  }

  const dailyRate = planPrice.div(totalDays)
  return dailyRate.mul(daysRemaining)
}

