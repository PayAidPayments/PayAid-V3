'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

const REHYDRATE_WAIT_MS = 200  // Give Zustand persist time to restore auth from localStorage
const MAX_WAIT_MS = 5000       // Don't show loading forever

/**
 * Voice Agents Module Entry Point (Decoupled Architecture)
 * Redirects to the tenant-specific Voice Agents dashboard
 * Format: /voice-agents/[tenantId]/Home/
 */
export default function VoiceAgentsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait for auth store rehydration before redirecting (avoids sending logged-in users to /login)
    const rehydrateTimer = setTimeout(() => setReady(true), REHYDRATE_WAIT_MS)
    return () => clearTimeout(rehydrateTimer)
  }, [])

  useEffect(() => {
    if (!ready) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (tenant?.id) {
      router.push(`/voice-agents/${tenant.id}/Home/`)
    } else {
      router.push('/login')
    }
  }, [ready, isAuthenticated, tenant?.id, router])

  // If still not ready after max wait, redirect to login so user isn't stuck
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      setReady(true)
    }, MAX_WAIT_MS)
    return () => clearTimeout(maxTimer)
  }, [])

  return <PageLoading message="Loading Voice Agents..." fullScreen={true} />
}

