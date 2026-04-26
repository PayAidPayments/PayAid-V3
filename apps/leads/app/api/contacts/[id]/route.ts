import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const item = await prisma.leadContact.findFirst({
    where: { id, tenantId },
    include: { account: true, scores: true, fieldEvidence: true, consentProfile: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const evidenceSummary = summarizeEvidence(item.fieldEvidence)
  return NextResponse.json({ ...item, evidenceSummary })
}

function summarizeEvidence(
  fieldEvidence: Array<{ verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'LIKELY' | 'UNKNOWN'; fieldName: string }>,
) {
  const byStatus = {
    VERIFIED: 0,
    UNVERIFIED: 0,
    LIKELY: 0,
    UNKNOWN: 0,
  } as const

  const mutable = {
    VERIFIED: 0,
    UNVERIFIED: 0,
    LIKELY: 0,
    UNKNOWN: 0,
  }

  for (const item of fieldEvidence) {
    mutable[item.verificationStatus] += 1
  }

  return {
    total: fieldEvidence.length,
    byStatus: mutable as typeof byStatus,
    keyFields: {
      emailEvidence: fieldEvidence.filter((item) => item.fieldName === 'workEmail').length,
      phoneEvidence: fieldEvidence.filter((item) => item.fieldName === 'phone').length,
      linkedinEvidence: fieldEvidence.filter((item) => item.fieldName === 'linkedinUrl').length,
    },
  }
}
