'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useMemo, useState, useEffect } from 'react'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, FileEdit, Presentation, Folder, Video, FileText } from 'lucide-react'
import { PayAidPDFEmbed } from '@/components/productivity/PayAidPDFEmbed'

type ProductivityStatus = { drive: boolean; meet: boolean } | null

const VALID_TOOLS = ['sheets', 'docs', 'slides', 'drive', 'meet', 'pdf'] as const
type ToolId = (typeof VALID_TOOLS)[number]

function isToolId(s: string): s is ToolId {
  return VALID_TOOLS.includes(s as ToolId)
}

function getToolUrl(tool: ToolId, tenantId: string, token: string | null): string | null {
  if (!token) return null
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  switch (tool) {
    case 'drive':
      return `${base}/api/productivity/proxy/drive?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`
    case 'meet': {
      const roomId = `payaid-${tenantId}-${Date.now().toString(36)}`
      const meetBase = process.env.NEXT_PUBLIC_MEET_BASE_URL || 'https://meet.payaid.app'
      return `${meetBase}/${roomId}?token=${encodeURIComponent(token)}`
    }
    case 'pdf':
      return `${base}/productivity/${tenantId}/pdf-app`
    default:
      return null
  }
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

  // Docs / Slides: coming soon
  if (tool === 'docs' || tool === 'slides') {
    const Icon = TOOL_ICONS[tool]
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {TOOL_LABELS[tool]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {TOOL_LABELS[tool]} is coming soon. Use Dashboard for documents and presentations in the meantime.
            </p>
            <a
              href={`/dashboard/${tenantId}`}
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Go to Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // PDF: in-app
  if (tool === 'pdf') {
    return (
      <div className="h-[calc(100vh-6rem)] w-full min-h-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto">
        <PayAidPDFEmbed />
      </div>
    )
  }

  // Drive / Meet: iframe (show not configured if drive and no URL)
  if ((tool === DRIVE_TOOL && !driveConfigured) || !iframeSrc) {
    const Icon = TOOL_ICONS[tool]
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {TOOL_LABELS[tool]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {!token
                ? `Sign in to use ${TOOL_LABELS[tool]}.`
                : driveNotConfigured
                  ? 'Drive is not configured. Set DRIVE_SERVER_URL or OFFICE_SERVER_URL in .env.'
                  : 'Configure the tool URL in .env to load it here.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] w-full min-h-0 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <iframe
        src={iframeSrc}
        className="w-full flex-1 min-h-0 border-none"
        title={TOOL_LABELS[tool]}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="microphone; camera; display-capture; fullscreen"
      />
    </div>
  )
}
