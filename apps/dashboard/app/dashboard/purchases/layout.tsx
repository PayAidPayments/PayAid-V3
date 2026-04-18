import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardPurchasesLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Finance Purchases..."
      pathTemplate="/finance/{tenantId}/Purchase-Orders"
    />
  )
}

