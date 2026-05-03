/**
 * Ensure Demo Data - Creates deals and tasks when tenant has contacts but 0 deals.
 * Used to prevent empty Deals/dashboard during demos. Idempotent: no-op if data exists.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

const TARGET_DEALS = 45
const TARGET_TASKS = 25

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request).catch(() => null)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId') || (user as any).tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const jwtTenantId = (user as any).tenantId || (user as any).tenant_id
    if (jwtTenantId !== tenantId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (user as any).userId || (user as any).sub },
        select: { tenantId: true },
      })
      if (dbUser?.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const [dealCount, contactCount, taskCount] = await Promise.all([
      prisma.deal.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
    ])

    if (dealCount >= 10 && taskCount >= 5) {
      return NextResponse.json({
        ok: true,
        message: 'Demo data already exists',
        counts: { deals: dealCount, contacts: contactCount, tasks: taskCount },
        created: { deals: 0, tasks: 0, contacts: 0 },
      })
    }

    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: { in: ['owner', 'admin'] } },
      orderBy: { createdAt: 'asc' },
    })
    let salesRepId: string | null = null
    if (adminUser) {
      const salesRep = await prisma.salesRep.findUnique({
        where: { userId: adminUser.id },
      })
      if (salesRep) salesRepId = salesRep.id
      else {
        const created = await prisma.salesRep.create({
          data: {
            userId: adminUser.id,
            tenantId,
            specialization: 'General Sales',
            conversionRate: 0.15,
          },
        })
        salesRepId = created.id
      }
    }

    let contacts = await prisma.contact.findMany({
      where: { tenantId },
      take: 100,
    })

    if (contacts.length === 0) {
      const now = new Date()
      for (let i = 0; i < 20; i++) {
        const c = await prisma.contact.create({
          data: {
            tenantId,
            name: `Demo Contact ${i + 1}`,
            email: `demo${i + 1}@example.com`,
            phone: `+91-9876543${String(i).padStart(3, '0')}`,
            company: `Company ${i + 1}`,
            source: ['Website', 'LinkedIn', 'Referral'][i % 3],
            stage: i % 3 === 0 ? 'customer' : i % 3 === 1 ? 'contact' : 'prospect',
            status: 'active',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            ...(salesRepId ? { assignedToId: salesRepId } : {}),
          },
        })
        contacts.push(c)
      }
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    let createdDeals = 0
    const dealsNeeded = Math.max(0, TARGET_DEALS - dealCount)
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const

    for (let i = 0; i < dealsNeeded && i < 50; i++) {
      const contact = contacts[i % contacts.length]
      const stage = stages[i % stages.length]
      const dayInMonth = Math.min((i % 28) + 1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
      const createdAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 10, 0, 0)
      if (createdAt > now) createdAt.setDate(Math.min(dayInMonth, now.getDate()))
      const payload: Record<string, unknown> = {
        tenantId,
        name: `Demo Deal ${dealCount + i + 1} - ${contact.company}`,
        value: Math.floor(Math.random() * 400000) + 50000,
        stage,
        probability: stage === 'won' ? 100 : stage === 'lost' ? 0 : 30 + (i % 50),
        contactId: contact.id,
        createdAt,
        expectedCloseDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0, 0),
      }
      if (salesRepId) payload.assignedToId = salesRepId
      if (stage === 'won') payload.actualCloseDate = createdAt
      try {
        await prisma.deal.create({ data: payload as any })
        createdDeals++
      } catch (e) {
        console.warn('[ensure-demo-data] Deal create failed:', (e as Error)?.message)
      }
    }

    let createdTasks = 0
    const tasksNeeded = Math.max(0, TARGET_TASKS - taskCount)
    for (let i = 0; i < tasksNeeded && i < 30; i++) {
      const contact = contacts[i % contacts.length]
      const due = new Date(now)
      due.setDate(due.getDate() + (i % 14) - 2)
      const taskPayload: Record<string, unknown> = {
        tenantId,
        title: `Demo Task ${taskCount + i + 1}`,
        description: `Follow up with ${contact.company}`,
        status: i % 3 === 0 ? 'completed' : 'pending',
        priority: ['low', 'medium', 'high'][i % 3],
        dueDate: due,
        contactId: contact.id,
      }
      if (adminUser?.id) taskPayload.assignedToId = adminUser.id
      try {
        await prisma.task.create({ data: taskPayload as any })
        createdTasks++
      } catch (e) {
        console.warn('[ensure-demo-data] Task create failed:', (e as Error)?.message)
      }
    }

    const [finalDeals, finalTasks, finalContacts] = await Promise.all([
      prisma.deal.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
    ])

    try {
      const { multiLayerCache } = await import('@/lib/cache/multi-layer')
      await multiLayerCache.deletePattern(`deals:${tenantId}:*`)
      await multiLayerCache.deletePattern(`dashboard:stats:${tenantId}*`)
    } catch (_) {}

    return NextResponse.json({
      ok: true,
      message: createdDeals > 0 || createdTasks > 0 ? 'Demo data created' : 'No new data needed',
      counts: { deals: finalDeals, contacts: finalContacts, tasks: finalTasks },
      created: {
        deals: createdDeals,
        tasks: createdTasks,
        contacts: contacts.length === 0 ? 20 : 0,
      },
    })
  } catch (error: any) {
    console.error('[ensure-demo-data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to ensure demo data', message: error?.message },
      { status: 500 }
    )
  }
}
