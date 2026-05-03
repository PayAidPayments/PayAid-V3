'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import { Clock3, FileText, History, RefreshCw, Save, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_COLOR } from './constants'
import { Quote } from './types'
import { formatINR } from './utils'

type CPQHeaderProps = {
  quotes: Quote[]
  selectedQuote: Quote | null
  onSelectQuote: (quoteId: string) => void
  onSaveQuote: () => void
  onSendQuote: () => void
  isSaving: boolean
  isSending: boolean
  canSaveQuote: boolean
  onReloadQuotes: () => void
  onOpenHistory: () => void
  onOpenPreview: () => void
  canSendQuote: boolean
  sendQuoteTooltip: string
  approvalRequired: boolean
  onRequestApproval: () => void
  isRequestingApproval: boolean
  canRequestApproval: boolean
}

export const CPQHeader = forwardRef<HTMLDivElement, CPQHeaderProps>(function CPQHeader(
  {
    quotes,
    selectedQuote,
    onSelectQuote,
    onSaveQuote,
    onSendQuote,
    isSaving,
    isSending,
    canSaveQuote,
    onReloadQuotes,
    onOpenHistory,
    onOpenPreview,
    canSendQuote,
    sendQuoteTooltip,
    approvalRequired,
    onRequestApproval,
    isRequestingApproval,
    canRequestApproval,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800"
      data-cpq-sticky-header
    >
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm" data-testid="cpq-header">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {selectedQuote?.deal?.name ?? 'Configure-Price-Quote'}
                </h1>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Badge className={STATUS_COLOR[selectedQuote?.status ?? 'draft'] ?? STATUS_COLOR.draft}>
                    {(selectedQuote?.status ?? 'draft').replace('_', ' ')}
                  </Badge>
                  {selectedQuote?.quoteNumber ? (
                    <Badge variant="outline">#{selectedQuote.quoteNumber}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>Customer: {selectedQuote?.contact?.name ?? '—'}</span>
                <span className="hidden sm:inline">·</span>
                <span>Stage: {selectedQuote?.deal?.stage ?? 'proposal'}</span>
                <span className="hidden sm:inline">·</span>
                <span>
                  Valid until:{' '}
                  {selectedQuote?.validUntil
                    ? format(new Date(selectedQuote.validUntil), 'dd MMM yyyy')
                    : 'Not set'}
                </span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline">Owner: Revenue Team</span>
              </div>
              {selectedQuote?.contact?.email ? (
                <p className="text-[11px] text-slate-500 truncate">{selectedQuote.contact.email}</p>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto xl:min-w-[220px]">
              <label className="text-[11px] font-medium text-slate-500 sm:hidden">Active quote</label>
              <Select
                value={selectedQuote?.id ?? ''}
                onValueChange={onSelectQuote}
                disabled={quotes.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[260px] xl:w-[280px] rounded-xl bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Choose quote" />
                </SelectTrigger>
                <SelectContent>
                  {quotes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.deal?.name ?? 'Quote'} · {q.quoteNumber ?? q.id.slice(0, 8)} ·{' '}
                      {formatINR(q.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveQuote}
              disabled={!canSaveQuote || isSaving || isSending}
              title={
                !selectedQuote
                  ? 'Select a quote'
                  : !canSaveQuote
                    ? 'Add line items before saving'
                    : isSaving
                      ? 'Saving…'
                      : 'Save line items and totals to the server'
              }
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={onReloadQuotes} title="Reload quotes from server">
              <RefreshCw className="w-4 h-4 mr-1" /> Reload
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Preview customer-facing layout"
              disabled={!selectedQuote}
              onClick={onOpenPreview}
            >
              <FileText className="w-4 h-4 mr-1" /> Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canRequestApproval || isRequestingApproval || isSaving || isSending}
              title={
                !selectedQuote
                  ? 'Select a quote'
                  : selectedQuote.status === 'pending_approval'
                    ? 'Already submitted for approval'
                    : !approvalRequired
                      ? 'No approval gate on this quote'
                      : isRequestingApproval
                        ? 'Submitting…'
                        : 'Save draft and submit for manager approval'
              }
              onClick={onRequestApproval}
            >
              <Clock3 className={`w-4 h-4 mr-1 ${isRequestingApproval ? 'animate-pulse' : ''}`} />{' '}
              {isRequestingApproval ? 'Submitting…' : 'Request approval'}
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!selectedQuote || !canSendQuote || isSending || isSaving}
              title={isSending ? 'Sending…' : sendQuoteTooltip}
              onClick={onSendQuote}
            >
              <Send className="w-4 h-4 mr-1" /> {isSending ? 'Sending…' : 'Send quote'}
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenHistory} title="Versions, notes, audit">
              <History className="w-4 h-4 mr-1" /> History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
