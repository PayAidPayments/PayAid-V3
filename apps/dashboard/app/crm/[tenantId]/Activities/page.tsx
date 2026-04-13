'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Legacy nav item: "Activities" now opens the CRM Home activity feed (timeline of tasks, calls, deals, etc.)
 * instead of a placeholder page with only deep links.
 */
export default function CRMActivitiesPage() {
  const params = useParams()
  const router = useRouter()
  const tenantIdParam = params?.tenantId
  const tenantId = Array.isArray(tenantIdParam) ? (tenantIdParam[0] || '') : ((tenantIdParam as string) || '')
  const activityHomeHref = tenantId ? `/crm/${tenantId}/Home?view=activity` : '/crm'

  useEffect(() => {
    if (!tenantId) return
    router.replace(activityHomeHref)
  }, [tenantId, router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">Opening your activity feed…</p>
        <Link href={activityHomeHref}>
          <Button size="sm" variant="outline">Open Activities Command Center</Button>
        </Link>
      </div>
    </div>
  )
}
