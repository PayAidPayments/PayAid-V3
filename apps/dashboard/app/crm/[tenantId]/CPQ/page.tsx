'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import {
  CPQFlowStepper,
  CPQHeader,
  CPQMainGrid,
  CPQSupportSheet,
  type CPQSupportSheetMode,
} from './components'
import { useCPQWorkspace, useObservedHeight } from './hooks'

const MODULE_TOPBAR_PX = 56
const INSPECTOR_GAP_PX = 8
const INSPECTOR_BOTTOM_PAD_PX = 12
/** Approximate CPQ header height before ResizeObserver first run. */
const CPQ_HEADER_FALLBACK_PX = 264

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const cpqHeaderRef = useRef<HTMLDivElement>(null)
  const cpqHeaderHeight = useObservedHeight(cpqHeaderRef)
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportMode, setSupportMode] = useState<CPQSupportSheetMode>('history')

  const openSupport = (mode: CPQSupportSheetMode) => {
    setSupportMode(mode)
    setSupportOpen(true)
  }

  const {
    seedMessage,
    catalogSearch,
    setCatalogSearch,
    draftLineItems,
    setDraftLineItems,
    approvalNote,
    setApprovalNote,
    rejectReason,
    setRejectReason,
    quotes,
    selectedQuote,
    setSelectedQuoteId,
    pricing,
    margin,
    approvalRequired,
    approvalReason,
    healthChecks,
    healthScore,
    canSendQuote,
    sendQuoteTooltip,
    filteredCatalog,
    isLoading,
    error,
    refetch,
    seedMutation,
    approveMutation,
    convertMutation,
    addCatalogLine,
    saveDraftMutation,
    requestApprovalMutation,
    sendQuoteMutation,
    documentMutation,
    documentFeedback,
  } = useCPQWorkspace(tenantId)

  const canSaveQuote = !!selectedQuote && draftLineItems.length > 0
  const approvalTerminalStatuses = new Set([
    'pending_approval',
    'sent',
    'accepted',
    'converted',
    'rejected',
  ])
  const canRequestApproval =
    !!selectedQuote &&
    approvalRequired &&
    draftLineItems.length > 0 &&
    !approvalTerminalStatuses.has(selectedQuote.status ?? '')

  const saveError = saveDraftMutation.error instanceof Error ? saveDraftMutation.error.message : null
  const sendError = sendQuoteMutation.error instanceof Error ? sendQuoteMutation.error.message : null
  const requestApprovalError =
    requestApprovalMutation.error instanceof Error ? requestApprovalMutation.error.message : null

  const issueDocument = async (channel: 'pdf' | 'web') => {
    if (!selectedQuote || !tenantId) return
    await documentMutation.mutateAsync(channel)
    const path = `/crm/${tenantId}/CPQ/preview/${selectedQuote.id}${channel === 'pdf' ? '?print=1' : ''}`
    globalThis.open(path, '_blank', 'noopener')
  }

  if (isLoading) return <PageLoading message="Loading CPQ workspace..." fullScreen={false} />

  if (!quotes.length && !error) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-16 text-center">
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No quotes yet</p>
            <p className="text-sm text-slate-500 mb-6">
              Load guided demo quotes to showcase configure, pricing, approval, and send workflow.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
                title={seedMutation.isPending ? 'Seeding demo quotes...' : 'Add demo CPQ records'}
              >
                {seedMutation.isPending ? 'Seeding demo quotes...' : 'Seed demo quotes'}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const headerBlockPx =
    cpqHeaderHeight > 0 ? cpqHeaderHeight : CPQ_HEADER_FALLBACK_PX
  const inspectorTopPx = MODULE_TOPBAR_PX + headerBlockPx + INSPECTOR_GAP_PX
  const inspectorMaxHeightCss = `calc(100dvh - ${inspectorTopPx + INSPECTOR_BOTTOM_PAD_PX}px)`

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Failed to load quotes. Please refresh.
        </div>
      ) : null}
      {seedMessage ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {seedMessage}
        </div>
      ) : null}
      {saveError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {saveError}
        </div>
      ) : null}
      {sendError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {sendError}
        </div>
      ) : null}
      {requestApprovalError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {requestApprovalError}
        </div>
      ) : null}

      <CPQHeader
        ref={cpqHeaderRef}
        quotes={quotes}
        selectedQuote={selectedQuote}
        onSelectQuote={setSelectedQuoteId}
        onSaveQuote={() => saveDraftMutation.mutate()}
        onSendQuote={() => sendQuoteMutation.mutate()}
        isSaving={saveDraftMutation.isPending}
        isSending={sendQuoteMutation.isPending}
        canSaveQuote={canSaveQuote}
        onReloadQuotes={() => refetch()}
        onOpenHistory={() => openSupport('history')}
        onOpenPreview={() => openSupport('preview')}
        canSendQuote={canSendQuote}
        sendQuoteTooltip={sendQuoteTooltip}
        approvalRequired={approvalRequired}
        onRequestApproval={() => requestApprovalMutation.mutate()}
        isRequestingApproval={requestApprovalMutation.isPending}
        canRequestApproval={canRequestApproval}
      />

      <CPQFlowStepper healthChecks={healthChecks} healthScore={healthScore} />

      <CPQMainGrid
        inspectorSticky={{ topPx: inspectorTopPx, maxHeightCss: inspectorMaxHeightCss }}
        catalogSearch={catalogSearch}
        onCatalogSearchChange={setCatalogSearch}
        filteredCatalog={filteredCatalog}
        onAddCatalogEntry={addCatalogLine}
        documentFeedback={documentFeedback}
        isDocumentBusy={documentMutation.isPending}
        onIssueDocument={(channel) => {
          void issueDocument(channel)
        }}
        approvalRequired={approvalRequired}
        approvalReason={approvalReason}
        draftLineItems={draftLineItems}
        onQtyChange={(id, qty) => {
          setDraftLineItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)))
        }}
        pricing={pricing}
        margin={margin}
        selectedQuote={selectedQuote}
        approvalNote={approvalNote}
        rejectReason={rejectReason}
        onApprovalNoteChange={setApprovalNote}
        onRejectReasonChange={setRejectReason}
        onApprove={() => approveMutation.mutate('approved')}
        onReject={() => approveMutation.mutate('rejected')}
        onConvert={() => convertMutation.mutate()}
        isApproving={approveMutation.isPending}
        isConverting={convertMutation.isPending}
      />

      <CPQSupportSheet
        open={supportOpen}
        onOpenChange={setSupportOpen}
        mode={supportMode}
        quotes={quotes}
      />
    </div>
  )
}
