'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { PayAidDocEditor, type DocContent } from '@/components/productivity/PayAidDocEditor'
import { PayAidSlidesEditor } from '@/components/productivity/PayAidSlidesEditor'

const VALID_TOOLS = ['docs', 'slides'] as const
type ToolId = (typeof VALID_TOOLS)[number]

function isToolId(s: string): s is ToolId {
  return VALID_TOOLS.includes(s as ToolId)
}

export default function ProductivityToolIdPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const tenantId = (params.tenantId as string) ?? ''
  const toolParam = (params.tool as string) ?? ''
  const id = (params.id as string) ?? ''
  const tool: ToolId | null = isToolId(toolParam) ? toolParam : null

  const [docState, setDocState] = useState<{
    name: string
    content: DocContent | null
  } | null>(null)
  const [slideState, setSlideState] = useState<{
    name: string
    slides: unknown[]
    theme: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create new doc and redirect
  useEffect(() => {
    if (id !== 'new' || !tool || !tenantId || !token) {
      if (id !== 'new' && tool && tenantId) setLoading(true)
      return
    }
    let cancelled = false
    const create = async () => {
      try {
        if (tool === 'docs') {
          const res = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Untitled document' }),
          })
          if (!res.ok) throw new Error('Failed to create document')
          const doc = await res.json()
          if (!cancelled) router.replace(`/productivity/${tenantId}/docs/${doc.id}`)
        } else if (tool === 'slides') {
          const res = await fetch('/api/slides', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Untitled presentation' }),
          })
          if (!res.ok) throw new Error('Failed to create presentation')
          const pres = await res.json()
          if (!cancelled) router.replace(`/productivity/${tenantId}/slides/${pres.id}`)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to create')
      }
    }
    create()
    return () => {
      cancelled = true
    }
  }, [id, tool, tenantId, token, router])

  // Load doc or presentation when id is set
  useEffect(() => {
    if (id === 'new' || !tool || !tenantId || !token) return
    let cancelled = false
    const load = async () => {
      try {
        if (tool === 'docs') {
          const res = await fetch(`/api/documents/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) throw new Error('Document not found')
          const doc = await res.json()
          if (!cancelled) {
            setDocState({
              name: doc.name || 'Untitled document',
              content: doc.content as DocContent | null,
            })
          }
        } else if (tool === 'slides') {
          const res = await fetch(`/api/slides/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) throw new Error('Presentation not found')
          const pres = await res.json()
          if (!cancelled) {
            setSlideState({
              name: pres.name || 'Untitled presentation',
              slides: Array.isArray(pres.slides) ? pres.slides : [],
              theme: pres.theme || 'default',
            })
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
  }, [id, tool, tenantId, token])

  if (!tenantId || !tool) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }

  if (id === 'new') {
    return (
      <PageLoading
        message={tool === 'docs' ? 'Creating document...' : 'Creating presentation...'}
        fullScreen={true}
      />
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-slate-600 dark:text-slate-400">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => router.push(`/productivity/${tenantId}/${tool}`)}
            className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    )
  }

  if (tool === 'docs') {
    if (loading || !docState) {
      return <PageLoading message="Loading document..." fullScreen={false} />
    }
    return (
      <div className="h-[calc(100vh-6rem)] w-full min-h-0 flex flex-col">
        <PayAidDocEditor
          documentId={id}
          name={docState.name}
          initialContent={docState.content}
          token={token!}
          backHref={`/productivity/${tenantId}/docs`}
        />
      </div>
    )
  }

  if (tool === 'slides') {
    if (loading || !slideState) {
      return <PageLoading message="Loading presentation..." fullScreen={false} />
    }
    return (
      <div className="h-[calc(100vh-6rem)] w-full min-h-0 flex flex-col">
        <PayAidSlidesEditor
          presentationId={id}
          name={slideState.name}
          initialSlides={slideState.slides}
          theme={slideState.theme}
          token={token!}
          backHref={`/productivity/${tenantId}/slides`}
        />
      </div>
    )
  }

  return null
}
