// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { spreadsheetDataTo2D, toCsvString } from '@/lib/spreadsheet/export'

const SAFE_NAME = (name: string) => (name || 'spreadsheet').replace(/[^a-zA-Z0-9-_]/g, '_')

/**
 * GET /api/spreadsheets/[id]/export?format=csv|xlsx|xls
 * Export spreadsheet as CSV, Excel (.xlsx), or Excel 97-2003 (.xls).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const tenantId = (payload as any).tenantId ?? (payload as any).tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    if (!['csv', 'xlsx', 'xls'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be csv, xlsx, or xls' },
        { status: 400 }
      )
    }

    const spreadsheet = await prisma.spreadsheet.findFirst({
      where: { id, tenantId },
      select: { name: true, data: true },
    })

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 })
    }

    const grid = spreadsheetDataTo2D(spreadsheet.data)

    if (format === 'csv') {
      const csv = toCsvString(grid)
      const filename = `${SAFE_NAME(spreadsheet.name)}.csv`
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Excel: xlsx or xls
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(grid)
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: format as 'xlsx' | 'xls',
    }) as Buffer
    const ext = format === 'xls' ? 'xls' : 'xlsx'
    const filename = `${SAFE_NAME(spreadsheet.name)}.${ext}`
    const contentType =
      format === 'xls'
        ? 'application/vnd.ms-excel'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    console.error('Export spreadsheet error:', error)
    return NextResponse.json(
      { error: 'Failed to export spreadsheet' },
      { status: 500 }
    )
  }
}
