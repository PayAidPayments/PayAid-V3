import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/spreadsheets
 * Get all spreadsheets for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const spreadsheets = await prisma.spreadsheet.findMany({
      where: { tenantId: payload.tenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ spreadsheets })
  } catch (error: any) {
    console.error('Error fetching spreadsheets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheets', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/spreadsheets
 * Create a new spreadsheet
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId || !payload.userId) {
      return NextResponse.json({ error: 'Tenant or user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, data, template } = body

    // Initialize data based on template
    let initialData: any[][] = [[]]
    if (template === 'blank') {
      initialData = [[]]
    } else if (template === 'gst-invoice') {
      initialData = [
        ['Invoice #', 'Date', 'Customer', 'Amount', 'GST (18%)', 'Total'],
        ['', '', '', '', '', ''],
      ]
    } else if (template === 'expense-tracker') {
      initialData = [
        ['Date', 'Category', 'Description', 'Amount'],
        ['', '', '', ''],
      ]
    } else if (template === 'payroll') {
      initialData = [
        ['Employee', 'Basic Salary', 'HRA', 'Allowances', 'Deductions', 'Net Salary'],
        ['', '', '', '', '', ''],
      ]
    }

    const spreadsheet = await prisma.spreadsheet.create({
      data: {
        tenantId: payload.tenantId,
        name: name || 'Untitled Spreadsheet',
        description: description || null,
        data: data || initialData,
        createdById: payload.userId,
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(spreadsheet, { status: 201 })
  } catch (error: any) {
    console.error('Error creating spreadsheet:', error)
    return NextResponse.json(
      { error: 'Failed to create spreadsheet', details: error.message },
      { status: 500 }
    )
  }
}

