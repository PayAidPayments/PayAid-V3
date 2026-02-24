'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, FileDown, Users, Receipt } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

type TemplateId = 'invoice' | 'offer-letter' | 'proposal' | 'contract'

const TEMPLATES: { id: TemplateId; name: string; description: string; icon: React.ReactNode }[] = [
  { id: 'invoice', name: 'Invoice', description: 'From Finance invoice data', icon: <Receipt className="h-5 w-5" /> },
  { id: 'offer-letter', name: 'Offer letter', description: 'From HR candidate/employee', icon: <FileText className="h-5 w-5" /> },
  { id: 'proposal', name: 'Proposal', description: 'From CRM contact/deal', icon: <FileText className="h-5 w-5" /> },
  { id: 'contract', name: 'Contract', description: 'From CRM deal or template', icon: <FileText className="h-5 w-5" /> },
]

/**
 * PayAid Document Builder – generate docs from templates + CRM/Finance data.
 * Backend can use ONLYOFFICE Document Builder API or pdf-lib/docx.
 */
export default function DocumentBuilderPage() {
  const params = useParams()
  const { token } = useAuthStore()
  const tenantId = (params.tenantId as string) ?? ''
  const [template, setTemplate] = useState<TemplateId | null>(null)
  const [contactId, setContactId] = useState<string>('')
  const [invoiceId, setInvoiceId] = useState<string>('')
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])
  const [invoices, setInvoices] = useState<{ id: string; title: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    const aborter = new AbortController()
    Promise.all([
      fetch(`/api/crm/contacts?tenantId=${tenantId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: aborter.signal,
      })
        .then((r) => r.ok ? r.json() : { contacts: [] })
        .then((d) => setContacts((d.contacts ?? []).map((c: { id: string; name?: string }) => ({ id: c.id, name: c.name || c.id })))),
      fetch(`/api/finance/invoices?tenantId=${tenantId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: aborter.signal,
      })
        .then((r) => r.ok ? r.json() : { invoices: [] })
        .then((d) => setInvoices((d.invoices ?? []).map((i: { id: string; invoiceNumber?: string }) => ({ id: i.id, title: i.invoiceNumber || i.id })))),
    ]).catch(() => {})
    return () => aborter.abort()
  }, [tenantId, token])

  const handleBuild = async () => {
    if (!template || !tenantId || !token) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/productivity/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tenantId,
          templateId: template,
          contactId: contactId || undefined,
          invoiceId: invoiceId || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data.error || 'Build failed')
        return
      }
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
        setMessage('Document generated. Download started.')
      } else if (data.fileId) {
        setMessage(`Document saved. File ID: ${data.fileId}`)
      } else {
        setMessage('Document Builder is not configured. Set up ONLYOFFICE Document Server and builder API.')
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!tenantId) return <PageLoading message="Loading..." fullScreen />

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Document Builder
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Generate invoices, offers, and proposals from PayAid CRM & Finance data.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Template</CardTitle>
          <CardDescription>Choose a document type.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                template === t.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {t.icon}
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500">{t.description}</div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {template && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Data source</CardTitle>
            <CardDescription>Link CRM contact or Finance invoice (optional for some templates).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Contact (CRM)</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full max-w-md rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {(template === 'invoice' || template === 'proposal') && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Invoice (Finance)</label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full max-w-md rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={handleBuild} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Generate document
            </Button>
          </CardContent>
        </Card>
      )}

      {message && (
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm">
          {message}
        </div>
      )}
    </div>
  )
}
