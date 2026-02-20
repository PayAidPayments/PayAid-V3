'use client'

import { TabbedPage } from '@/components/super-admin/layout/TabbedPage'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Import existing page components
import SuperAdminFeatureFlagsPage from '../feature-flags/page'
import SuperAdminSettingsPage from '../settings/page'
import SuperAdminIntegrationsPage from '../integrations/page'
import SuperAdminApiKeysPage from '../api-keys/page'
import SuperAdminWhatsappPage from '../whatsapp/page'

const tabs = [
  { id: 'feature-flags', label: 'Feature Flags', href: '/super-admin/configuration/feature-flags' },
  { id: 'settings', label: 'Platform Settings', href: '/super-admin/configuration/settings' },
  { id: 'integrations', label: 'Integrations & API', href: '/super-admin/configuration/integrations' },
  { id: 'api-keys', label: 'API Key Oversight', href: '/super-admin/configuration/api-keys' },
  { id: 'whatsapp', label: 'Mobile & WhatsApp', href: '/super-admin/configuration/whatsapp' },
]

export default function ConfigurationPage() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/super-admin/configuration') {
      router.replace('/super-admin/configuration/feature-flags')
    }
  }, [pathname, router])

  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0]

  return (
    <TabbedPage
      title="Configuration"
      description="How the platform behaves: modules, flags, integrations"
      tabs={tabs}
    >
      {activeTab.id === 'feature-flags' && <SuperAdminFeatureFlagsPage />}
      {activeTab.id === 'settings' && <SuperAdminSettingsPage />}
      {activeTab.id === 'integrations' && <SuperAdminIntegrationsPage />}
      {activeTab.id === 'api-keys' && <SuperAdminApiKeysPage />}
      {activeTab.id === 'whatsapp' && <SuperAdminWhatsappPage />}
    </TabbedPage>
  )
}
