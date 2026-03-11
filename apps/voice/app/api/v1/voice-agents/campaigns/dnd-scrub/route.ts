/**
 * DND Scrub API (TRAI compliance)
 * POST /api/v1/voice-agents/campaigns/dnd-scrub
 * Body: multipart/form-data with "file" = CSV (column "phone" or first column = numbers).
 * Response: { dnd, nonDnd, dndCount, nonDndCount, total }
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { checkDndBatch, normalizePhoneForDnd } from '@/lib/dnd'

function parsePhonesFromCsv(buffer: Buffer): string[] {
  const text = buffer.toString('utf-8')
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const phones: string[] = []
  let phoneColumnIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i]
    const cells = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
    if (i === 0 && cells.length > 1) {
      const idx = cells.findIndex(
        (c) => c.toLowerCase() === 'phone' || c.toLowerCase() === 'mobile' || c.toLowerCase() === 'number'
      )
      if (idx >= 0) phoneColumnIndex = idx
      continue
    }
    const cell = cells[phoneColumnIndex] || cells[0]
    const digits = cell?.replace(/\D/g, '') ?? ''
    if (digits.length >= 10) phones.push(digits.slice(-10))
  }
  return [...new Set(phones)]
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Send a CSV with "file" field.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const phones = parsePhonesFromCsv(buffer)
    if (phones.length === 0) {
      return NextResponse.json({
        dnd: [],
        nonDnd: [],
        dndCount: 0,
        nonDndCount: 0,
        total: 0,
        message: 'No valid phone numbers found in CSV.',
      })
    }

    const dndMap = await checkDndBatch(phones)
    const dnd: string[] = []
    const nonDnd: string[] = []
    phones.forEach((p) => {
      const n = normalizePhoneForDnd(p)
      if (dndMap.get(n)) dnd.push(n)
      else nonDnd.push(n)
    })

    return NextResponse.json({
      dnd,
      nonDnd,
      dndCount: dnd.length,
      nonDndCount: nonDnd.length,
      total: phones.length,
    })
  } catch (error) {
    console.error('[DND Scrub] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'DND scrub failed' },
      { status: 500 }
    )
  }
}
