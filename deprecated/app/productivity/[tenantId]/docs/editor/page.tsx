'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const ONLYOFFICE_URL = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || 'http://localhost:8080'

/**
 * ONLYOFFICE Document Editor embed (Phase 11).
 * Load document from Supabase storage or API; pass document config to ONLYOFFICE Document Server.
 * See docs/ONLYOFFICE-INTEGRATION.md for callback and storage wiring.
 */
export default function DocsEditorPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const [config, setConfig] = useState<{ url?: string; key?: string; title?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    // TODO: fetch doc id from query, get signed URL from API (Supabase storage)
    // For now show placeholder; when ONLYOFFICE_URL is set and doc URL is available, build config and set in state
    const docId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
    if (docId) {
      setConfig({
        url: undefined, // signed download URL from your API
        key: docId + '_' + Date.now(),
        title: 'Document',
      })
    } else {
      setConfig({})
    }
  }, [tenantId])

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  // When config.url is set, call your backend to get ONLYOFFICE document server config (document.type, document.url, document.key, editorConfig.callbackUrl), then render iframe with that config's URL
  const editorSrc =
    config?.url && config?.key
      ? `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`
      : null

  return (
    <main className="flex h-full flex-col p-4">
      <h1 className="text-lg font-semibold">Document Editor (ONLYOFFICE)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set NEXT_PUBLIC_ONLYOFFICE_URL and provide doc id in query. See docs/ONLYOFFICE-INTEGRATION.md.
      </p>
      {editorSrc ? (
        <iframe
          src={editorSrc}
          className="mt-4 min-h-[600px] w-full flex-1 rounded border"
          title="ONLYOFFICE Editor"
        />
      ) : (
        <div className="mt-4 flex min-h-[400px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
          <p className="text-slate-500">
            Open a document from Docs list with ?id=... or configure ONLYOFFICE + Supabase storage.
          </p>
        </div>
      )}
    </main>
  )
}
