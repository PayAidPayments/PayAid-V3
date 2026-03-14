'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { DashboardLoading } from '@/components/ui/loading'

/**
 * DEPRECATED: This page redirects to the decoupled Voice Agents module
 * The monolithic dashboard architecture is deprecated in favor of the decoupled architecture
 */
export default function VoiceAgentsPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      // Redirect to decoupled Voice Agents module
      router.replace(`/voice-agents/${tenant.id}/Home`)
    } else {
      // No tenant - redirect to home
      router.replace('/home')
    }
  }, [tenant?.id, router])

  return <DashboardLoading message="Redirecting to Voice Agents..." />
}

