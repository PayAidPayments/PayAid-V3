'use client'

import { useParams } from 'next/navigation'
import { InvoiceList } from '@/components/finance/InvoiceList'

export default function InvoicesPageNew() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="container mx-auto p-6">
      <InvoiceList organizationId={tenantId} />
    </div>
  )
}
