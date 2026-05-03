import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const [segments, approvedAccounts, verifiedContacts] = await Promise.all([
    prisma.leadSegment.count({ where: { tenantId } }),
    prisma.leadAccount.count({ where: { tenantId, status: 'APPROVED' } }),
    prisma.leadContact.count({ where: { tenantId, emailStatus: 'VERIFIED' } }),
  ])

  return NextResponse.json({ segments, approvedAccounts, verifiedContacts })
}
