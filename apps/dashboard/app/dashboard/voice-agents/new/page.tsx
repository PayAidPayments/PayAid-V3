'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { DashboardLoading } from '@/components/ui/loading'

/**
 * DEPRECATED: This page redirects to the decoupled Voice Agents module
 */
export default function NewVoiceAgentPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      // Redirect to decoupled Voice Agents module
      router.replace(`/voice-agents/${tenant.id}/New`)
    } else {
      // No tenant - redirect to home
      router.replace('/home')
    }
  }, [tenant?.id, router])

  return <DashboardLoading message="Redirecting to Voice Agents..." />
}

