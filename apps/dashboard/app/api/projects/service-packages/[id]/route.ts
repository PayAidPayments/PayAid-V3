import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { packSelect, type ServicePackageListItem } from '../route'
import { validateOverageRulesInput } from '../overage-rules'
import { validateSlaPolicyInput } from '@/lib/api/projects/service-package-sla-policy'

function serialize(row: ServicePackageListItem) {
  return {
    ...row,
    monthlyHours:
      row.monthlyHours !== null && row.monthlyHours !== undefined ? Number(row.monthlyHours) : null,
    projectCount: row._count.projects,
    _count: undefined,
  }
}

const patchSchema = z
  .object({
    name: z.string().min(1).max(240).optional(),
    billingType: z.string().min(1).max(120).optional(),
    monthlyHours: z.number().nonnegative().optional().nullable(),
    sla: z.string().max(4000).optional().nullable(),
    slaPolicy: z.unknown().optional().nullable(),
    renewalDate: z.string().datetime().optional().nullable(),
    overageRules: z.unknown().optional().nullable(),
    status: z.string().min(1).max(40).optional(),
    notes: z.string().max(8000).optional().nullable(),
    clientId: z.string().min(1).optional(),
  })
  .strict()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const existing = await prisma.servicePackage.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Service package not found' }, { status: 404 })
    }

    const body = patchSchema.parse(await request.json())

    let slaPolicyValidation: ReturnType<typeof validateSlaPolicyInput> | undefined
    if (body.slaPolicy !== undefined) {
      slaPolicyValidation = validateSlaPolicyInput(body.slaPolicy)
      if (slaPolicyValidation.kind === 'invalid') {
        return NextResponse.json(
          {
            error: 'Invalid slaPolicy',
            details: slaPolicyValidation.issues,
            expectedKeys: [
              'trackMilestones',
              'trackTasks',
              'milestoneWarnHoursBeforeDue',
              'milestoneBreachGraceHours',
              'taskWarnHoursBeforeDue',
              'taskBreachGraceHours',
            ],
          },
          { status: 400 }
        )
      }
    }

    const overageValidation = validateOverageRulesInput(body.overageRules)
    if (overageValidation.kind === 'invalid') {
      return NextResponse.json(
        {
          error: 'Invalid overageRules',
          details: overageValidation.issues,
          expectedKeys: [
            'warnUtilizationPercent',
            'projectedWarnUtilizationPercent',
            'breachUtilizationPercent',
          ],
        },
        { status: 400 }
      )
    }

    if (body.clientId) {
      const contact = await prisma.contact.findFirst({
        where: { id: body.clientId, tenantId },
        select: { id: true },
      })
      if (!contact) {
        return NextResponse.json({ error: 'Client not found in this workspace' }, { status: 400 })
      }
    }

    const data: Prisma.ServicePackageUpdateInput = {}
    if (body.name !== undefined) data.name = body.name
    if (body.billingType !== undefined) data.billingType = body.billingType
    if (body.monthlyHours !== undefined) {
      data.monthlyHours =
        body.monthlyHours === null ? null : new Prisma.Decimal(body.monthlyHours)
    }
    if (body.sla !== undefined) data.sla = body.sla
    if (
      slaPolicyValidation &&
      (slaPolicyValidation.kind === 'clear' || slaPolicyValidation.kind === 'valid')
    ) {
      data.slaPolicy =
        slaPolicyValidation.kind === 'clear'
          ? Prisma.JsonNull
          : (slaPolicyValidation.parsed as Prisma.InputJsonValue)
    }
    if (body.renewalDate !== undefined)
      data.renewalDate = body.renewalDate === null ? null : new Date(body.renewalDate)
    if (overageValidation.kind === 'clear' || overageValidation.kind === 'valid') {
      data.overageRules =
        overageValidation.kind === 'clear'
          ? Prisma.JsonNull
          : (overageValidation.parsed as Prisma.InputJsonValue)
    }
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes
    if (body.clientId !== undefined)
      data.client = { connect: { id: body.clientId } }

    const row = await prisma.servicePackage.update({
      where: { id },
      data,
      select: packSelect,
    })

    return NextResponse.json({ package: serialize(row) })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('PATCH service-package:', error)
    return NextResponse.json({ error: 'Failed to update service package' }, { status: 500 })
  }
}
