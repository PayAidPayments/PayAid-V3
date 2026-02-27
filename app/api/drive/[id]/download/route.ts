import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/drive/[id]/download
 * Stream file with auth (for files only)
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
    })

    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (file.fileType !== 'file' || !file.fileUrl) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }

    const base = join(process.cwd(), 'uploads')
    const relative = file.fileUrl.replace(/^\/uploads\//, '')
    const filePath = join(base, relative)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    const buffer = await readFile(filePath)
    const contentType = file.mimeType || 'application/octet-stream'
    const disposition = `attachment; filename="${encodeURIComponent(file.fileName || file.name)}"`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download', details: error.message },
      { status: 500 }
    )
  }
}
