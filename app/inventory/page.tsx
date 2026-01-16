'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function InventoryModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with inventory module redirect
      router.push('/login?redirect=/inventory')
      return
    }

    if (tenant?.id) {
      // Redirect to Inventory dashboard: /inventory/[tenantId]/Home/
      router.push(`/inventory/${tenant.id}/Home/`)
    } else {
      // No tenant - go to main dashboard
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Inventory...</p>
      </div>
    </div>
  )
}

