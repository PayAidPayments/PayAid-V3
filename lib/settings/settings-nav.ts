/**
 * Single source of truth for Settings module nav.
 * Decoupled routes only: /settings/[tenantId]/...
 */

export interface SettingsNavItem {
  name: string
  href: string
}

export function getSettingsNavItems(tenantId: string): SettingsNavItem[] {
  if (!tenantId?.trim()) return []
  const base = `/settings/${tenantId}`
  return [
    { name: 'Overview', href: base },
    { name: 'Profile', href: `${base}/Profile` },
    { name: 'Workspace', href: `${base}/Tenant` },
    { name: 'Billing', href: `${base}/Billing` },
    { name: 'Users', href: `${base}/Users` },
    { name: 'Modules', href: `${base}/Modules` },
    { name: 'Activity', href: `${base}/Activity` },
    { name: 'AI Usage', href: `${base}/AI-Usage` },
  ]
}
