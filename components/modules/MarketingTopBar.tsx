'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function MarketingTopBar() {
  return (
    <ModuleTopBar
      moduleId="marketing"
      moduleName="Marketing"
      items={[
        { name: 'Home', href: '/dashboard/marketing', icon: '🏠' },
        { name: 'Campaigns', href: '/dashboard/marketing/campaigns', icon: '📢' },
        { name: 'Email', href: '/dashboard/email-templates', icon: '✉️' },
        { name: 'Social Media', href: '/dashboard/marketing/social', icon: '📱' },
        { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: '💬' },
        { name: 'Analytics', href: '/dashboard/marketing/analytics', icon: '📊' },
      ]}
    />
  )
}

