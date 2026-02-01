'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="knowledge-rag"
          moduleName="Knowledge & RAG AI"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
