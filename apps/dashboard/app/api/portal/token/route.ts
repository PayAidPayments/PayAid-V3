import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { signPortalToken } from '@/lib/portal/token'

/**
 * GET /api/portal/token?tenantId=...&contactId=...
 * Returns a portal JWT for the given contact (customer).
 * Requires staff auth; tenantId must match JWT.
 * Use this to build customer portal links: /portal/[tenantId]/customer/[customerId]?token=...
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    if (!payload?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')?.trim()
    const contactId = request.nextUrl.searchParams.get('contactId')?.trim()
    if (!tenantId || !contactId || tenantId !== payload.tenantId) {
      return NextResponse.json(
        { error: 'tenantId and contactId required and must match your tenant' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const token = signPortalToken(tenantId, contactId)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const portalUrl = `${baseUrl}/portal/${tenantId}/customer/${contactId}?token=${token}`

    return NextResponse.json({
      token,
      portalUrl,
      expiresIn: process.env.PORTAL_TOKEN_EXPIRY || '7d',
    })
  } catch (e) {
    console.error('[PORTAL_TOKEN]', e)
    return NextResponse.json({ error: 'Failed to generate portal token' }, { status: 500 })
  }
}
