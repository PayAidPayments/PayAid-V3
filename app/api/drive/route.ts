import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/drive
 * Get files and folders for the current tenant
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

    const searchParams = request.nextUrl.searchParams
    const parentId = searchParams.get('parentId')
    const fileType = searchParams.get('fileType')

    const where: any = {
      tenantId: payload.tenantId,
      parentId: parentId || null,
    }

    if (fileType) {
      where.fileType = fileType
    }

    const files = await prisma.driveFile.findMany({
      where,
      orderBy: [
        { fileType: 'asc' }, // Folders first
        { name: 'asc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Calculate total storage used
    const totalSize = await prisma.driveFile.aggregate({
      where: { tenantId: payload.tenantId, fileType: 'file' },
      _sum: { fileSize: true },
    })

    return NextResponse.json({
      files,
      totalSize: totalSize._sum.fileSize || 0,
      maxSize: 50 * 1024 * 1024 * 1024, // 50GB
    })
  } catch (error: any) {
    console.error('Error fetching drive files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/drive
 * Create a new folder
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
    const { name, parentId } = body

    const folder = await prisma.driveFile.create({
      data: {
        tenantId: payload.tenantId,
        name: name || 'New Folder',
        fileName: name || 'New Folder',
        fileUrl: '',
        fileSize: 0,
        mimeType: 'folder',
        fileType: 'folder',
        parentId: parentId || null,
        createdById: payload.userId,
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder', details: error.message },
      { status: 500 }
    )
  }
}

