/**
 * Single source of truth for HR module top bar.
 * Used in app/hr/[tenantId]/layout.tsx.
 *
 * Naming: Recruitment → Hiring; Payroll Runs + Salary Structures → under Payroll;
 * Leaves & Holidays → Time Off; Payslips & Forms → Documents & Forms; Statutory Compliance → Compliance.
 */

export interface HRTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getHRTopBarItems(tenantId: string): HRTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/hr/${tenantId}`
  return [
    { name: 'Dashboard', href: `${base}/Home` },
    { name: 'Employees', href: `${base}/Employees` },
    { name: 'Contractors', href: `${base}/Contractors` },
    { name: 'Hiring', href: `${base}/Hiring` },
    { name: 'Onboarding', href: `${base}/Onboarding` },
    { name: 'Exit Management', href: `${base}/Offboarding` },
    { name: 'Payroll', href: `${base}/Payroll` },
    { name: 'Attendance', href: `${base}/Attendance` },
    { name: 'Time Off', href: `${base}/Leave` },
    { name: 'Performance', href: `${base}/Performance` },
    { name: 'Documents & Forms', href: `${base}/Payslips` },
    { name: 'Reimbursements', href: `${base}/Reimbursements` },
    { name: 'Assets', href: `${base}/Assets` },
    { name: 'Compliance', href: `${base}/Statutory-Compliance` },
    { name: 'Insurance & Benefits', href: `${base}/Insurance` },
    { name: 'Org Chart', href: `${base}/OrgChart` },
    { name: 'Reports & Analytics', href: `${base}/Reports` },
    { name: 'Settings', href: `${base}/Settings` },
  ]
}
