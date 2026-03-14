import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runWorkflow } from '@/lib/workflow/engine'

/**
 * POST /api/cron/run-workflows
 * Run SCHEDULE workflows and invoice.overdue workflows.
 * Call periodically (e.g. every 15–60 min) via Vercel Cron or external cron.
 * Auth: CRON_SECRET in Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantIdFilter = body.tenantId as string | undefined

    let scheduleRun = 0
    let overdueRun = 0
    const errors: string[] = []

    // 1) Run SCHEDULE workflows (all active, triggerType SCHEDULE)
    const scheduleWorkflows = await prisma.workflow.findMany({
      where: {
        isActive: true,
        triggerType: 'SCHEDULE',
        ...(tenantIdFilter && { tenantId: tenantIdFilter }),
      },
    })
    for (const w of scheduleWorkflows) {
      try {
        await runWorkflow(w.id, {
          tenantId: w.tenantId,
          event: 'schedule',
          data: { triggeredAt: new Date().toISOString() },
        })
        scheduleRun++
      } catch (e) {
        errors.push(`workflow ${w.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // 2) Trigger invoice.overdue for each overdue invoice (one run per invoice so workflow gets context)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { in: ['sent', 'pending', 'draft'] },
        ...(tenantIdFilter && { tenantId: tenantIdFilter }),
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    const overdueWorkflowsByTenant = await prisma.workflow.findMany({
      where: {
        isActive: true,
        triggerType: 'EVENT',
        triggerEvent: 'invoice.overdue',
        ...(tenantIdFilter && { tenantId: tenantIdFilter }),
      },
    })
    const byTenant = new Map<string, typeof overdueWorkflowsByTenant>()
    for (const w of overdueWorkflowsByTenant) {
      if (!byTenant.has(w.tenantId)) byTenant.set(w.tenantId, [])
      byTenant.get(w.tenantId)!.push(w)
    }

    for (const inv of overdueInvoices) {
      const workflows = byTenant.get(inv.tenantId) || []
      for (const w of workflows) {
        try {
          await runWorkflow(w.id, {
            tenantId: inv.tenantId,
            event: 'invoice.overdue',
            entity: 'invoice',
            entityId: inv.id,
            data: {
              invoice: {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                total: inv.total,
                dueDate: inv.dueDate,
                status: inv.status,
              },
              customer: inv.customer
                ? {
                    id: inv.customer.id,
                    name: inv.customer.name,
                    email: inv.customer.email,
                    phone: inv.customer.phone,
                  }
                : {
                    name: inv.customerName,
                    email: inv.customerEmail,
                    phone: inv.customerPhone,
                  },
            },
          })
          overdueRun++
        } catch (e) {
          errors.push(`invoice.overdue ${w.id} inv ${inv.id}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    return NextResponse.json({
      message: 'Workflows cron completed',
      scheduleWorkflowsRun: scheduleRun,
      invoiceOverdueRuns: overdueRun,
      errors: errors.length ? errors : undefined,
    })
  } catch (error) {
    console.error('Run workflows cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run workflows',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
