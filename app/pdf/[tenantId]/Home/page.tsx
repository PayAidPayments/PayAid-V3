'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Merge, Scissors, Archive, Upload } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function PDFToolsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('pdf') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'PDF Files', value: '0', icon: <FileText className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Tools Used', value: '0', icon: <Archive className="w-5 h-5" />, color: 'info' as const },
  ]

  const pdfTools = [
    { id: 'reader', name: 'PDF Reader', description: 'View, annotate, and highlight PDF documents', icon: FileText, color: 'bg-purple-500' },
    { id: 'editor', name: 'PDF Editor', description: 'Edit text, fill forms, and modify PDF content', icon: FileText, color: 'bg-success' },
    { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDF files into one', icon: Merge, color: 'bg-purple-600' },
    { id: 'split', name: 'Split PDF', description: 'Extract pages or split PDF by pages', icon: Scissors, color: 'bg-gold-500' },
    { id: 'compress', name: 'Compress PDF', description: 'Reduce PDF file size while maintaining quality', icon: Archive, color: 'bg-error' },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="PDF Tools"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">PDF Tools</CardTitle>
            <CardDescription>Powerful PDF manipulation tools for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <div
                    key={tool.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`${tool.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
