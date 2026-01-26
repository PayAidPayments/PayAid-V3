'use client'

import { AccountHierarchyTree } from '@/components/accounts/AccountHierarchyTree'
import { useParams } from 'next/navigation'

export default function AccountTreePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const accountId = params.id as string

  return (
    <div className="container mx-auto p-6">
      <AccountHierarchyTree
        tenantId={tenantId}
        rootAccountId={accountId}
        onAccountSelect={(id) => {
          // Navigate to account detail
          window.location.href = `/crm/${tenantId}/Accounts/${id}`
        }}
      />
    </div>
  )
}
