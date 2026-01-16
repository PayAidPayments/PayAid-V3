'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function PayrollCycleDetailRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      const path = window.location.pathname
      const id = path.split('/').pop()
      router.replace(`/hr/${tenant.id}/Payroll/Cycles/${id}`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to Payroll Cycle..." fullScreen={true} />
}
