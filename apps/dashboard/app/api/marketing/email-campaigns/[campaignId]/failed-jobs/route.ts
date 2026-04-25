import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10))
    const offset = (page - 1) * pageSize

    const where = {
      tenantId,
      campaignId,
      status: { in: ['failed', 'dead_letter'] as const },
    }

    const [rows, total] = await Promise.all([
      prisma.emailSendJob.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          trackingId: true,
          status: true,
          attempts: true,
          maxRetries: true,
          toEmails: true,
          subject: true,
          error: true,
          updatedAt: true,
          createdAt: true,
          contactId: true,
          accountId: true,
        },
      }),
      prisma.emailSendJob.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        jobs: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List failed campaign jobs failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to list failed jobs' }, { status: 500 })
  }
}

