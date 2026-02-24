'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useMemo } from 'react'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, FileEdit, Presentation, Folder, Video, FileText } from 'lucide-react'
import { PayAidPDFEmbed } from '@/components/productivity/PayAidPDFEmbed'

const VALID_TOOLS = ['sheets', 'docs', 'slides', 'drive', 'meet', 'pdf'] as const
type ToolId = (typeof VALID_TOOLS)[number]

function isToolId(s: string): s is ToolId {
  return VALID_TOOLS.includes(s as ToolId)
}

/**
 * Returns the iframe URL for a given tool (white-labeled).
 * Uses proxy endpoints for office/drive; external Meet; client-side PDF.
 */
function getToolUrl(
  tool: ToolId,
  tenantId: string,
  token: string | null
): string | null {
  if (!token) return null
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  switch (tool) {
    case 'sheets':
      return `${base}/api/productivity/proxy/office/s?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`
    case 'docs':
      return `${base}/api/productivity/proxy/office/d?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`
    case 'slides':
      return `${base}/api/productivity/proxy/office/p?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`
    case 'drive':
      return `${base}/api/productivity/proxy/drive?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`
    case 'meet': {
      const roomId = `payaid-${tenantId}-${Date.now().toString(36)}`
      const meetBase =
        process.env.NEXT_PUBLIC_MEET_BASE_URL || 'https://meet.payaid.app'
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

export default function ProductivityToolPage() {
  const params = useParams()
  const { token } = useAuthStore()
  const tenantId = (params.tenantId as string) ?? ''
  const toolParam = (params.tool as string) ?? 'sheets'
  const tool: ToolId = isToolId(toolParam) ? toolParam : 'sheets'

  const iframeSrc = useMemo(
    () => getToolUrl(tool, tenantId, token),
    [tool, tenantId, token]
  )

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }

  // PDF is in-app (no iframe) to avoid double header
  if (tool === 'pdf') {
    return (
      <div className="h-[calc(100vh-6rem)] w-full min-h-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto">
        <PayAidPDFEmbed />
      </div>
    )
  }

  if (!iframeSrc) {
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
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign in to use {TOOL_LABELS[tool]}. If you have set up the
              document server or Meet, the tool will load here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] w-full min-h-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-none"
        title={TOOL_LABELS[tool]}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="microphone; camera; display-capture; fullscreen"
      />
    </div>
  )
}
