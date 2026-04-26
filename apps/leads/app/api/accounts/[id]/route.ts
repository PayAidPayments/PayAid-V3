import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const item = await prisma.leadAccount.findFirst({
    where: { id, tenantId },
    include: { signals: true, contacts: true, scores: true, fieldEvidence: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const evidenceSummary = summarizeAccountEvidence(item.fieldEvidence)
  const contactVerificationSummary = {
    total: item.contacts.length,
    verifiedEmail: item.contacts.filter((contact) => contact.emailStatus === 'VERIFIED').length,
    unverifiedEmail: item.contacts.filter((contact) => contact.emailStatus === 'UNVERIFIED').length,
    unknownEmail: item.contacts.filter((contact) => contact.emailStatus === 'UNKNOWN').length,
    verifiedPhone: item.contacts.filter((contact) => contact.phoneStatus === 'VERIFIED').length,
    unverifiedPhone: item.contacts.filter((contact) => contact.phoneStatus === 'UNVERIFIED').length,
  }

  return NextResponse.json({ ...item, evidenceSummary, contactVerificationSummary })
}

function summarizeAccountEvidence(
  fieldEvidence: Array<{ verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'LIKELY' | 'UNKNOWN'; fieldName: string }>,
) {
  const byStatus = {
    VERIFIED: 0,
    UNVERIFIED: 0,
    LIKELY: 0,
    UNKNOWN: 0,
  }

  for (const item of fieldEvidence) {
    byStatus[item.verificationStatus] += 1
  }

  return {
    total: fieldEvidence.length,
    byStatus,
    keyFields: {
      domainEvidence: fieldEvidence.filter((item) => item.fieldName === 'domain').length,
      industryEvidence: fieldEvidence.filter((item) => item.fieldName === 'industry').length,
      employeeBandEvidence: fieldEvidence.filter((item) => item.fieldName === 'employeeBand').length,
    },
  }
}
