/**
 * Intelligent Overdue Payment Reminders Service
 * Analyzes payment patterns and personalizes reminder messages
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'

export interface PaymentPattern {
  averageDaysToPay: number
  onTimeRate: number
  preferredPaymentDay?: number // Day of week (0-6)
  preferredPaymentTime?: string // Time of day
  paymentMethod?: string
}

export interface SmartReminder {
  message: string
  suggestedTime: Date
  paymentPlanSuggestion?: {
    amount: number
    installments: number
    frequency: string
  }
}

/**
 * Analyze customer payment patterns
 */
export async function analyzePaymentPattern(
  contactId: string,
  tenantId: string
): Promise<PaymentPattern> {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId: contactId,
      tenantId,
      status: 'paid',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  if (invoices.length === 0) {
    return {
      averageDaysToPay: 30,
      onTimeRate: 0.5,
    }
  }

  const paymentDelays = invoices
    .filter((inv) => inv.dueDate)
    .map((inv) => {
      const dueDate = new Date(inv.dueDate!)
      const paidDate = inv.updatedAt
      return Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
    })

  const averageDaysToPay =
    paymentDelays.reduce((sum, delay) => sum + delay, 0) / paymentDelays.length

  const onTimePayments = paymentDelays.filter((delay) => delay <= 5).length
  const onTimeRate = paymentDelays.length > 0 ? onTimePayments / paymentDelays.length : 0

  return {
    averageDaysToPay: Math.round(averageDaysToPay),
    onTimeRate,
  }
}

/**
 * Generate personalized reminder message
 */
export async function generatePersonalizedReminder(
  invoiceId: string,
  tenantId: string
): Promise<SmartReminder> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: {
      customer: true,
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const pattern = invoice.customerId
    ? await analyzePaymentPattern(invoice.customerId, tenantId)
    : null

  const groq = getGroqClient()

  const prompt = `Generate a personalized payment reminder email for an overdue invoice.

Invoice Amount: ₹${invoice.total}
Customer: ${invoice.customerName || 'Customer'}
Days Overdue: ${Math.floor((Date.now() - new Date(invoice.dueDate!).getTime()) / (24 * 60 * 60 * 1000))}
Payment History: ${pattern ? `Average ${pattern.averageDaysToPay} days to pay, ${Math.round(pattern.onTimeRate * 100)}% on-time rate` : 'No payment history'}

Generate a professional, friendly reminder that:
- Acknowledges the relationship
- Clearly states the amount due
- Provides easy payment options
- Maintains a positive tone

Return only the email message text, no subject line.`

  try {
    const message = await groq.generateCompletion(prompt)

    // Suggest optimal send time (next business day, morning)
    const suggestedTime = new Date()
    suggestedTime.setDate(suggestedTime.getDate() + 1)
    suggestedTime.setHours(10, 0, 0, 0) // 10 AM

    // Suggest payment plan if high amount and struggling customer
    let paymentPlanSuggestion
    if (invoice.total > 50000 && pattern && pattern.averageDaysToPay > 30) {
      paymentPlanSuggestion = {
        amount: invoice.total / 3,
        installments: 3,
        frequency: 'monthly',
      }
    }

    return {
      message: message.trim(),
      suggestedTime,
      paymentPlanSuggestion,
    }
  } catch (error) {
    console.error('Reminder generation error:', error)
    // Fallback message
    return {
      message: `Dear ${invoice.customerName || 'Customer'},

This is a friendly reminder that invoice ${invoice.invoiceNumber} for ₹${invoice.total} is overdue.

Please arrange payment at your earliest convenience.

Thank you for your business.`,
      suggestedTime: new Date(),
    }
  }
}
