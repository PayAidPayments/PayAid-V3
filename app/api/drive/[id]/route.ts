import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/drive/[id]
 * Get file/folder metadata
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

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    const file = await prisma.driveFile.findFirst({
      where: { id, tenantId: payload.tenantId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error: any) {
    console.error('Error fetching drive file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/drive/[id]
 * Delete file or folder (cascade children for folders)
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
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    const file = await prisma.driveFile.findFirst({
      where: { id, tenantId: payload.tenantId },
      include: { children: true },
    })

    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete children first (folders)
    for (const child of file.children) {
      await deleteRecursive(child.id, payload.tenantId)
    }

    // Remove file from disk if it's a file
    if (file.fileType === 'file' && file.fileUrl) {
      const base = join(process.cwd(), 'uploads')
      const relative = file.fileUrl.replace(/^\/uploads\//, '')
      const filePath = join(base, relative)
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {})
      }
    }

    await prisma.driveFile.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting drive file:', error)
    return NextResponse.json(
      { error: 'Failed to delete', details: error.message },
      { status: 500 }
    )
  }
}

async function deleteRecursive(fileId: string, tenantId: string) {
  const file = await prisma.driveFile.findFirst({
    where: { id: fileId, tenantId },
    include: { children: true },
  })
  if (!file) return
  for (const child of file.children) {
    await deleteRecursive(child.id, tenantId)
  }
  if (file.fileType === 'file' && file.fileUrl) {
    const base = join(process.cwd(), 'uploads')
    const relative = file.fileUrl.replace(/^\/uploads\//, '')
    const filePath = join(base, relative)
    if (existsSync(filePath)) {
      await unlink(filePath).catch(() => {})
    }
  }
  await prisma.driveFile.delete({ where: { id: fileId } })
}
