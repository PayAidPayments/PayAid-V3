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
  { pattern: /^contacts\/([^/]+)\/?$/, target: '/crm/{tenantId}/Contacts/__CAP1__' },
  { pattern: /^contacts\/([^/]+)\/edit\/?$/, target: '/crm/{tenantId}/Contacts/__CAP1__/Edit' },
  { pattern: /^contacts\/new\/?$/, target: '/crm/{tenantId}/Contacts/new' },
  { pattern: /^deals\/?$/, target: '/crm/{tenantId}/Deals' },
  { pattern: /^deals\/([^/]+)\/?$/, target: '/crm/{tenantId}/Deals/__CAP1__' },
  { pattern: /^deals\/([^/]+)\/edit\/?$/, target: '/crm/{tenantId}/Deals/__CAP1__/Edit' },
  { pattern: /^deals\/new\/?$/, target: '/crm/{tenantId}/Deals/new' },
  { pattern: /^tasks\/?$/, target: '/crm/{tenantId}/Tasks' },
  { pattern: /^tasks\/([^/]+)\/?$/, target: '/crm/{tenantId}/Tasks/__CAP1__' },
  { pattern: /^tasks\/new\/?$/, target: '/crm/{tenantId}/Tasks/new' },
  { pattern: /^products\/?$/, target: '/crm/{tenantId}/Products' },
  { pattern: /^products\/([^/]+)\/?$/, target: '/crm/{tenantId}/Products/__CAP1__' },
  { pattern: /^products\/new\/?$/, target: '/crm/{tenantId}/Products/new' },
  // Finance
  { pattern: /^invoices\/?$/, target: '/finance/{tenantId}/Invoices' },
  { pattern: /^invoices\/([^/]+)\/?$/, target: '/finance/{tenantId}/Invoices/__CAP1__' },
  { pattern: /^invoices\/([^/]+)\/edit\/?$/, target: '/finance/{tenantId}/Invoices/__CAP1__/Edit' },
  { pattern: /^invoices\/new\/?$/, target: '/finance/{tenantId}/Invoices/new' },
  { pattern: /^accounting\/expenses\/?$/, target: '/finance/{tenantId}/Accounting/Expenses' },
  { pattern: /^accounting\/expenses\/new\/?$/, target: '/finance/{tenantId}/Accounting/Expenses/New' },
  { pattern: /^purchases\/orders\/?$/, target: '/finance/{tenantId}/Purchase-Orders' },
  { pattern: /^purchases\/orders\/([^/]+)\/?$/, target: '/finance/{tenantId}/Purchase-Orders/__CAP1__' },
  { pattern: /^gst\/?$/, target: '/finance/{tenantId}/GST' },
  { pattern: /^recurring-billing\/?$/, target: '/finance/{tenantId}/Recurring-Billing' },
  // HR
  { pattern: /^hr\/employees\/?$/, target: '/hr/{tenantId}/Employees' },
  { pattern: /^hr\/employees\/([^/]+)\/?$/, target: '/hr/{tenantId}/Employees/__CAP1__' },
  { pattern: /^hr\/employees\/new\/?$/, target: '/hr/{tenantId}/Employees/new' },
  { pattern: /^hr\/leave\/?$/, target: '/hr/{tenantId}/Leave' },
  { pattern: /^hr\/leave\/balances\/?$/, target: '/hr/{tenantId}/Leave/Balances' },
  { pattern: /^hr\/payroll\/runs\/?$/, target: '/hr/{tenantId}/Payroll-Runs' },
  { pattern: /^hr\/payroll\/runs\/([^/]+)\/?$/, target: '/hr/{tenantId}/Payroll-Runs/__CAP1__' },
  { pattern: /^hr\/payroll\/cycles\/?$/, target: '/hr/{tenantId}/Payroll/Cycles' },
  { pattern: /^hr\/payroll\/cycles\/([^/]+)\/?$/, target: '/hr/{tenantId}/Payroll/Cycles/__CAP1__' },
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
          out = out.replaceAll(`__CAP${i}__`, match[i] ?? '')
        }
      }
      return out
    }
  }
  return null
}
