'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Redirect /dashboard/[tenantId]/stats to a default stat type so the user
// never hits the catch-all (which would render a blank page).
const DEFAULT_STAT_TYPE = 'contacts'

export default function DashboardStatsIndexPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string | undefined

  useEffect(() => {
    if (tenantId) {
      router.replace(`/dashboard/${tenantId}/stats/${DEFAULT_STAT_TYPE}`)
    }
  }, [tenantId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Loading stats...</p>
    </div>
  )
}
