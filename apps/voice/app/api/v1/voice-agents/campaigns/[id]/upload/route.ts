/**
 * Campaign CSV Upload
 * POST /api/v1/voice-agents/campaigns/[id]/upload
 * Body: { csv: string } (raw CSV text) or multipart file with "file" field
 * CSV columns: phone (required), name (optional), and optional metadata columns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'
async function getCampaignOr404(tenantId: string, id: string) {
  return prisma.voiceAgentCampaign.findFirst({
    where: { id, tenantId },
  })
}

function parseCSV(text: string): { phone: string; name?: string; metadata?: Record<string, string> }[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'number' || h === 'mobile')
  const nameIdx = header.findIndex((h) => h === 'name' || h === 'customer')
  if (phoneIdx === -1) return []

  const rows: { phone: string; name?: string; metadata?: Record<string, string> }[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
    const phone = values[phoneIdx]?.replace(/\D/g, '') || ''
    if (phone.length >= 10) {
      const normalized = phone.length === 10 ? phone : phone.length === 12 && phone.startsWith('91') ? phone.slice(2) : phone
      const name = nameIdx >= 0 ? values[nameIdx] : undefined
      const metadata: Record<string, string> = {}
      header.forEach((h, idx) => {
        if (idx !== phoneIdx && idx !== nameIdx && values[idx]) metadata[h] = values[idx]
      })
      rows.push({
        phone: normalized.length === 10 ? `+91${normalized}` : phone,
        name: name || undefined,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      })
    }
  }
  return rows
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaign = await getCampaignOr404(user.tenantId, id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot upload while campaign is running. Pause first.' },
        { status: 400 }
      )
    }

    let csvText: string
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file field "file"' }, { status: 400 })
      }
      csvText = await file.text()
    } else {
      const body = await request.json()
      if (typeof body.csv !== 'string') {
        return NextResponse.json({ error: 'Body must include "csv" string' }, { status: 400 })
      }
      csvText = body.csv
    }

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows (need "phone" column with at least 10 digits)' }, { status: 400 })
    }

    const existing = await prisma.voiceAgentCampaignContact.findMany({
      where: { campaignId: id },
      select: { id: true },
    })
    if (existing.length > 0) {
      await prisma.voiceAgentCampaignContact.deleteMany({ where: { campaignId: id } })
    }

    const created = await prisma.voiceAgentCampaignContact.createMany({
      data: rows.map((r) => ({
        campaignId: id,
        phone: r.phone,
        name: r.name ?? null,
        metadata: r.metadata ?? undefined,
        status: 'pending',
      })),
    })

    return NextResponse.json({
      uploaded: created.count,
      message: `Added ${created.count} contacts. Use DND Scrub to filter if needed.`,
    })
  } catch (error) {
    console.error('[Campaigns] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
