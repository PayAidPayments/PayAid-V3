import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/spreadsheets/[id]
 * Get a specific spreadsheet
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
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    const spreadsheet = await prisma.spreadsheet.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 })
    }

    return NextResponse.json(spreadsheet)
  } catch (error: any) {
    console.error('Error fetching spreadsheet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheet', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/spreadsheets/[id]
 * Update a spreadsheet
 */
export async function PATCH(
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
    const { name, description, data, settings } = body

    const { id } = await params
    
    // Get current spreadsheet to create version
    const currentSpreadsheet = await prisma.spreadsheet.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    if (!currentSpreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 })
    }

    // Create version before updating
    await prisma.spreadsheetVersion.create({
      data: {
        spreadsheetId: id,
        version: currentSpreadsheet.version,
        data: currentSpreadsheet.data as any,
        createdById: payload.userId,
      },
    })

    // Update spreadsheet
    const updatedSpreadsheet = await prisma.spreadsheet.update({
      where: { id },
      data: {
        name: name !== undefined ? name : currentSpreadsheet.name,
        description: description !== undefined ? description : currentSpreadsheet.description,
        data: data !== undefined ? data : currentSpreadsheet.data,
        settings: settings !== undefined ? settings : currentSpreadsheet.settings,
        version: { increment: 1 },
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(updatedSpreadsheet)
  } catch (error: any) {
    console.error('Error updating spreadsheet:', error)
    return NextResponse.json(
      { error: 'Failed to update spreadsheet', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/spreadsheets/[id]
 * Delete a spreadsheet
 */
export async function DELETE(
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
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    await prisma.spreadsheet.delete({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting spreadsheet:', error)
    return NextResponse.json(
      { error: 'Failed to delete spreadsheet', details: error.message },
      { status: 500 }
    )
  }
}

