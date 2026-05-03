'use client'

import { useLayoutEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AiQuoteAssistantCard } from './AiQuoteAssistantCard'
import { ApprovalStatusCard } from './ApprovalStatusCard'
import { MarginAnalysisCard } from './MarginAnalysisCard'
import { PricingBreakdownCard } from './PricingBreakdownCard'
import { PricingRuleSummaryCard } from './PricingRuleSummaryCard'
import { QuoteOutputCard } from './QuoteOutputCard'
import { Quote } from './types'

type CPQRightRailProps = {
  inspectorSticky?: { topPx: number; maxHeightCss: string }
  selectedQuote: Quote | null
  approvalRequired: boolean
  approvalReason: string
  approvalNote: string
  rejectReason: string
  onApprovalNoteChange: (value: string) => void
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  onConvert: () => void
  isApproving: boolean
  isConverting: boolean
  discountPct: number
  pricing: {
    subtotal: number
    discount: number
    tax: number
    recurringTotal: number
    oneTimeTotal: number
    total: number
  }
  margin: {
    listPrice: number
    soldPrice: number
    discountPct: number
    marginPct: number
  }
  documentFeedback: string | null
  isDocumentBusy: boolean
  onIssueDocument: (channel: 'pdf' | 'web') => void
}

const XL_MIN = '(min-width: 1280px)'

export function CPQRightRail(props: CPQRightRailProps) {
  const [aiOpen, setAiOpen] = useState(false)
  const [xlUp, setXlUp] = useState(false)
  const sticky = props.inspectorSticky

  useLayoutEffect(() => {
    const mq = window.matchMedia(XL_MIN)
    const apply = () => setXlUp(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const stickyStyle =
    xlUp
      ? sticky
        ? { top: sticky.topPx, maxHeight: sticky.maxHeightCss }
        : { top: 320, maxHeight: 'calc(100dvh - 21rem)' }
      : undefined

  return (
    <aside
      className="xl:col-span-5 space-y-4 xl:sticky xl:z-10 xl:overflow-y-auto xl:self-start xl:pr-1 xl:-mr-1"
      style={stickyStyle}
      aria-label="Pricing and output"
    >
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Live pricing</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Totals and policy checks for the quote you are editing.
        </p>
      </div>

      <PricingBreakdownCard pricing={props.pricing} />
      <MarginAnalysisCard margin={props.margin} approvalRequired={props.approvalRequired} />
      <PricingRuleSummaryCard
        approvalRequired={props.approvalRequired}
        approvalReason={props.approvalReason}
      />

      <div className={props.approvalRequired ? 'ring-2 ring-amber-200/80 dark:ring-amber-900/50 rounded-2xl' : ''}>
        <ApprovalStatusCard
          selectedQuote={props.selectedQuote}
          approvalRequired={props.approvalRequired}
          approvalReason={props.approvalReason}
          approvalNote={props.approvalNote}
          rejectReason={props.rejectReason}
          onApprovalNoteChange={props.onApprovalNoteChange}
          onRejectReasonChange={props.onRejectReasonChange}
          onApprove={props.onApprove}
          onReject={props.onReject}
          onConvert={props.onConvert}
          isApproving={props.isApproving}
          isConverting={props.isConverting}
        />
      </div>

      <QuoteOutputCard
        disabled={!props.selectedQuote}
        isDocumentBusy={props.isDocumentBusy}
        documentMessage={props.documentFeedback}
        onPdf={() => props.onIssueDocument('pdf')}
        onWeb={() => props.onIssueDocument('web')}
      />

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-none h-auto py-3 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80"
          onClick={() => setAiOpen((v) => !v)}
          aria-expanded={aiOpen}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Quote assistant
          </span>
          {aiOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {aiOpen ? (
          <div className="border-t border-slate-200/80 dark:border-slate-800 px-0 pb-0">
            <AiQuoteAssistantCard discountPct={props.discountPct} className="border-0 shadow-none rounded-none" />
          </div>
        ) : null}
      </div>
    </aside>
  )
}
