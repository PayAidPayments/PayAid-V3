'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function ProjectsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with projects module redirect
      router.push('/login?redirect=/projects')
      return
    }

    if (tenant?.id) {
      // Redirect to Projects dashboard: /projects/[tenantId]/Home/
      router.push(`/projects/${tenant.id}/Home/`)
    } else {
      // No tenant - go to main dashboard
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Projects...</p>
      </div>
    </div>
  )
}

