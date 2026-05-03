import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardAccountingLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Finance Accounting..."
      pathTemplate="/finance/{tenantId}/Accounting"
    />
  )
}

