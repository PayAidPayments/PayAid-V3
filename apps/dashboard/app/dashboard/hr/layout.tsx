import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardHrLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to HR..."
      target={(tenantId) => `/hr/${tenantId}/Home`}
    />
  )
}

