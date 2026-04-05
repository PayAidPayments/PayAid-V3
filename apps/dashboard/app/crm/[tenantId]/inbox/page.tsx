'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Mail, MessageSquare, Smartphone } from 'lucide-react'

/**
 * Unified inbox surface for CRM audit (multi-channel markers).
 * Deep links can be added later; selectors must match tests/e2e/crm-audit.
 */
export default function CRMInboxPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Inbox</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Email, WhatsApp, and SMS threads for this workspace (read-only shell).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section
          data-channel="email"
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Mail className="w-4 h-4" />
            Email
          </div>
          <p className="text-xs text-slate-500 mt-2">Connect provider in Settings to sync threads.</p>
        </section>
        <section
          data-channel="whatsapp"
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </div>
          <p className="text-xs text-slate-500 mt-2">Templates and replies from CRM Quick Actions.</p>
        </section>
        <section
          data-channel="sms"
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Smartphone className="w-4 h-4" />
            SMS
          </div>
          <p className="text-xs text-slate-500 mt-2">SMS channel placeholder for omnichannel routing.</p>
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Tip: open a contact from{' '}
        <Link href={`/crm/${tenantId}/Contacts`} className="text-indigo-600 hover:underline">
          Contacts
        </Link>{' '}
        for full thread history.
      </p>
    </div>
  )
}
