'use client'

import { useParams } from 'next/navigation'
import { DocumentsList } from '@/components/productivity/DocumentsList'

export default function DocsDocumentsPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''

  return (
    <section className="flex-1 space-y-5">
      <DocumentsList tenantId={tenantId} />
    </section>
  )
}
