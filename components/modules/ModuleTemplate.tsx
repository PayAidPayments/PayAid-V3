'use client'

/**
 * Thin example of a module home using ModuleDashboardShell.
 * Prefer composing ModuleDashboardShell directly in each module Home page.
 */

import { Plus } from 'lucide-react'
import { ModuleDashboardShell, DashboardEmptyState } from './dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface ModuleTemplateProps {
  tenantId: string
  moduleId?: string
}

export default function ModuleTemplatePage({
  tenantId,
  moduleId = 'crm',
}: ModuleTemplateProps) {
  const moduleConfig = getModuleConfig(moduleId)

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <ModuleDashboardShell
      moduleId={moduleConfig.id}
      title={`${moduleConfig.name} Dashboard`}
      subtitle={moduleConfig.description}
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      kpis={[
        { label: 'Metric 1', value: 100, change: 15, trend: 'up', tone: 'purple' },
        {
          label: 'Metric 2',
          value: formatINRForDisplay(450000),
          change: 12,
          trend: 'up',
          tone: 'gold',
        },
        { label: 'Metric 3', value: 50, change: 5, trend: 'down', tone: 'info' },
        { label: 'Metric 4', value: 25, change: 8, trend: 'up', tone: 'success' },
      ]}
      insight={{
        text: 'Replace this strip with a module-specific AI or trend summary.',
        status: 'ready',
      }}
      actions={[
        {
          label: 'Primary action',
          href: `/${moduleConfig.id}/${tenantId}/Home`,
          icon: <Plus className="w-4 h-4" />,
        },
        {
          label: 'Secondary',
          href: `/${moduleConfig.id}/${tenantId}/Home`,
          variant: 'secondary',
        },
      ]}
      secondaryTitle="Secondary band"
      secondaryDescription="One chart, work queue, or recent list — not all three."
      secondary={
        <DashboardEmptyState
          title="No items yet"
          description="Wire real data here. Keep this band to a single purpose."
          actionLabel="Get started"
          actionHref={`/${moduleConfig.id}/${tenantId}/Home`}
        />
      }
    >
      <p className="text-xs text-slate-500">
        See <code className="text-[11px]">docs/ai/module-dashboard-uniformity.md</code> for the 5-band
        contract.
      </p>
    </ModuleDashboardShell>
  )
}
