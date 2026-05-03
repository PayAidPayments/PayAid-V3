import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

const exportSchema = z.object({
  mediaLibraryIds: z.array(z.string().min(1)).optional(),
  excludePrimary: z.boolean().optional(),
})

type ZipInputFile = {
  name: string
  data: Uint8Array
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0 ^ -1
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function toDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = Math.max(1980, date.getFullYear())
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)

  const dosTime = (hours << 11) | (minutes << 5) | seconds
  const dosDate = ((year - 1980) << 9) | (month << 5) | day
  return { dosDate, dosTime }
}

function createZip(files: ZipInputFile[]): Uint8Array {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach((file) => {
    const fileNameBytes = encoder.encode(file.name)
    const data = file.data
    const crc = crc32(data)
    const { dosDate, dosTime } = toDosDateTime(new Date())

    const localHeader = new Uint8Array(30 + fileNameBytes.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true) // version needed
    localView.setUint16(6, 0, true) // flags
    localView.setUint16(8, 0, true) // compression method: store
    localView.setUint16(10, dosTime, true)
    localView.setUint16(12, dosDate, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, fileNameBytes.length, true)
    localView.setUint16(28, 0, true) // extra length
    localHeader.set(fileNameBytes, 30)

    localParts.push(localHeader, data)

    const centralHeader = new Uint8Array(46 + fileNameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true) // version made by
    centralView.setUint16(6, 20, true) // version needed
    centralView.setUint16(8, 0, true) // flags
    centralView.setUint16(10, 0, true) // compression method
    centralView.setUint16(12, dosTime, true)
    centralView.setUint16(14, dosDate, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, fileNameBytes.length, true)
    centralView.setUint16(30, 0, true) // extra length
    centralView.setUint16(32, 0, true) // comment length
    centralView.setUint16(34, 0, true) // disk number start
    centralView.setUint16(36, 0, true) // internal attrs
    centralView.setUint32(38, 0, true) // external attrs
    centralView.setUint32(42, offset, true) // local header offset
    centralHeader.set(fileNameBytes, 46)

    centralParts.push(centralHeader)
    offset += localHeader.length + data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true) // this disk
  endView.setUint16(6, 0, true) // central dir start disk
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true) // central dir offset
  endView.setUint16(20, 0, true) // comment length

  const totalLength =
    localParts.reduce((sum, part) => sum + part.length, 0) +
    centralSize +
    end.length
  const out = new Uint8Array(totalLength)
  let ptr = 0
  ;[...localParts, ...centralParts, end].forEach((part) => {
    out.set(part, ptr)
    ptr += part.length
  })
  return out
}

function decodeDataUrl(url: string): Uint8Array | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(url)
  if (!match) return null
  const isBase64 = !!match[2]
  const payload = match[3] || ''
  if (isBase64) {
    return Uint8Array.from(Buffer.from(payload, 'base64'))
  }
  return Uint8Array.from(Buffer.from(decodeURIComponent(payload), 'utf8'))
}

async function resolveFileBytes(fileUrl: string): Promise<Uint8Array> {
  const decoded = decodeDataUrl(fileUrl)
  if (decoded) return decoded

  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch asset from ${fileUrl}`)
  }
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

function sanitizeFileName(input: string, fallback: string): string {
  const trimmed = input.trim()
  const base = trimmed.length > 0 ? trimmed : fallback
  return base.replace(/[^\w.\-]+/g, '_')
}

// POST /api/brand-kit/logos/export - export selected brand-kit logos as zip
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = exportSchema.parse(body)

    const where: { tenantId: string; category: string; id?: { in: string[] } } = {
      tenantId: user.tenantId,
      category: 'BRAND_KIT_LOGO',
    }
    if (validated.mediaLibraryIds?.length) {
      where.id = { in: validated.mediaLibraryIds }
    }

    const [tenant, assetsRaw] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { logo: true },
      }),
      prisma.mediaLibrary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
        },
      }),
    ])

    const assets = (validated.excludePrimary && tenant?.logo)
      ? assetsRaw.filter((asset) => asset.fileUrl !== tenant.logo)
      : assetsRaw

    if (validated.excludePrimary && assets.length === 0) {
      return NextResponse.json({ error: 'No non-primary brand kit logos found for export' }, { status: 404 })
    }

    if (!validated.excludePrimary && assets.length === 0) {
      return NextResponse.json({ error: 'No brand kit logos found for export' }, { status: 404 })
    }

    const files: ZipInputFile[] = []
    for (const asset of assets) {
      const data = await resolveFileBytes(asset.fileUrl)
      const ext = asset.fileName.toLowerCase().endsWith('.svg') ? '' : '.svg'
      files.push({
        name: sanitizeFileName(asset.fileName, `brand-kit-logo-${asset.id}`) + ext,
        data,
      })
    }

    const zipBytes = createZip(files)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    return new NextResponse(new Blob([zipBytes]), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="brand-kit-logos-${stamp}.zip"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Brand kit logos export error:', error)
    return NextResponse.json({ error: 'Failed to export brand kit logos bundle' }, { status: 500 })
  }
}

