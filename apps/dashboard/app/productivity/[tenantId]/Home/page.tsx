'use client'

import { useParams } from 'next/navigation'
import {
  Sparkles,
  Table,
  FileEdit,
  Presentation,
  Folder,
  Video,
  FileText,
  FileDown,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import {
  ModuleDashboardShell,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'

const TOOLS = [
  { slug: 'sheets', name: 'Sheets', description: 'Spreadsheets', icon: Table, href: 'sheets' },
  { slug: 'docs', name: 'Docs', description: 'Documents', icon: FileEdit, href: 'docs' },
  { slug: 'slides', name: 'Slides', description: 'Presentations', icon: Presentation, href: 'slides' },
  { slug: 'drive', name: 'Drive', description: 'Files', icon: Folder, href: 'drive' },
  { slug: 'meet', name: 'Meet', description: 'Video meetings', icon: Video, href: 'meet' },
  { slug: 'pdf', name: 'PDF', description: 'PDF tools', icon: FileText, href: 'pdf' },
  { slug: 'builder', name: 'Builder', description: 'Document builder', icon: FileDown, href: 'builder' },
] as const

type ToolHref = (typeof TOOLS)[number]['href']

export default function ProductivityHomePage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const config = getModuleConfig('productivity')!

  const kpis: DashboardKpi[] = [
    { label: 'Tools', value: TOOLS.length, tone: 'purple', icon: <Sparkles className="w-5 h-5" /> },
    { label: 'Recent files', value: '—', empty: true, emptyLabel: 'None yet', tone: 'info' },
    { label: 'Meetings', value: '—', empty: true, emptyLabel: 'None scheduled', tone: 'gold' },
    { label: 'Shared', value: '—', empty: true, emptyLabel: 'Coming soon', tone: 'success' },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'New spreadsheet',
      href: `/spreadsheet/${tenantId}/Spreadsheets/create`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'New document',
      href: `/docs/${tenantId}/Documents`,
      variant: 'secondary',
    },
    {
      label: 'Start meeting',
      href: `/meet/${tenantId}/Home`,
      variant: 'secondary',
    },
    {
      label: 'Open drive',
      href: `/drive/${tenantId}/Home`,
      variant: 'secondary',
    },
  ]

  const toolUrls: Record<ToolHref, string> = {
    builder: `/productivity/${tenantId}/builder`,
    sheets: `/spreadsheet/${tenantId}/Home`,
    docs: `/docs/${tenantId}/Home`,
    slides: `/slides/${tenantId}/Home`,
    drive: `/drive/${tenantId}/Home`,
    meet: `/meet/${tenantId}/Home`,
    pdf: `/pdf/${tenantId}/Home`,
  }

  return (
    <ModuleDashboardShell
      moduleId="productivity"
      title="Productivity"
      moduleIcon={<config.icon className="w-7 h-7" />}
      kpis={kpis}
      insight={{
        text: 'Suite overview: open a tool below to create files or meetings. Deep editors are still maturing — homes share the same PayAid dashboard layout.',
        status: 'unavailable',
      }}
      actions={actions}
      secondaryTitle="Suite tools"
      secondaryDescription="Choose a workspace — each tool home uses the same layout grammar"
      secondary={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const url = toolUrls[tool.href]
            return (
              <Link
                key={tool.slug}
                href={url}
                className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900 p-2 text-[#53328A] dark:text-purple-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tool.name}</p>
                  <p className="text-xs text-slate-500">{tool.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      }
    />
  )
}
