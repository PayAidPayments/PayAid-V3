'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DocsDefaultPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) ?? ''

  useEffect(() => {
    router.replace(`/productivity/${tenantId}/docs/Documents`)
  }, [tenantId, router])

  return (
    <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
      Redirecting to PayAid Docs...
    </div>
  )
}
