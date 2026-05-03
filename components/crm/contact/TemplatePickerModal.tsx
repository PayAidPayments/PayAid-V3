'use client'

/**
 * Phase A4: Pick an email or WhatsApp template, preview with variables, then open mailto / WhatsApp.
 */

import { useState, useEffect, useCallback } from 'react'
import { X, Mail, MessageSquare, Send, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

export type TemplateChannel = 'email' | 'whatsapp'

interface TemplatePickerModalProps {
  channel: TemplateChannel
  onClose: () => void
  contact: { id: string; name?: string; email?: string; phone?: string }
  tenantId: string
  dealId?: string | null
  hasEmail: boolean
  hasPhone: boolean
}

interface EmailTemplate {
  id: string
  name: string
  category?: string | null
  subject: string
}

interface WhatsappTemplate {
  id: string
  name: string
  category?: string | null
}

export function TemplatePickerModal({
  channel,
  onClose,
  contact,
  tenantId,
  dealId,
  hasEmail,
  hasPhone,
}: TemplatePickerModalProps) {
  const { token } = useAuthStore()
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsappTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ subject?: string; body: string } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showCreateWa, setShowCreateWa] = useState(false)
  const [newWaName, setNewWaName] = useState('')
  const [newWaBody, setNewWaBody] = useState('')
  const [creatingWa, setCreatingWa] = useState(false)

  const fetchTemplates = useCallback(() => {
    if (!token) return
    const headers: HeadersInit = { Authorization: `Bearer ${token}` }
    if (channel === 'whatsapp') {
      fetch('/api/crm/whatsapp-templates', { headers })
        .then((r) => r.ok ? r.json() : { templates: [] })
        .then((waRes) => setWhatsappTemplates(waRes.templates || []))
        .catch(() => {})
    } else {
      fetch('/api/email-templates', { headers })
        .then((r) => r.ok ? r.json() : { templates: [] })
        .then((emailRes) => setEmailTemplates(emailRes.templates || []))
        .catch(() => {})
    }
  }, [channel, token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    const headers: HeadersInit = { Authorization: `Bearer ${token}` }
    Promise.all([
      channel === 'email'
        ? fetch('/api/email-templates', { headers }).then((r) => r.ok ? r.json() : { templates: [] })
        : Promise.resolve({ templates: [] }),
      channel === 'whatsapp'
        ? fetch('/api/crm/whatsapp-templates', { headers }).then((r) => r.ok ? r.json() : { templates: [] })
        : Promise.resolve({ templates: [] }),
    ])
      .then(([emailRes, waRes]) => {
        setEmailTemplates(emailRes.templates || [])
        setWhatsappTemplates(waRes.templates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channel, token])

  const templates = channel === 'email' ? emailTemplates : whatsappTemplates

  const loadPreview = async (templateId: string) => {
    if (!token) return
    setSelectedId(templateId)
    setLoadingPreview(true)
    setPreview(null)
    try {
      const res = await fetch('/api/crm/templates/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          channel,
          templateId,
          contactId: contact.id,
          dealId: dealId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreview({ subject: data.subject, body: data.body || '' })
      }
    } catch {
      setPreview({ body: 'Failed to load preview' })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSend = () => {
    if (!preview?.body) return
    if (channel === 'email' && hasEmail && contact.email) {
      const subject = encodeURIComponent(preview.subject || 'Follow up')
      const body = encodeURIComponent(preview.body)
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`
    } else if (channel === 'whatsapp' && hasPhone && contact.phone) {
      const phone = contact.phone.replace(/\D/g, '').replace(/^91/, '') || contact.phone.replace(/\D/g, '')
      const text = encodeURIComponent(preview.body)
      window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${text}`, '_blank')
    }
    onClose()
  }

  const disabledSend =
    channel === 'email' ? !hasEmail : !hasPhone

  const handleCreateWhatsAppTemplate = async () => {
    if (!newWaName.trim() || !newWaBody.trim() || !token) return
    setCreatingWa(true)
    try {
      const res = await fetch('/api/crm/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newWaName.trim(), body: newWaBody.trim() }),
      })
      if (res.ok) {
        setNewWaName('')
        setNewWaBody('')
        setShowCreateWa(false)
        fetchTemplates()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create template')
      }
    } catch {
      alert('Failed to create template')
    } finally {
      setCreatingWa(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
            {channel === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            {channel === 'email' ? 'Email with template' : 'WhatsApp with template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-gray-400">
                No {channel} templates yet.
              </p>
              {channel === 'whatsapp' ? (
                <>
                  {!showCreateWa ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateWa(true)}
                      className="dark:border-gray-600 dark:text-gray-300"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Create WhatsApp template
                    </Button>
                  ) : (
                    <div className="rounded-lg border border-slate-200 dark:border-gray-600 p-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Template name (e.g. Intro)"
                        value={newWaName}
                        onChange={(e) => setNewWaName(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2"
                      />
                      <textarea
                        placeholder="Body. Use {{contact.name}}, {{contact.company}}, {{deal.value}}..."
                        value={newWaBody}
                        onChange={(e) => setNewWaBody(e.target.value)}
                        rows={3}
                        className="w-full rounded border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm px-3 py-2 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowCreateWa(false); setNewWaName(''); setNewWaBody('') }} className="dark:border-gray-600 dark:text-gray-300">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleCreateWhatsAppTemplate} disabled={creatingWa || !newWaName.trim() || !newWaBody.trim()} className="bg-green-600 hover:bg-green-700">
                          {creatingWa ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-500">Create email templates in Settings → Email templates.</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">Choose template</label>
                <ul className="space-y-1">
                  {templates.map((t: { id: string; name: string; category?: string | null }) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => loadPreview(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedId === t.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200'
                            : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-900 dark:text-gray-100'
                        }`}
                      >
                        {t.name}
                        {t.category && (
                          <span className="ml-2 text-xs text-slate-500 dark:text-gray-400">{t.category}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {loadingPreview && <p className="text-sm text-slate-500">Loading preview...</p>}
              {preview && !loadingPreview && (
                <div className="rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-900/50 p-3">
                  {channel === 'email' && preview.subject && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
                      <strong>Subject:</strong> {preview.subject}
                    </p>
                  )}
                  <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{preview.body}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={disabledSend || !preview?.body}
            className={channel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Send className="w-4 h-4 mr-2" />
            {channel === 'email' ? 'Open in email' : 'Open WhatsApp'}
          </Button>
        </div>
      </div>
    </>
  )
}
