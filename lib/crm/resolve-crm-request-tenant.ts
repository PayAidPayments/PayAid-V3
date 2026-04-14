import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Prefer ?tenantId= from CRM URL context when the user may access that tenant
 * (matches deals list and contact detail behavior).
 */
export async function resolveCrmRequestTenantId(
  request: NextRequest,
  jwtTenantId: string,
  userId: string
): Promise<string> {
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
  if (!requestTenantId) return jwtTenantId

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { tenantId: true, email: true },
    })
    .catch(() => null)
  const userTenantId = user?.tenantId ?? null
  const hasAccess = jwtTenantId === requestTenantId || userTenantId === requestTenantId
  const isDemoTenantRequest =
    user?.email === 'admin@demo.com' &&
    (await prisma.tenant
      .findUnique({
        where: { id: requestTenantId },
        select: { name: true },
      })
      .then((t) => t?.name?.toLowerCase().includes('demo') ?? false)
      .catch(() => false))

  if (hasAccess || isDemoTenantRequest) return requestTenantId
  return jwtTenantId
}
