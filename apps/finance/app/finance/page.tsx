'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

export default function FinanceModuleEntryPage() {
  const router = useRouter()
  const { tenant, token } = useAuthStore()
  const didRedirect = useRef(false)

  useEffect(() => {
    if (didRedirect.current) return
    didRedirect.current = true
    if (!token) {
      router.replace('/finance/login')
      return
    }
    const key = getTenantRouteKey(tenant)
    if (key) router.replace(`/finance/${key}/Home`)
    else router.replace('/finance/login')
  }, [router, tenant, token])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Loading Finance…</p>
    </main>
  )
}
