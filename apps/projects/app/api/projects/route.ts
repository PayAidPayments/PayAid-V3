import { NextRequest, NextResponse } from 'next/server'
import { createProjectsDomainDeps } from '@payaid/domain-projects'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { mergeCrmHandoffTags } from '@/lib/projects/crm-handoff'

const projectsDomain = createProjectsDomainDeps()

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  code: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ownerId: z.string().optional(),
  clientId: z.string().optional(),
  dealId: z.string().optional(),
  crmSource: z.enum(['crm']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

async function resolveCrmHandoffForCreate(
  tenantId: string,
  input: { clientId?: string; dealId?: string }
): Promise<{ clientId?: string; dealId?: string; error?: string; status?: number }> {
  let clientId = input.clientId?.trim() || undefined
  const dealId = input.dealId?.trim() || undefined

  if (dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      select: { id: true, contactId: true },
    })
    if (!deal) {
      return { error: 'CRM deal not found for this tenant', status: 400 }
    }
    if (!clientId && deal.contactId) {
      clientId = deal.contactId
    }
  }

  if (clientId) {
    const contact = await prisma.contact.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true },
    })
    if (!contact) {
      return { error: 'CRM contact not found for this tenant', status: 400 }
    }
  }

  return { clientId, dealId }
}

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  actualStartDate: z.string().datetime().optional().nullable(),
  actualEndDate: z.string().datetime().optional().nullable(),
  budget: z.number().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ownerId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
})

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects') // Projects module

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const result = await projectsDomain.listProjects({
      tenantId,
      page,
      limit,
      status: searchParams.get('status') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const projectIds = result.projects.map((p) => p.id)
    const billingByProject = new Map<
      string,
      { draftCount: number; firstDraftInvoiceId: string | null }
    >()

    if (projectIds.length > 0) {
      const milestones = await prisma.projectMilestone.findMany({
        where: {
          projectId: { in: projectIds },
          billingDraftInvoiceId: { not: null },
        },
        select: { projectId: true, billingDraftInvoiceId: true },
      })
      for (const m of milestones) {
        const prev = billingByProject.get(m.projectId) ?? {
          draftCount: 0,
          firstDraftInvoiceId: null,
        }
        prev.draftCount += 1
        if (!prev.firstDraftInvoiceId && m.billingDraftInvoiceId) {
          prev.firstDraftInvoiceId = m.billingDraftInvoiceId
        }
        billingByProject.set(m.projectId, prev)
      }
    }

    return NextResponse.json({
      ...result,
      projects: result.projects.map((p) => {
        const billing = billingByProject.get(p.id)
        return {
          ...p,
          billingDraftCount: billing?.draftCount ?? 0,
          firstBillingDraftInvoiceId: billing?.firstDraftInvoiceId ?? null,
        }
      }),
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'projects')

    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const handoff = await resolveCrmHandoffForCreate(tenantId, {
      clientId: validated.clientId,
      dealId: validated.dealId,
    })
    if (handoff.error) {
      return NextResponse.json({ error: handoff.error }, { status: handoff.status ?? 400 })
    }

    const projectTags = mergeCrmHandoffTags(validated.tags, {
      dealId: handoff.dealId,
      crmSource: validated.crmSource ?? (handoff.dealId ? 'crm' : null),
    })

    // Generate project code if not provided
    let projectCode = validated.code
    if (!projectCode) {
      const count = await prisma.project.count({ where: { tenantId } })
      projectCode = `PROJ-${String(count + 1).padStart(4, '0')}`
    } else {
      // Check if code already exists
      const existing = await prisma.project.findFirst({
        where: {
          tenantId,
          code: projectCode,
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Project code already exists' },
          { status: 400 }
        )
      }
    }

    const project = await prisma.project.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        code: projectCode,
        status: validated.status || 'PLANNING',
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        budget: validated.budget ? validated.budget : null,
        priority: validated.priority || 'MEDIUM',
        ownerId: validated.ownerId || userId, // Default to current user
        clientId: handoff.clientId,
        tags: projectTags,
        notes: validated.notes,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            timeEntries: true,
          },
        },
      },
    })

    // Add creator as project member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: userId,
        role: 'OWNER',
        allocationPercentage: 100,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

