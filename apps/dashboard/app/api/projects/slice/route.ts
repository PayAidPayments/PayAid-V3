import { NextRequest, NextResponse } from 'next/server'
import {
  requireAnyModuleAccess,
  handleLicenseError,
  LicenseError,
} from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * P3 Projects delivery — smallest useful slice (slim-deploy safe).
 * Product: planning | active | completed | cancelled
 * DB: PLANNING | IN_PROGRESS | COMPLETED | CANCELLED
 * No full PM / phase-milestone-task rebuild. No Finance/Voice/Appointments reopen.
 */

const PRODUCT_STATUSES = ['planning', 'active', 'completed', 'cancelled'] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const DB_STATUS = {
  planning: 'PLANNING',
  active: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
} as const

const DB_TO_PRODUCT: Record<string, ProductStatus> = {
  PLANNING: 'planning',
  IN_PROGRESS: 'active',
  ON_HOLD: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const ALLOWED: Record<ProductStatus, ProductStatus[]> = {
  planning: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function toProduct(db: string): ProductStatus {
  return DB_TO_PRODUCT[db] || 'planning'
}

function assertTransition(fromDb: string, to: ProductStatus) {
  const from = toProduct(fromDb)
  if (from === to) return
  if (!ALLOWED[from].includes(to)) throw new Error(`Invalid status transition: ${from} → ${to}`)
}

const createSchema = z.object({
  name: z.string().min(1).optional(),
  clientId: z.string().optional(),
  contactId: z.string().optional(), // alias → clientId
  description: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

const statusSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(PRODUCT_STATUSES),
})

async function requireProjectsAccess(request: NextRequest) {
  return requireAnyModuleAccess(request, ['projects', 'crm'])
}

function view(row: {
  id: string
  tenantId: string
  name: string
  code: string | null
  status: string
  clientId: string | null
  description: string | null
  notes: string | null
  priority: string
  progress: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    code: row.code,
    status: toProduct(row.status),
    dbStatus: row.status,
    clientId: row.clientId,
    description: row.description,
    notes: row.notes,
    priority: row.priority,
    progress: row.progress,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function nextCode() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `P3-${stamp}-${rand}`
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireProjectsAccess(request)
    const clientId = request.nextUrl.searchParams.get('clientId') || undefined
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100)

    const rows = await prisma.project.findMany({
      where: {
        tenantId,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      ok: true,
      slice: 'p3-projects-delivery-smallest',
      projects: rows.map((r) => view(r)),
    })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    const message = error instanceof Error ? error.message : 'Failed to list projects'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireProjectsAccess(request)
    const body = await request.json()

    if (body?.action === 'status') {
      const data = statusSchema.parse(body)
      const existing = await prisma.project.findFirst({
        where: { id: data.projectId, tenantId },
      })
      if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      assertTransition(existing.status, data.status)

      const nextDb = DB_STATUS[data.status]
      const project = await prisma.project.update({
        where: { id: existing.id },
        data: {
          status: nextDb,
          ...(data.status === 'active' && !existing.actualStartDate
            ? { actualStartDate: new Date() }
            : {}),
          ...(data.status === 'completed'
            ? { progress: 100, actualEndDate: existing.actualEndDate || new Date() }
            : {}),
        },
      })

      return NextResponse.json({ ok: true, project: view(project) })
    }

    const data = createSchema.parse(body)
    const linkedId = data.clientId || data.contactId || null
    let clientId: string | null = null

    if (linkedId) {
      const contact = await prisma.contact.findFirst({
        where: { id: linkedId, tenantId },
        select: { id: true },
      })
      if (!contact) {
        return NextResponse.json({ error: 'CRM contact not found for tenant' }, { status: 400 })
      }
      clientId = contact.id
    }

    const name = (data.name || '').trim() || `P3 Delivery Project ${new Date().toISOString().slice(0, 10)}`
    const code = nextCode()

    const project = await prisma.project.create({
      data: {
        tenantId,
        name,
        code,
        status: DB_STATUS.planning,
        description: data.description || 'P3 projects delivery thin slice',
        notes: data.notes || 'P3 projects delivery thin slice',
        priority: data.priority || 'MEDIUM',
        clientId: clientId || undefined,
        ownerId: userId || undefined,
        tags: ['p3-delivery-slice'],
      },
    })

    if (userId) {
      try {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            role: 'OWNER',
            allocationPercentage: 100,
          },
        })
      } catch {
        // Membership is best-effort for thin slice proof
      }
    }

    return NextResponse.json({ ok: true, project: view(project) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to process project slice'
    const status = /not found|Invalid status|required/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
