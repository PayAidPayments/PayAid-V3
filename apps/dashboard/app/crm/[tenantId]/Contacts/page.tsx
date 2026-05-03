'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Canonical "Contacts" path used by nav, tests, and deep links.
 * The roster UI lives on AllPeople; keep this route so /crm/[tenant]/Contacts does not 404.
 */
export default function CRMContactsIndexPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''

  useEffect(() => {
    if (tenantId) {
      router.replace(`/crm/${tenantId}/AllPeople`)
    }
  }, [tenantId, router])

  return (
    <div className="p-6 text-sm text-slate-600 dark:text-slate-400" data-testid="crm-contacts-redirect">
      Opening contacts…
    </div>
  )
}
