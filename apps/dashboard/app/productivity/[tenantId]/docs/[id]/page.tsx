'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { PayAidDocEditor, type DocContent } from '@/components/productivity/PayAidDocEditor'

const RESERVED_IDS = ['Home', 'Documents', 'Templates']

export default function DocEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const tenantId = (params?.tenantId as string) ?? ''
  const id = (params?.id as string) ?? ''

  const [docState, setDocState] = useState<{
    name: string
    content: DocContent | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect reserved segments to the right page
  useEffect(() => {
    if (RESERVED_IDS.includes(id)) {
      router.replace(`/productivity/${tenantId}/docs/${id}`)
    }
  }, [id, tenantId, router])

  // Create new doc and redirect
  useEffect(() => {
    if (id !== 'new' || !tenantId || !token) return
    let cancelled = false
    const create = async () => {
      try {
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
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to create')
      }
    }
    create()
    return () => { cancelled = true }
  }, [id, tenantId, token, router])

  // Load doc when id is set and not reserved/new
  useEffect(() => {
    if (id === 'new' || RESERVED_IDS.includes(id) || !tenantId || !token) return
    setLoading(true)
    let cancelled = false
    fetch(`/api/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Document not found')
        return r.json()
      })
      .then((doc) => {
        if (!cancelled) {
          setDocState({
            name: doc.name || 'Untitled document',
            content: doc.content as DocContent | null,
          })
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, tenantId, token])

  if (RESERVED_IDS.includes(id)) {
    return <PageLoading message="Redirecting..." fullScreen={false} />
  }

  if (id === 'new') {
    return (
      <PageLoading
        message="Creating document..."
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
            onClick={() => router.push(`/productivity/${tenantId}/docs/Documents`)}
            className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Back to documents
          </button>
        </div>
      </div>
    )
  }

  if (loading || !docState) {
    return <PageLoading message="Loading document..." fullScreen={false} />
  }

  return (
    <div className="h-[calc(100vh-8rem)] w-full min-h-0 flex flex-col -mx-2">
      <PayAidDocEditor
        documentId={id}
        name={docState.name}
        initialContent={docState.content}
        token={token!}
        backHref={`/productivity/${tenantId}/docs/Documents`}
      />
    </div>
  )
}
