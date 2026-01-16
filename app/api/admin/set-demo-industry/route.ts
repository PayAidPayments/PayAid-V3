import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/admin/set-demo-industry
 * Set Demo Business industry to service-business
 */
export async function POST(request: NextRequest) {
  try {
    // Find Demo Business tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Demo Business tenant not found' },
        { status: 404 }
      )
    }

    // Update industry
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        industry: 'service-business',
        industrySubType: null,
        industrySettings: {
          setForDemo: true,
          setAt: new Date().toISOString(),
        } as any,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo Business industry updated successfully',
      tenant: {
        id: updated.id,
        name: updated.name,
        subdomain: updated.subdomain,
        industry: updated.industry,
      },
    })
  } catch (error: any) {
    console.error('Error updating demo industry:', error)
    return NextResponse.json(
      { error: 'Failed to update demo industry', details: error.message },
      { status: 500 }
    )
  }
}

