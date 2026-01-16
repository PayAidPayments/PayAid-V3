'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { DashboardLoading } from '@/components/ui/loading'

/**
 * This page redirects users from the monolithic dashboard to the decoupled module selection page (/home)
 * The monolithic dashboard is deprecated in favor of the decoupled architecture
 */
export default function DashboardPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    // Always redirect to /home (module selection page) instead of monolithic dashboard
    router.replace('/home')
  }, [router])

  return <DashboardLoading message="Redirecting to your modules..." />
}
