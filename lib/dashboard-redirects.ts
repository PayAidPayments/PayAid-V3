/**
 * Redirect map: dashboard paths → decoupled module paths.
 * Used to gradually deprecate /dashboard/ by redirecting to /{module}/{tenantId}/...
 * Add entries as decoupled pages are available; remove dashboard routes over time.
 *
 * Path is relative after /dashboard/ (no leading slash). Target is full path with {tenantId} placeholder.
 */

export const DASHBOARD_TO_DECOUPLED: Array<{
  /** Pattern: path after /dashboard/ (e.g. "contacts", "contacts/[id]", "hr/employees") */
  pattern: RegExp | string
  /** Replacement: use {tenantId} for the tenant segment. e.g. "/crm/{tenantId}/Contacts" */
  target: string
}> = [
  // CRM
  { pattern: /^contacts\/?$/, target: '/crm/{tenantId}/Contacts' },
  { pattern: /^contacts\/([^/]+)\/?$/, target: '/crm/{tenantId}/Contacts/$1' },
  { pattern: /^contacts\/([^/]+)\/edit\/?$/, target: '/crm/{tenantId}/Contacts/$1/Edit' },
  { pattern: /^contacts\/new\/?$/, target: '/crm/{tenantId}/Contacts/new' },
  { pattern: /^deals\/?$/, target: '/crm/{tenantId}/Deals' },
  { pattern: /^deals\/([^/]+)\/?$/, target: '/crm/{tenantId}/Deals/$1' },
  { pattern: /^deals\/([^/]+)\/edit\/?$/, target: '/crm/{tenantId}/Deals/$1/Edit' },
  { pattern: /^deals\/new\/?$/, target: '/crm/{tenantId}/Deals/new' },
  { pattern: /^tasks\/?$/, target: '/crm/{tenantId}/Tasks' },
  { pattern: /^tasks\/([^/]+)\/?$/, target: '/crm/{tenantId}/Tasks/$1' },
  { pattern: /^tasks\/new\/?$/, target: '/crm/{tenantId}/Tasks/new' },
  { pattern: /^products\/?$/, target: '/crm/{tenantId}/Products' },
  { pattern: /^products\/([^/]+)\/?$/, target: '/crm/{tenantId}/Products/$1' },
  { pattern: /^products\/new\/?$/, target: '/crm/{tenantId}/Products/new' },
  // Finance
  { pattern: /^invoices\/?$/, target: '/finance/{tenantId}/Invoices' },
  { pattern: /^invoices\/([^/]+)\/?$/, target: '/finance/{tenantId}/Invoices/$1' },
  { pattern: /^invoices\/([^/]+)\/edit\/?$/, target: '/finance/{tenantId}/Invoices/$1/Edit' },
  { pattern: /^invoices\/new\/?$/, target: '/finance/{tenantId}/Invoices/new' },
  { pattern: /^accounting\/expenses\/?$/, target: '/finance/{tenantId}/Accounting/Expenses' },
  { pattern: /^accounting\/expenses\/new\/?$/, target: '/finance/{tenantId}/Accounting/Expenses/New' },
  { pattern: /^purchases\/orders\/?$/, target: '/finance/{tenantId}/Purchase-Orders' },
  { pattern: /^purchases\/orders\/([^/]+)\/?$/, target: '/finance/{tenantId}/Purchase-Orders/$1' },
  { pattern: /^gst\/?$/, target: '/finance/{tenantId}/GST' },
  { pattern: /^recurring-billing\/?$/, target: '/finance/{tenantId}/Recurring-Billing' },
  // HR
  { pattern: /^hr\/employees\/?$/, target: '/hr/{tenantId}/Employees' },
  { pattern: /^hr\/employees\/([^/]+)\/?$/, target: '/hr/{tenantId}/Employees/$1' },
  { pattern: /^hr\/employees\/new\/?$/, target: '/hr/{tenantId}/Employees/new' },
  { pattern: /^hr\/leave\/?$/, target: '/hr/{tenantId}/Leave' },
  { pattern: /^hr\/leave\/balances\/?$/, target: '/hr/{tenantId}/Leave/Balances' },
  { pattern: /^hr\/payroll\/runs\/?$/, target: '/hr/{tenantId}/Payroll-Runs' },
  { pattern: /^hr\/payroll\/runs\/([^/]+)\/?$/, target: '/hr/{tenantId}/Payroll-Runs/$1' },
  { pattern: /^hr\/payroll\/cycles\/?$/, target: '/hr/{tenantId}/Payroll/Cycles' },
  { pattern: /^hr\/payroll\/cycles\/([^/]+)\/?$/, target: '/hr/{tenantId}/Payroll/Cycles/$1' },
  { pattern: /^hr\/onboarding\/?$/, target: '/hr/{tenantId}/Onboarding' },
  { pattern: /^hr\/attendance\/?$/, target: '/hr/{tenantId}/Attendance' },
  { pattern: /^hr\/reports\/?$/, target: '/hr/{tenantId}/Reports' },
  { pattern: /^hr\/settings\/?$/, target: '/hr/{tenantId}/Settings' },
  // Home (dashboard root with tenantId or first segment that looks like list)
  { pattern: /^$/, target: '/home/{tenantId}' },
]

/**
 * Get the decoupled URL for a dashboard pathname, or null if no redirect.
 * Uses tenant.id (or tenantId arg) for the {tenantId} segment.
 */
export function getRedirectForDashboardPath(
  pathname: string,
  tenantId: string
): string | null {
  if (!pathname.startsWith('/dashboard') || !tenantId) return null
  const after = pathname === '/dashboard' || pathname === '/dashboard/'
    ? ''
    : pathname.slice('/dashboard/'.length).replace(/\/$/, '')
  for (const { pattern, target } of DASHBOARD_TO_DECOUPLED) {
    const re = typeof pattern === 'string' ? new RegExp(`^${pattern.replace(/\*/g, '([^/]+)')}\\/?$`) : pattern
    const match = after.match(re)
    if (match) {
      let out = target.replace('{tenantId}', tenantId)
      if (match.length > 1) {
        for (let i = 1; i < match.length; i++) {
          out = out.replace(`$${i}`, match[i])
        }
      }
      return out
    }
  }
  return null
}
