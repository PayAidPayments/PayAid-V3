'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Plus, Upload, FileSpreadsheet, ArrowRight } from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import {
  getDefaultNameForTemplate,
  getTemplateById,
} from '@/lib/spreadsheet/templates'

interface SheetItem {
  id: string
  name: string
  updatedAt: string
}

export default function SpreadsheetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const [recentSheets, setRecentSheets] = useState<SheetItem[]>([])
  const [loading, setLoading] = useState(true)
  const config = getModuleConfig('spreadsheet')!

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/spreadsheets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { spreadsheets: [] }))
      .then((data) => {
        setRecentSheets((data.spreadsheets || []).slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const handleUseTemplate = async (templateId: string) => {
    const template = getTemplateById(templateId)
    if (!template || !token) return
    const name = getDefaultNameForTemplate(template)
    try {
      const res = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, data: template.data }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const sheet = await res.json()
      router.push(`/spreadsheet/${tenantId}/Spreadsheets/${sheet.id}`)
    } catch (e) {
      console.error(e)
      alert('Failed to create spreadsheet')
    }
  }

  if (loading) return <DashboardSkeleton />

  const kpis: DashboardKpi[] = [
    {
      label: 'Spreadsheets',
      value: recentSheets.length,
      tone: 'purple',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      href: `/spreadsheet/${tenantId}/Spreadsheets`,
      empty: recentSheets.length === 0,
      emptyLabel: 'None yet',
    },
    {
      label: 'Templates',
      value: 'Ready',
      tone: 'info',
      href: `/spreadsheet/${tenantId}/Templates`,
    },
    {
      label: 'Shared',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
      tone: 'gold',
    },
    {
      label: 'AI insights',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
      tone: 'success',
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'New spreadsheet',
      href: `/spreadsheet/${tenantId}/Spreadsheets/create`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Upload',
      href: `/spreadsheet/${tenantId}/Spreadsheets`,
      icon: <Upload className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Templates',
      href: `/spreadsheet/${tenantId}/Templates`,
      variant: 'secondary',
    },
    {
      label: 'GST invoice log',
      onClick: () => handleUseTemplate('gst-invoice-log'),
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId="spreadsheet"
      title="Sheets"
      moduleIcon={<config.icon className="w-7 h-7" />}
      kpis={kpis}
      insight={{
        text:
          recentSheets.length === 0
            ? 'Create your first spreadsheet or pick a template to start in seconds.'
            : `You have ${recentSheets.length} recent spreadsheet${recentSheets.length === 1 ? '' : 's'}. Open one below or start from a template.`,
        status: recentSheets.length ? 'ready' : 'unavailable',
        href: `/spreadsheet/${tenantId}/Templates`,
        hrefLabel: 'Browse templates',
      }}
      actions={actions}
      secondaryTitle="Recent spreadsheets"
      secondaryDescription="Primary file list for this tool"
      secondaryActions={
        <Link
          href={`/spreadsheet/${tenantId}/Spreadsheets`}
          className="text-sm text-[#53328A] hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      }
      secondary={
        recentSheets.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentSheets.map((sheet) => (
              <li key={sheet.id}>
                <Link
                  href={`/spreadsheet/${tenantId}/Spreadsheets/${sheet.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 -mx-2 px-2 rounded-lg"
                >
                  <FileSpreadsheet className="w-5 h-5 text-[#53328A] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {sheet.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(sheet.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <DashboardEmptyState
            icon={<FileSpreadsheet />}
            title="No spreadsheets yet"
            description="Create a blank sheet or use a Finance & GST template to get started."
            actionLabel="New spreadsheet"
            actionHref={`/spreadsheet/${tenantId}/Spreadsheets/create`}
          />
        )
      }
    />
  )
}
