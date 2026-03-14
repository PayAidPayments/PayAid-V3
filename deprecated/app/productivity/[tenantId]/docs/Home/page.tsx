'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileEdit,
  Plus,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface DocItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
}

export default function DocsHomePage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) ?? ''
  const { token } = useAuthStore()
  const [recentDocs, setRecentDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/documents', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((data) => {
        const list = (data.documents || []).slice(0, 6)
        setRecentDocs(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: new Date(d).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })

  return (
    <div className="space-y-8">
      {/* Hero / CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <FileEdit className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PayAid Docs</h1>
                <p className="text-blue-100 text-sm mt-0.5">Create and edit documents with rich text, headings, and lists.</p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/productivity/${tenantId}/docs/new`)}
              className="bg-white text-indigo-600 hover:bg-blue-50 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              New document
            </Button>
          </div>
        </div>
      </section>

      {/* Quick actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent documents</h2>
            <Link
              href={`/productivity/${tenantId}/docs/Documents`}
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">No documents yet</p>
              <Button onClick={() => router.push(`/productivity/${tenantId}/docs/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first document
              </Button>
            </div>
          ) : (
            <ul className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {recentDocs.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/productivity/${tenantId}/docs/${doc.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate flex-1">{doc.name || 'Untitled'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(doc.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Get started</h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <Link
              href={`/productivity/${tenantId}/docs/new`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Blank document</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Start from scratch</p>
              </div>
            </Link>
            <Link
              href={`/productivity/${tenantId}/docs/Templates`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Templates</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Use a template</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
