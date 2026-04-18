import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardInvoicesLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Finance Invoices..."
      pathTemplate="/finance/{tenantId}/Invoices"
    />
  )
}

