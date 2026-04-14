import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardMarketingLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Marketing..."
      target={(tenantId) => `/marketing/${tenantId}/Home`}
    />
  )
}

