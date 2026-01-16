'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Voice Agents Module Entry Point (Decoupled Architecture)
 * Redirects to the tenant-specific Voice Agents dashboard
 * Format: /voice-agents/[tenantId]/Home/
 */
export default function VoiceAgentsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      router.push('/login')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Voice Agents dashboard
      router.push(`/voice-agents/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to home to set up tenant
      router.push('/home')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Voice Agents..." fullScreen={true} />
}

