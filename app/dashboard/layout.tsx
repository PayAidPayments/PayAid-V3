'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const { tenant, token, fetchUser } = useAuthStore()

  // Extract tenantId from URL params
  const tenantIdFromUrl = params?.tenantId as string | undefined

  // Refresh tenant data on mount to get latest modules
  useEffect(() => {
    if (token && !tenant?.licensedModules?.length) {
      // If tenant doesn't have modules, fetch latest from API
      fetchUser().catch(() => {
        // Silently fail - user might not be authenticated
      })
    }
  }, [token, tenant?.licensedModules?.length, fetchUser])

  // Verify tenantId matches logged-in tenant
  useEffect(() => {
    if (tenant?.id && tenantIdFromUrl && tenant.id !== tenantIdFromUrl) {
      // Tenant mismatch - redirect to correct tenant dashboard
      router.replace(`/dashboard/${tenant.id}`)
    }
  }, [tenant?.id, tenantIdFromUrl, router])

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
