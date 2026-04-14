'use client'

import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import {
  CPQHeader,
  CPQMainGrid,
  CPQProgressStrip,
  CPQTabs,
  QuoteSelectorPanel,
  QuoteHealthBanner,
  VersionHistoryPanel,
} from './components'
import { useCPQWorkspace } from './hooks'

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const {
    seedMessage,
    activeTab,
    setActiveTab,
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
    filteredCatalog,
    isLoading,
    error,
    refetch,
    seedMutation,
    approveMutation,
    convertMutation,
  } = useCPQWorkspace(tenantId)

  if (isLoading) return <PageLoading message="Loading CPQ workspace..." fullScreen={false} />

  if (!quotes.length && !error) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-16 text-center">
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No quotes yet</p>
            <p className="text-sm text-slate-500 mb-6">Load guided demo quotes to showcase configure, pricing, approval, and send workflow.</p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
                title={seedMutation.isPending ? 'Seeding demo quotes...' : 'Add demo CPQ records'}
              >
                {seedMutation.isPending ? 'Seeding Demo Quotes...' : 'Seed Demo Quotes'}
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

      <CPQHeader selectedQuote={selectedQuote} onRefresh={() => refetch()} />
      <QuoteHealthBanner healthScore={healthScore} healthChecks={healthChecks} />
      <CPQProgressStrip healthChecks={healthChecks} />

      <CPQMainGrid
        catalogSearch={catalogSearch}
        onCatalogSearchChange={setCatalogSearch}
        filteredCatalog={filteredCatalog}
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

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 space-y-4">
          <CPQTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'builder' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Builder focuses on configuration + line items. Use inline quantity edits to see live total changes.
            </div>
          ) : null}
          {activeTab === 'pricing' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Pricing rules applied: GST 18%, negotiated discounts, and recurring/one-time split.
            </div>
          ) : null}
          {activeTab === 'approvals' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Approval matrix checks discount and total thresholds before send.
            </div>
          ) : null}
          {activeTab === 'document' ? (
            <div data-testid="cpq-document-preview" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
              Document Preview loads on demand. Generate customer-facing PDF with version, language, and web quote link.
            </div>
          ) : null}
          {activeTab === 'history' ? <VersionHistoryPanel quotes={quotes} /> : null}
        </CardContent>
      </Card>

      <QuoteSelectorPanel
        quotes={quotes}
        selectedQuoteId={selectedQuote?.id}
        onSelectQuote={setSelectedQuoteId}
      />
    </div>
  )
}
