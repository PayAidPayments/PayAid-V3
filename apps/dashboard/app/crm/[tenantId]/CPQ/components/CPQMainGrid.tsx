import { CPQBuilderPanel } from './CPQBuilderPanel'
import { CPQConfigPanel } from './CPQConfigPanel'
import { CPQRightRail } from './CPQRightRail'
import type { CatalogEntry } from '../lib/catalog'
import { DraftLineItem, Quote } from './types'

type CPQMainGridProps = {
  /** Measured sticky offset for the right inspector (module top bar + CPQ header + gap). */
  inspectorSticky?: { topPx: number; maxHeightCss: string }
  catalogSearch: string
  onCatalogSearchChange: (value: string) => void
  filteredCatalog: CatalogEntry[]
  onAddCatalogEntry: (entry: CatalogEntry) => void
  documentFeedback: string | null
  isDocumentBusy: boolean
  onIssueDocument: (channel: 'pdf' | 'web') => void
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <div className="xl:col-span-7 space-y-4">
        <CPQConfigPanel
          catalogSearch={props.catalogSearch}
          onCatalogSearchChange={props.onCatalogSearchChange}
          filteredCatalog={props.filteredCatalog}
          onAddCatalogEntry={props.onAddCatalogEntry}
        />
        <CPQBuilderPanel draftLineItems={props.draftLineItems} onQtyChange={props.onQtyChange} />
      </div>

      <CPQRightRail
        inspectorSticky={props.inspectorSticky}
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
        pricing={props.pricing}
        margin={props.margin}
        documentFeedback={props.documentFeedback}
        isDocumentBusy={props.isDocumentBusy}
        onIssueDocument={props.onIssueDocument}
      />
    </div>
  )
}
