import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// POST /api/reports/[id]/execute - Execute a report and return data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId,
        OR: [
          { isPublic: true },
          { createdById: userId },
        ],
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const { format = 'json', filters = {} } = body

    // Get report configuration
    const config = report.config as any
    const { dataSource, fields, grouping, sorting, filters: reportFilters } = config

    // Execute report based on data source
    const data = await executeReport(dataSource, fields, grouping, sorting, { ...reportFilters, ...filters }, tenantId)

    // Format output based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${report.name}-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'excel') {
      // Excel export would require xlsx library
      return NextResponse.json(
        { error: 'Excel export not yet implemented' },
        { status: 501 }
      )
    }

    // Default: return JSON
    return NextResponse.json({
      report: {
        id: report.id,
        name: report.name,
      },
      data,
      metadata: {
        totalRows: data.length,
        generatedAt: new Date().toISOString(),
      },
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

// Execute report query based on data source
async function executeReport(
  dataSource: string,
  fields: string[],
  grouping: any,
  sorting: any,
  filters: any,
  tenantId: string
): Promise<any[]> {
  // This is a simplified version - in production, you'd have a more robust query builder
  switch (dataSource) {
    case 'contacts':
      return await executeContactsReport(fields, grouping, sorting, filters, tenantId)
    case 'deals':
      return await executeDealsReport(fields, grouping, sorting, filters, tenantId)
    case 'invoices':
      return await executeInvoicesReport(fields, grouping, sorting, filters, tenantId)
    case 'orders':
      return await executeOrdersReport(fields, grouping, sorting, filters, tenantId)
    case 'expenses':
      return await executeExpensesReport(fields, grouping, sorting, filters, tenantId)
    default:
      throw new Error(`Unknown data source: ${dataSource}`)
  }
}

async function executeContactsReport(fields: string[], grouping: any, sorting: any, filters: any, tenantId: string) {
  const where: any = { tenantId }
  
  if (filters.status) where.status = filters.status
  if (filters.type) where.type = filters.type
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const contacts = await prisma.contact.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      type: true,
      status: true,
      createdAt: true,
    },
    take: 1000, // Limit for performance
  })

  return contacts.map(contact => {
    const row: any = {}
    fields.forEach(field => {
      row[field] = (contact as any)[field]
    })
    return row
  })
}

async function executeDealsReport(fields: string[], grouping: any, sorting: any, filters: any, tenantId: string) {
  const where: any = { tenantId }
  
  if (filters.stage) where.stage = filters.stage
  if (filters.status) where.status = filters.status
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      contact: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 1000,
  })

  return deals.map(deal => {
    const row: any = {}
    fields.forEach(field => {
      if (field === 'contactName') {
        row[field] = deal.contact?.name
      } else if (field === 'contactEmail') {
        row[field] = deal.contact?.email
      } else {
        row[field] = (deal as any)[field]
      }
    })
    return row
  })
}

async function executeInvoicesReport(fields: string[], grouping: any, sorting: any, filters: any, tenantId: string) {
  const where: any = { tenantId }
  
  if (filters.status) where.status = filters.status
  if (filters.dateFrom || filters.dateTo) {
    where.invoiceDate = {}
    if (filters.dateFrom) where.invoiceDate.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.invoiceDate.lte = new Date(filters.dateTo)
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 1000,
  })

  return invoices.map(invoice => {
    const row: any = {}
    fields.forEach(field => {
      if (field === 'customerName') {
        row[field] = invoice.customer?.name
      } else if (field === 'customerEmail') {
        row[field] = invoice.customer?.email
      } else {
        row[field] = (invoice as any)[field]
      }
    })
    return row
  })
}

async function executeOrdersReport(fields: string[], grouping: any, sorting: any, filters: any, tenantId: string) {
  const where: any = { tenantId }
  
  if (filters.status) where.status = filters.status
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 1000,
  })

  return orders.map(order => {
    const row: any = {}
    fields.forEach(field => {
      if (field === 'customerName') {
        row[field] = order.customer?.name
      } else if (field === 'customerEmail') {
        row[field] = order.customer?.email
      } else {
        row[field] = (order as any)[field]
      }
    })
    return row
  })
}

async function executeExpensesReport(fields: string[], grouping: any, sorting: any, filters: any, tenantId: string) {
  const where: any = { tenantId }
  
  if (filters.status) where.status = filters.status
  if (filters.category) where.category = filters.category
  if (filters.dateFrom || filters.dateTo) {
    where.date = {}
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 1000,
  })

  return expenses.map(expense => {
    const row: any = {}
    fields.forEach(field => {
      if (field === 'employeeName') {
        row[field] = expense.employee?.name
      } else if (field === 'employeeEmail') {
        row[field] = expense.employee?.email
      } else {
        row[field] = (expense as any)[field]
      }
    })
    return row
  })
}

// Convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return '""'
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    ),
  ]

  return csvRows.join('\n')
}

