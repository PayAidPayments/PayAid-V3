'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Database } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function KnowledgeRAGDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('knowledge-rag') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Knowledge Base', value: '0', icon: <BookOpen className="w-5 h-5" />, color: 'purple' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Knowledge & RAG AI"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Knowledge Base</CardTitle>
            <CardDescription>Build and query your knowledge base with RAG AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Create your knowledge base to enable AI-powered queries and insights.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
