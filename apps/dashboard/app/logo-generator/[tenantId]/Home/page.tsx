'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Sparkles } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function LogoGeneratorDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('logo-generator') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Logos Created', value: '0', icon: <Palette className="w-5 h-5" />, color: 'purple' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Logo Generator"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Logo Workspace</CardTitle>
            <CardDescription>Create, manage, and export your brand logos from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <p className="text-sm font-semibold text-slate-900">My Logos</p>
                <p className="text-xs text-slate-600 mt-1">
                  Open the generator and logo gallery with Vector Editor and AI legacy mode.
                </p>
                <Button asChild className="mt-3 w-full">
                  <Link href={`/ai-studio/${tenantId}/Logos`}>Open My Logos</Link>
                </Button>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <p className="text-sm font-semibold text-slate-900">Templates</p>
                <p className="text-xs text-slate-600 mt-1">
                  Templates are being expanded. Start with My Logos for full generation features.
                </p>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link href={`/logo-generator/${tenantId}/Templates`}>Open Templates</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              AI logo generation requires image provider configuration. If generation fails, use Vector Editor for guaranteed output.
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
