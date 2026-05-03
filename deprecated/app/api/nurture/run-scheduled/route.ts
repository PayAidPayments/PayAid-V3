/**
 * GET/POST /api/nurture/run-scheduled
 * Scheduler: processes nurture enrollments whose next step is due.
 * Call from cron (e.g. daily). Optional: ?cronSecret=... for auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addDays, isBefore } from 'date-fns'

export async function GET(request: NextRequest) {
  return runScheduled(request)
}

export async function POST(request: NextRequest) {
  return runScheduled(request)
}

async function runScheduled(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || process.env.NURTURE_CRON_SECRET
    if (cronSecret && request.nextUrl.searchParams.get('cronSecret') !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const enrollments = await prisma.nurtureEnrollment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        template: { include: { steps: { orderBy: { order: 'asc' } } } },
      },
    })

    const results: { enrollmentId: string; contactId: string; stepIndex: number; sent: boolean; channel: string }[] = []

    for (const enr of enrollments) {
      const nextIndex = enr.completedSteps
      const nextStep = enr.template.steps[nextIndex]
      if (!nextStep) {
        await prisma.nurtureEnrollment.update({
          where: { id: enr.id },
          data: { status: 'COMPLETED', completedSteps: enr.totalSteps },
        })
        continue
      }

      const dueDate = addDays(enr.enrolledAt, nextStep.dayNumber)
      if (isBefore(now, dueDate)) continue

      const contact = enr.contact
      const channel = (nextStep.channel || 'email').toLowerCase()
      let sent = false

      if (channel === 'whatsapp') {
        try {
          const identity = await prisma.whatsappContactIdentity.findFirst({
            where: { contactId: contact.id },
            include: { contact: { include: { whatsappConversations: { take: 1, include: { session: true, account: true } } } } },
          })
          if (identity?.contact?.whatsappConversations?.[0]) {
            const conv = identity.contact.whatsappConversations[0]
            const { sendWhatsAppReply } = await import('@/lib/hr/whatsapp-send-internal')
            const result = await sendWhatsAppReply(conv.id, nextStep.body)
            sent = result.ok
          }
        } catch (e) {
          console.warn('Nurture WhatsApp send failed:', e)
        }
      } else {
        sent = true
      }

      const newCompleted = enr.completedSteps + 1
      await prisma.nurtureEnrollment.update({
        where: { id: enr.id },
        data: {
          completedSteps: newCompleted,
          status: newCompleted >= enr.totalSteps ? 'COMPLETED' : 'ACTIVE',
        },
      })

      results.push({
        enrollmentId: enr.id,
        contactId: enr.contactId,
        stepIndex: nextIndex,
        sent,
        channel,
      })
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (e) {
    console.error('Nurture run-scheduled error:', e)
    return NextResponse.json(
      { error: 'Scheduler failed', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
