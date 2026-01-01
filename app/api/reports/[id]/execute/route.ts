import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// POST /api/reports/[id]/execute - Execute a report and return data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')
    const resolvedParams = await Promise.resolve(params)
    const reportId = resolvedParams.id

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Get report
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        tenantId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Execute report
    const config = report.config as any
    const { dataSource, filters, columns, grouping, sorting } = config

    let data: any[] = []

    switch (dataSource) {
      case 'contacts':
        data = await prisma.contact.findMany({
          where: {
            tenantId,
            ...(filters || {}),
          },
          select: columns?.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}) || undefined,
          take: 1000,
        })
        break
      case 'deals':
        data = await prisma.deal.findMany({
          where: {
            tenantId,
            ...(filters || {}),
          },
          select: columns?.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}) || undefined,
          take: 1000,
        })
        break
      case 'invoices':
        data = await prisma.invoice.findMany({
          where: {
            tenantId,
            ...(filters || {}),
          },
          select: columns?.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}) || undefined,
          take: 1000,
        })
        break
      case 'orders':
        data = await prisma.order.findMany({
          where: {
            tenantId,
            ...(filters || {}),
          },
          select: columns?.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}) || undefined,
          take: 1000,
        })
        break
      case 'expenses':
        data = await prisma.expense.findMany({
          where: {
            tenantId,
            ...(filters || {}),
          },
          select: columns?.reduce((acc: any, col: string) => {
            acc[col] = true
            return acc
          }, {}) || undefined,
          take: 1000,
        })
        break
      default:
        return NextResponse.json(
          { error: 'Invalid data source' },
          { status: 400 }
        )
    }

    // Apply sorting
    if (sorting && data.length > 0) {
      const sortField = sorting.field
      const sortOrder = sorting.order || 'asc'
      data.sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    // Return in requested format
    if (format === 'csv') {
      // Convert to CSV
      const headers = columns || Object.keys(data[0] || {})
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map((h: string) => JSON.stringify(row[h] || '')).join(','))
      ]
      const csv = csvRows.join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report.name}.csv"`,
        },
      })
    }

    return NextResponse.json({
      report: {
        id: report.id,
        name: report.name,
        description: report.description,
      },
      data,
      total: data.length,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Execute report error:', error)
    return NextResponse.json(
      { error: 'Failed to execute report' },
      { status: 500 }
    )
  }
}
