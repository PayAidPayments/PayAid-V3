/**
 * Super Admin layout – PayAid team only (SUPER_ADMIN)
 * Route guard in middleware; layout wraps all /super-admin/* pages.
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import { SuperAdminLayout } from '@/components/super-admin/layout/SuperAdminLayout'

export default async function SuperAdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?redirect=/super-admin')
  }

  try {
    const decoded = verifyToken(token)
    const isSuperAdmin =
      decoded.roles?.includes('SUPER_ADMIN') ||
      decoded.roles?.includes('super_admin') ||
      decoded.role === 'SUPER_ADMIN' ||
      decoded.role === 'super_admin'
    if (!isSuperAdmin) {
      redirect('/')
    }
  } catch {
    redirect('/login?redirect=/super-admin')
  }

  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
