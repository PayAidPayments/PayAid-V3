'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function KnowledgeRAGHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/knowledge-rag/${tenantId}/Home` },
    { name: 'Knowledge Base', href: `/knowledge-rag/${tenantId}/KnowledgeBase` },
    { name: 'Documents', href: `/knowledge-rag/${tenantId}/Documents` },
  ]

  return (
    <AppShell moduleId="knowledge-rag" moduleName="Knowledge RAG" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
