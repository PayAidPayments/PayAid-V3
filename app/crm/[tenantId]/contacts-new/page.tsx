'use client'

import { useParams } from 'next/navigation'
import { ContactList } from '@/components/crm/ContactList'

export default function ContactsPageNew() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="container mx-auto p-6">
      <ContactList organizationId={tenantId} />
    </div>
  )
}
