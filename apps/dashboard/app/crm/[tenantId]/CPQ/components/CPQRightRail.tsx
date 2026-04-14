import { AiQuoteAssistantCard } from './AiQuoteAssistantCard'
import { ApprovalStatusCard } from './ApprovalStatusCard'
import { CustomerDealContextCard } from './CustomerDealContextCard'
import { QuoteOutputCard } from './QuoteOutputCard'
import { Quote } from './types'

type CPQRightRailProps = {
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
}

export function CPQRightRail(props: CPQRightRailProps) {
  return (
    <section className="xl:col-span-3 space-y-4">
      <CustomerDealContextCard selectedQuote={props.selectedQuote} />
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
      <QuoteOutputCard />
      <AiQuoteAssistantCard discountPct={props.discountPct} />
    </section>
  )
}
