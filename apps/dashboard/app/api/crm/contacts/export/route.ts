import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { xlsxBufferFromJsonRows } from '@/lib/spreadsheet/exceljs-export'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

// GET /api/crm/contacts/export?format=csv|excel&type=customer|lead|all
export async function GET(request: NextRequest) {
  try {
    const { tenantId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'contact export')

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'excel' // 'csv' or 'excel'
    const type = searchParams.get('type') || 'all' // 'customer', 'lead', 'all'
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = { tenantId }
    if (type !== 'all') {
      where.type = type
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch all contacts
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Prepare data for export
    const exportData = contacts.map((contact) => ({
      'Contact Name': contact.name,
      'Email': contact.email || '',
      'Phone': contact.phone || '',
      'Company': contact.company || '',
      'Type': contact.type || '',
      'Status': contact.status || '',
      'Lead Source': contact.source || '',
      'Lead Score': contact.leadScore || 0,
      'Contact Owner': contact.assignedTo?.user?.name || contact.assignedTo?.user?.email || '',
      'City': contact.city || '',
      'State': contact.state || '',
      'Country': contact.country || '',
      'Postal Code': contact.postalCode || '',
      'Address': contact.address || '',
      'Created Date': contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('en-IN') : '',
      'Last Contacted': contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString('en-IN') : '',
      'Next Follow Up': contact.nextFollowUp ? new Date(contact.nextFollowUp).toLocaleDateString('en-IN') : '',
    }))

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row] || ''
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        ),
      ]
      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contacts_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const columnWidths = [
      25, 30, 15, 30, 12, 12, 20, 12, 25, 15, 15, 15, 12, 40, 12, 12, 12,
    ]
    const buffer = await xlsxBufferFromJsonRows(
      'Contacts',
      exportData as Record<string, unknown>[],
      columnWidths
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contacts_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error: any) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Export contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts', message: error?.message },
      { status: 500 }
    )
  }
}

