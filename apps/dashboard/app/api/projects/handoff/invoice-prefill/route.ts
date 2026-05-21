import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getMilestoneInvoicePrefill } from '@/lib/api/projects/get-milestone-invoice-prefill'
import { requireAnyModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** GET — shared with Projects app; used by Finance invoice new (dashboard host). */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAnyModuleAccess(request, [
      'finance',
      'invoicing',
      'projects',
    ])
    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('projectId')?.trim()
    const milestoneId = searchParams.get('milestoneId')?.trim()
    const customerId = searchParams.get('customerId')?.trim() || undefined

    if (!projectId || !milestoneId) {
      return NextResponse.json(
        { error: 'projectId and milestoneId are required' },
        { status: 400 }
      )
    }

    const prefill = await getMilestoneInvoicePrefill(prisma, {
      tenantId,
      projectId,
      milestoneId,
      customerId,
    })
    if (!prefill) {
      return NextResponse.json({ error: 'Project milestone not found' }, { status: 404 })
    }

    return NextResponse.json({ prefill })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    console.error('GET invoice-prefill error:', error)
    return NextResponse.json({ error: 'Failed to load invoice prefill' }, { status: 500 })
  }
}
