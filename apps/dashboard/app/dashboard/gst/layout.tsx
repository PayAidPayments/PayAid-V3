import LegacyModuleRedirectLayout from '../_components/LegacyModuleRedirectLayout'

export default function LegacyDashboardGstLayout() {
  return (
    <LegacyModuleRedirectLayout
      loadingMessage="Redirecting to Finance GST..."
      target={(tenantId) => `/finance/${tenantId}/GST`}
    />
  )
}

