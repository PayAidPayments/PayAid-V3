export type SettingsNavItem = {
  name: string
  href: string
}

export function getSettingsNavItems(tenantId: string): SettingsNavItem[] {
  const base = `/settings/${encodeURIComponent(tenantId)}`
  return [
    { name: 'Overview', href: base },
    { name: 'Profile', href: `${base}/Profile` },
    { name: 'Workspace', href: `${base}/Tenant` },
    { name: 'Users', href: `${base}/Users` },
    { name: 'Roles', href: `${base}/Roles` },
    { name: 'Modules', href: `${base}/Modules` },
    { name: 'Billing', href: `${base}/Billing` },
    { name: 'Integrations', href: `${base}/Integrations` },
    { name: 'Policies', href: `${base}/Policies` },
    { name: 'Admin Console', href: `${base}/AdminConsole` },
    { name: 'Activity', href: `${base}/Activity` },
    { name: 'AI Usage', href: `${base}/AI-Usage` },
  ]
}

