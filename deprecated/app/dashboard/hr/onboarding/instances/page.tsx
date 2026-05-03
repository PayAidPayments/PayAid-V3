'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function OnboardingInstancesRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/hr/${tenant.id}/Onboarding/Instances`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to Onboarding Instances..." fullScreen={true} />
}
