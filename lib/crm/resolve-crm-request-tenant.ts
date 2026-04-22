import { NextRequest } from 'next/server'
import { prismaRead } from '@/lib/db/prisma-read'

/**
 * Prefer ?tenantId= from CRM URL context when the user may access that tenant
 * (matches deals list, contacts list, and tasks behavior).
 *
 * Fast path: no param, or param equals JWT tenant → no DB reads.
 */
export async function resolveCrmRequestTenantId(
  request: NextRequest,
  jwtTenantId: string,
  userId: string
): Promise<string> {
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
  if (!requestTenantId || requestTenantId === jwtTenantId) {
    return jwtTenantId
  }

  const user = await prismaRead.user
    .findUnique({
      where: { id: userId },
      select: { tenantId: true, email: true },
    })
    .catch(() => null)
  const userTenantId = user?.tenantId ?? null
  const hasAccess = jwtTenantId === requestTenantId || userTenantId === requestTenantId
  const allowDemoTenantOverride = process.env.NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED === '1'
  const isDemoTenantRequest =
    allowDemoTenantOverride &&
    user?.email === 'admin@demo.com' &&
    (await prismaRead.tenant
      .findUnique({
        where: { id: requestTenantId },
        select: { name: true },
      })
      .then((t) => t?.name?.toLowerCase().includes('demo') ?? false)
      .catch(() => false))

  if (hasAccess || isDemoTenantRequest) return requestTenantId
  return jwtTenantId
}
