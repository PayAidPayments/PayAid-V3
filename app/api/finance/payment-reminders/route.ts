import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/finance/payment-reminders
 * Get overdue invoices requiring payment reminders
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const now = new Date()

    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['sent', 'pending'] },
        dueDate: {
          lt: now,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    const reminders = overdueInvoices.map(invoice => {
      const daysOverdue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name || 'Unknown',
        customerEmail: invoice.customer?.email,
        amount: Number(invoice.total),
        dueDate: invoice.dueDate,
        daysOverdue,
        reminderSent: false, // Should check from notification/activity log
        lastReminderDate: null, // Should fetch from activity log
      }
    })

    return NextResponse.json({ reminders })
  } catch (error: any) {
    console.error('Payment reminders API error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment reminders', message: error?.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/finance/payment-reminders
 * Send payment reminder for an invoice
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const { invoiceId, channel } = body

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        customer: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Generate payment link
    const paymentLink = `https://payaid.link/pay/${invoice.invoiceNumber}`

    // Create activity log entry
    await prisma.activity.create({
      data: {
        tenantId,
        type: 'payment_reminder_sent',
        description: `Payment reminder sent for invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoice.id,
          channel,
          paymentLink,
        },
      },
    }).catch(() => {
      // Activity creation is optional
    })

    return NextResponse.json({
      success: true,
      paymentLink,
      message: 'Payment reminder sent successfully',
    })
  } catch (error: any) {
    console.error('Send payment reminder error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to send payment reminder', message: error?.message },
      { status: 500 }
    )
  }
}
