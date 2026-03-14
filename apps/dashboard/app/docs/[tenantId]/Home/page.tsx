'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Plus, Search, Folder } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import Link from 'next/link'

export default function DocsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('docs') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Documents', value: '0', icon: <FileText className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Folders', value: '0', icon: <Folder className="w-5 h-5" />, color: 'info' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Docs"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Documents</CardTitle>
            <CardDescription>Create and manage documents with WYSIWYG editing and collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Link href={`/docs/${tenantId}/Documents/new`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  New Document
                </button>
              </Link>
            </div>
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No documents yet. Create your first document to get started.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
