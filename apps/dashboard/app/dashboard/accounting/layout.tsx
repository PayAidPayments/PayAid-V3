import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardAccountingLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Finance Accounting..."
      target={(tenantId) => `/finance/${tenantId}/Accounting`}
    />
  )
}

