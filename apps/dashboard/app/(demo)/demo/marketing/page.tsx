'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import dynamic from 'next/dynamic'
import { PageLoading } from '@/components/ui/loading'

const MarketingDashboardPage = dynamic(
  () =>
    import('../../../marketing/[tenantId]/Home/page').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoading message="Loading Marketing..." fullScreen={false} />
      </div>
    ),
  }
)

function DemoMarketingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tenant, token, isAuthenticated } = useAuthStore()
  const [checked, setChecked] = useState(false)

  const queryTenantId = searchParams.get('tenantId')?.trim()
  const tenantId = tenant?.id ?? queryTenantId ?? ''

  useEffect(() => {
    const id = globalThis.setTimeout(() => setChecked(true), 0)
    return () => globalThis.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!checked) return
    if (!isAuthenticated && !token) {
      router.replace(`/login?redirect=${encodeURIComponent('/demo/marketing')}`)
      return
    }
    if (tenantId && !tenant?.id && !queryTenantId) {
      // Auth may still be rehydrating; wait a bit
      const t = setTimeout(() => setChecked(true), 300)
      return () => clearTimeout(t)
    }
    if (tenantId === '' && tenant?.id) {
      // Have tenant from store, nothing to do
      return
    }
    if (tenantId === '' && !tenant?.id) {
      router.replace('/login?redirect=/demo/marketing')
    }
  }, [checked, isAuthenticated, token, tenant?.id, tenantId, queryTenantId, router])

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoading message="Loading..." fullScreen={false} />
      </div>
    )
  }

  return (
    <MarketingDashboardPage
      params={Promise.resolve({ tenantId })}
      searchParams={Promise.resolve({})}
    />
  )
}

export default function DemoMarketingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <PageLoading message="Loading Marketing..." fullScreen={false} />
        </div>
      }
    >
      <DemoMarketingContent />
    </Suspense>
  )
}
