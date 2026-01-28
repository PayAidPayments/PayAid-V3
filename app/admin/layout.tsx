/**
 * Phase 2: Admin Panel Layout
 * Super admin panel - not tenant-specific
 */

import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?redirect=/admin')
  }

  try {
    const decoded = verifyToken(token)
    
    // Check if super admin
    const isSuperAdmin = decoded.roles?.includes('super_admin') || 
                        decoded.role === 'super_admin'
    
    if (!isSuperAdmin) {
      redirect('/dashboard')
    }
  } catch {
    redirect('/login?redirect=/admin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">PayAid Admin</h1>
            <nav className="flex gap-4">
              <a href="/admin/tenants" className="text-sm font-medium hover:underline">
                Tenants
              </a>
              <a href="/admin/users" className="text-sm font-medium hover:underline">
                Users
              </a>
              <a href="/admin/modules" className="text-sm font-medium hover:underline">
                Modules
              </a>
              <a href="/admin/settings" className="text-sm font-medium hover:underline">
                Settings
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-muted-foreground hover:underline">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}
