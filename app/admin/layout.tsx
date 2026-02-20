/**
 * Business Admin layout – tenant owner / admin
 * Route guard in middleware; layout wraps all /admin/* pages.
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import { AdminLayout } from '@/components/Admin/layout/AdminLayout'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']
const TENANT_ADMIN_ROLES = ['BUSINESS_ADMIN', 'business_admin', 'admin']

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?redirect=/admin')
  }

  try {
    const decoded = verifyToken(token)
    const roles = decoded.roles ?? (decoded.role ? [decoded.role] : [])
    const isSuperAdmin = roles.some((r: string) => SUPER_ADMIN_ROLES.includes(r))
    const isTenantAdmin = roles.some((r: string) => TENANT_ADMIN_ROLES.includes(r))
    if (!isSuperAdmin && !isTenantAdmin) {
      redirect('/dashboard')
    }
  } catch {
    redirect('/login?redirect=/admin')
  }

  return <AdminLayout>{children}</AdminLayout>
}
