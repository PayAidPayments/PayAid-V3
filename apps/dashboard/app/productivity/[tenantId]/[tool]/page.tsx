// @ts-nocheck
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useEffect, useMemo, useState } from 'react'
import { PageLoading } from '@/components/ui/loading'
import { Table, FileEdit, Presentation, Folder, Video, FileText } from 'lucide-react'
import { PayAidPDFEmbed } from '@/components/productivity/PayAidPDFEmbed'
import { DocumentsList } from '@/components/productivity/DocumentsList'
import { PresentationsList } from '@/components/productivity/PresentationsList'
import { DriveList } from '@/components/productivity/DriveList'
import { MeetList } from '@/components/productivity/MeetList'

const VALID_TOOLS = ['sheets', 'docs', 'slides', 'drive', 'meet', 'pdf'] as const
type ToolId = (typeof VALID_TOOLS)[number]

function isToolId(s: string): s is ToolId {
  return VALID_TOOLS.includes(s as ToolId)
}

const TOOL_LABELS: Record<ToolId, string> = {
  sheets: 'PayAid Sheets',
  docs: 'PayAid Docs',
  slides: 'PayAid Slides',
  drive: 'PayAid Drive',
  meet: 'PayAid Meet',
  pdf: 'PayAid PDF',
}

const TOOL_ICONS: Record<ToolId, React.ComponentType<{ className?: string }>> = {
  sheets: Table,
  docs: FileEdit,
  slides: Presentation,
  drive: Folder,
  meet: Video,
  pdf: FileText,
}

const DRIVE_TOOL: ToolId = 'drive'

function getToolUrl(_tool: ToolId, _tenantId: string, _token: string | null): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/productivity/${_tenantId}/${_tool}`
}

export default function ProductivityToolPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const tenantId = (params.tenantId as string) ?? ''
  const toolParam = (params.tool as string) ?? 'sheets'
  const tool: ToolId = isToolId(toolParam) ? toolParam : 'sheets'
  const [status, setStatus] = useState<ProductivityStatus>(null)

  useEffect(() => {
    fetch('/api/productivity/status')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus({ drive: false, meet: false }))
  }, [])

  // PayAid Sheets: use existing spreadsheet module (x-spreadsheet)
  useEffect(() => {
    if (tool === 'sheets' && tenantId) {
      router.replace(`/spreadsheet/${tenantId}/Spreadsheets`)
      return
    }
  }, [tool, tenantId, router])

  // PayAid Docs: use docs sub-routes (Home, Documents, Templates) with same header as Sheets
  useEffect(() => {
    if (tool === 'docs' && tenantId) {
      router.replace(`/productivity/${tenantId}/docs`)
      return
    }
  }, [tool, tenantId, router])

  const iframeSrc = useMemo(() => getToolUrl(tool, tenantId, token), [tool, tenantId, token])
  const driveConfigured = status?.drive ?? true
  const driveNotConfigured = tool === DRIVE_TOOL && !driveConfigured

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }

  // Sheets: redirecting (show loading until redirect)
  if (tool === 'sheets') {
    return <PageLoading message="Opening PayAid Sheets..." fullScreen={true} />
  }

  // Docs: built-in list + editor (PayAid Docs)
  if (tool === 'docs') {
    return (
      <section className="flex-1 space-y-5">
        <DocumentsList tenantId={tenantId} />
      </section>
    )
  }

  // Slides: built-in list + editor (PayAid Slides)
  if (tool === 'slides') {
    return (
      <section className="flex-1 space-y-5">
        <PresentationsList tenantId={tenantId} />
      </section>
    )
  }

  // PDF: in-app (built-in)
  if (tool === 'pdf') {
    return (
      <div className="h-[calc(100vh-6rem)] w-full min-h-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto">
        <PayAidPDFEmbed />
      </div>
    )
  }

  // Drive: built-in file browser (list, upload, folders, download)
  if (tool === 'drive') {
    return (
      <section className="flex-1 space-y-5">
        <DriveList tenantId={tenantId} />
      </section>
    )
  }

  // Meet: built-in meeting list + room (Jitsi embed when NEXT_PUBLIC_MEET_BASE_URL set)
  if (tool === 'meet') {
    return (
      <section className="flex-1 space-y-5">
        <MeetList tenantId={tenantId} />
      </section>
    )
  }

  return null
}
