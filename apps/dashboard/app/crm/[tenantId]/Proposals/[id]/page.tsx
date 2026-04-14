'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Copy, FileSignature, Loader2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useState } from 'react'

function formatDt(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  try {
    return format(new Date(value), 'MMM d, yyyy · HH:mm')
  } catch {
    return null
  }
}

function proposalContentPreview(content: unknown): string | null {
  if (content == null) return null
  if (typeof content === 'string') {
    const stripped = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!stripped) return null
    return stripped.length > 450 ? `${stripped.slice(0, 450)}…` : stripped
  }
  if (typeof content === 'object' && content !== null && 'html' in content) {
    const html = (content as { html?: unknown }).html
    if (typeof html === 'string') return proposalContentPreview(html)
  }
  try {
    const s = JSON.stringify(content)
    return s.length > 400 ? `${s.slice(0, 400)}…` : s
  } catch {
    return null
  }
}

export default function CRMProposalDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'proposal', tenantId, id],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${id}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch proposal')
      const json = await res.json()
      return json.data as any
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-slate-400 dark:text-gray-500 mb-4" />
            <p className="text-slate-600 dark:text-gray-400 mb-4">Proposal not found.</p>
            <Button asChild variant="outline">
              <Link href={`/crm/${tenantId}/Contacts`}>Back to CRM</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const p = data
  const lineItems = Array.isArray(p.lineItems) ? p.lineItems : []
  const preview = proposalContentPreview(p.content)
  const timelineRows: { label: string; value: string | null }[] = [
    { label: 'Valid until', value: formatDt(p.validUntil ?? p.expiresAt) },
    { label: 'Sent', value: formatDt(p.sentAt) },
    { label: 'Viewed', value: formatDt(p.viewedAt) },
    { label: 'Accepted', value: formatDt(p.acceptedAt) },
    { label: 'Rejected', value: formatDt(p.rejectedAt) },
    { label: 'Converted to invoice', value: formatDt(p.convertedAt) },
  ].filter((r) => r.value)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" data-testid="crm-proposal-detail">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/crm/${tenantId}/Contacts/${p.contactId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100 truncate">{p.title}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {p.proposalNumber}
            {p.deal?.name ? (
              <>
                {' '}
                · Deal:{' '}
                <Link
                  href={`/crm/${tenantId}/Deals/${p.deal.id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {p.deal.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-gray-400">Status</span>
              <span className="font-medium capitalize">{p.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-gray-400">Subtotal</span>
              <span>{formatINRForDisplay(p.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-gray-400">Tax</span>
              <span>{formatINRForDisplay(p.tax ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-gray-400">Discount</span>
              <span>{formatINRForDisplay(p.discount ?? 0)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-slate-100 dark:border-slate-700 pt-3">
              <span className="text-slate-700 dark:text-gray-200">Total</span>
              <span>{formatINRForDisplay(p.total ?? 0)}</span>
            </div>
            {p.contact && (
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 dark:text-gray-400">Contact</span>
                <Link
                  href={`/crm/${tenantId}/Contacts/${p.contact.id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {p.contact.name}
                </Link>
              </div>
            )}
            {p.convertedInvoiceId ? (
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link href={`/finance/${tenantId}/Invoices/${p.convertedInvoiceId}`}>Open converted invoice</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Timeline & sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {timelineRows.length > 0 ? (
              <ul className="space-y-2">
                {timelineRows.map((row) => (
                  <li key={row.label} className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-gray-400 shrink-0">{row.label}</span>
                    <span className="text-right text-slate-800 dark:text-gray-100">{row.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-400">No sent/view/accept dates yet.</p>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Public view</span>
                <span>{p.publicViewEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              {p.publicToken && p.publicViewEnabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(p.publicToken)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {copied ? 'Copied token' : 'Copy public token'}
                  </Button>
                  <span className="text-[11px] text-slate-500 dark:text-gray-400">
                    Use with your customer-facing proposal URL (host depends on deployment).
                  </span>
                </div>
              ) : null}
            </div>
            {p.rejectionReason ? (
              <p className="text-xs text-slate-600 dark:text-gray-300 pt-1">
                <span className="font-medium">Rejection reason: </span>
                {p.rejectionReason}
              </p>
            ) : null}
            {p.acceptedBy ? (
              <p className="text-xs text-slate-600 dark:text-gray-300">
                <span className="font-medium">Accepted by: </span>
                {p.acceptedBy}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {lineItems.length > 0 ? (
        <Card className="border-slate-200 dark:border-slate-700" data-testid="crm-proposal-detail-line-items">
          <CardHeader>
            <CardTitle className="text-base">Line items</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs text-slate-500 dark:text-gray-400">
                  <th className="pb-2 pr-3 font-medium">Item</th>
                  <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                  <th className="pb-2 pr-3 font-medium text-right">Unit</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineItems.map((row: any) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 align-top">
                      <div className="font-medium text-slate-900 dark:text-gray-100">{row.productName}</div>
                      {row.description ? (
                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{row.description}</div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{row.quantity}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatINRForDisplay(row.unitPrice ?? 0)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatINRForDisplay(row.total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {preview ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Content preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {preview}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
              Full rich content is stored as structured data; this is a plain-text preview for quick review in CRM.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
