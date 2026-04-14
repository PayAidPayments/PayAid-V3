import { CPQBuilderPanel } from './CPQBuilderPanel'
import { CPQConfigPanel } from './CPQConfigPanel'
import { CPQRightRail } from './CPQRightRail'
import { DraftLineItem, Quote } from './types'

type CPQMainGridProps = {
  catalogSearch: string
  onCatalogSearchChange: (value: string) => void
  filteredCatalog: string[]
  approvalRequired: boolean
  approvalReason: string
  draftLineItems: DraftLineItem[]
  onQtyChange: (id: string, qty: number) => void
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
  selectedQuote: Quote | null
  approvalNote: string
  rejectReason: string
  onApprovalNoteChange: (value: string) => void
  onRejectReasonChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  onConvert: () => void
  isApproving: boolean
  isConverting: boolean
}

export function CPQMainGrid(props: CPQMainGridProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <section className="xl:col-span-4 space-y-4">
        <CPQConfigPanel
          catalogSearch={props.catalogSearch}
          onCatalogSearchChange={props.onCatalogSearchChange}
          filteredCatalog={props.filteredCatalog}
          approvalRequired={props.approvalRequired}
          approvalReason={props.approvalReason}
        />
      </section>

      <CPQBuilderPanel
        draftLineItems={props.draftLineItems}
        onQtyChange={props.onQtyChange}
        pricing={props.pricing}
        margin={props.margin}
        approvalRequired={props.approvalRequired}
        approvalReason={props.approvalReason}
      />

      <CPQRightRail
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
        discountPct={props.margin.discountPct}
      />
    </div>
  )
}
