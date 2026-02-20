import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const [totalTenants, kycVerified, complianceRecords] = await Promise.all([
      prisma.tenant.count(),
      prisma.merchantOnboarding.count({ where: { kycStatus: 'verified' } }),
      prisma.complianceRecord.count({ where: { status: 'COMPLETED' } }),
    ])

    const data = {
      totalTenants,
      pciDss: totalTenants,
      kycAml: kycVerified,
      dataRetention: complianceRecords,
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin compliance error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
