import { prisma } from '@/lib/db/prisma'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

type HrSelfServiceIntent =
  | 'leave_balance'
  | 'upcoming_leave'
  | 'leave_history'
  | 'payslips'
  | 'attendance_summary'
  | 'leave_policy'

type HrToolName =
  | 'getMyLeaveBalances'
  | 'getMyUpcomingLeave'
  | 'getMyLeaveHistory'
  | 'getMyPayslips'
  | 'getMyAttendanceSummary'
  | 'getLeavePolicyForEmployee'

type HrSelfServiceFallbackReasonCode =
  | 'EMPLOYEE_PROFILE_NOT_LINKED'
  | 'LEAVE_POLICY_NOT_CONFIGURED'
  | 'ESS_PERMISSION_MISSING'
  | 'NO_LEAVE_RECORDS_FOUND'
  | 'NO_PAYSLIPS_FOUND'
  | 'NO_ATTENDANCE_RECORDS_FOUND'
  | 'ACCESS_DENIED'
  | 'TARGET_EMPLOYEE_NOT_FOUND'
  | 'UNRESOLVED_TARGET_EMPLOYEE'

export interface HrSelfServiceInput {
  tenantId: string
  userId: string
  roles: string[]
  permissions: string[]
  licensedModules: string[]
  message: string
}

export interface HrSelfServiceResult {
  handled: boolean
  message?: string
  toolName?: HrToolName
  reasonCode?: HrSelfServiceFallbackReasonCode
  contextSources?: string[]
  auditReason?: string
}

interface ResolvedEmployeeContext {
  employeeId: string
  employeeName: string
  employeeCode: string
}

interface DetectedTargetEmployee {
  raw: string
  hasExplicitReference: boolean
}

const LEAVE_BALANCE_PATTERNS = [
  /\bwhat(?:'s| is)?\s+my\s+leave\s+balance\b/i,
  /\bhow\s+many\s+leaves?\s+do\s+i\s+have\s+left\b/i,
  /\bshow\s+my\s+leave\s+balance\b/i,
  /\bleave\s+balance\b/i,
]

const UPCOMING_LEAVE_PATTERNS = [
  /\bshow\s+my\s+time\s+off\b/i,
  /\bmy\s+upcoming\s+leave\b/i,
  /\bupcoming\s+leave\b/i,
  /\bupcoming\s+time\s+off\b/i,
]

const LEAVE_HISTORY_PATTERNS = [
  /\bmy\s+leave\s+history\b/i,
  /\bshow\s+my\s+leave\s+history\b/i,
  /\bleave\s+taken\b/i,
  /\bpast\s+leaves?\b/i,
]

const PAYSLIP_PATTERNS = [
  /\bshow\s+my\s+payslips?\b/i,
  /\bmy\s+payslips?\b/i,
  /\bpayslips?\b/i,
  /\bpay\s*slips?\b/i,
  /\bsalary\s*slips?\b/i,
]

const ATTENDANCE_PATTERNS = [
  /\bmy\s+attendance\s+summary\b/i,
  /\bshow\s+my\s+attendance\b/i,
  /\battendance\s+summary\b/i,
  /\bwork\s+hours\b/i,
]

const LEAVE_POLICY_PATTERNS = [
  /\bwhat\s+leave\s+policy\s+applies\s+to\s+me\b/i,
  /\bmy\s+leave\s+policy\b/i,
  /\bleave\s+policy\s+for\s+me\b/i,
]

const PRIVILEGED_ROLE_MARKERS = ['admin', 'manager', 'hr', 'supervisor']

function detectHrIntent(message: string): HrSelfServiceIntent | null {
  if (LEAVE_POLICY_PATTERNS.some((pattern) => pattern.test(message))) return 'leave_policy'
  if (LEAVE_BALANCE_PATTERNS.some((pattern) => pattern.test(message))) return 'leave_balance'
  if (UPCOMING_LEAVE_PATTERNS.some((pattern) => pattern.test(message))) return 'upcoming_leave'
  if (LEAVE_HISTORY_PATTERNS.some((pattern) => pattern.test(message))) return 'leave_history'
  if (PAYSLIP_PATTERNS.some((pattern) => pattern.test(message))) return 'payslips'
  if (ATTENDANCE_PATTERNS.some((pattern) => pattern.test(message))) return 'attendance_summary'
  return null
}

function hasHrModuleAccess(modules: string[]): boolean {
  return modules.some((moduleId) => moduleId.toLowerCase() === 'hr')
}

function hasPrivilegedCrossEmployeeAccess(roles: string[], permissions: string[]): boolean {
  const normalizedRoles = roles.map((role) => role.toLowerCase())
  const normalizedPermissions = permissions.map((permission) => permission.toLowerCase())
  const roleAllows = normalizedRoles.some((role) =>
    PRIVILEGED_ROLE_MARKERS.some((marker) => role.includes(marker))
  )
  const permissionAllows = normalizedPermissions.some((permission) =>
    permission.includes('hr:read') || permission.includes('hr:ess:read') || permission.includes('employee:read')
  )
  return roleAllows || permissionAllows
}

function detectTargetEmployee(message: string): DetectedTargetEmployee | null {
  const codePattern = /\bemployee\s+([a-z0-9_-]{3,})\b/i
  const idPattern = /\b(emp[a-z0-9_-]{4,}|c[a-z0-9]{20,})\b/i
  const codeMatch = message.match(codePattern)
  if (codeMatch?.[1]) {
    return { raw: codeMatch[1], hasExplicitReference: true }
  }
  const idMatch = message.match(idPattern)
  if (idMatch?.[1] && !/\bmy\b/i.test(message)) {
    return { raw: idMatch[1], hasExplicitReference: true }
  }
  return null
}

function formatDateTime(value: Date): string {
  return value.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(value: Date): string {
  return value.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function formatEmployeeIdentifierForAudit(employeeId: string): string {
  if (employeeId.length <= 6) return employeeId
  return `${employeeId.slice(0, 3)}***${employeeId.slice(-3)}`
}

function fallbackResponse(
  reasonCode: HrSelfServiceFallbackReasonCode,
  message: string,
  auditReason: string
): HrSelfServiceResult {
  return {
    handled: true,
    reasonCode,
    message,
    contextSources: ['hr_self_service_tool'],
    auditReason,
  }
}

async function resolveEmployeeContext(
  input: HrSelfServiceInput,
  targetEmployee: DetectedTargetEmployee | null
): Promise<{ context: ResolvedEmployeeContext | null; fallback?: HrSelfServiceResult }> {
  const allowCrossEmployee = hasPrivilegedCrossEmployeeAccess(input.roles, input.permissions)
  if (targetEmployee?.hasExplicitReference) {
    if (!allowCrossEmployee) {
      return {
        context: null,
        fallback: fallbackResponse(
          'ACCESS_DENIED',
          "I can only share your own HR self-service data. Access to another employee's records requires manager/admin authorization.",
          'hr_tool_access_denied_cross_employee'
        ),
      }
    }
    const employee = await prisma.employee.findFirst({
      where: {
        tenantId: input.tenantId,
        OR: [{ id: targetEmployee.raw }, { employeeCode: { equals: targetEmployee.raw, mode: 'insensitive' } }],
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!employee) {
      return {
        context: null,
        fallback: fallbackResponse(
          'TARGET_EMPLOYEE_NOT_FOUND',
          `I could not find an employee for "${targetEmployee.raw}" in this tenant. Please provide a valid employee code.`,
          'hr_tool_target_employee_not_found'
        ),
      }
    }

    return {
      context: {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
      },
    }
  }

  const employee = await getEmployeeForUser(input.tenantId, input.userId)
  if (!employee) {
    return {
      context: null,
      fallback: fallbackResponse(
        'EMPLOYEE_PROFILE_NOT_LINKED',
        'Your account is not linked to an employee profile for this tenant. Please contact HR to link your ESS profile.',
        'hr_tool_employee_profile_not_linked'
      ),
    }
  }

  return {
    context: {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    },
  }
}

async function getMyLeaveBalances(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const [leaveTypes, leaveBalances, leavePolicies, pendingRequests] = await Promise.all([
    prisma.leaveType.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.leaveBalance.findMany({
      where: { tenantId, employeeId },
      select: { leaveTypeId: true, balance: true, asOfDate: true },
      orderBy: [{ asOfDate: 'desc' }],
    }),
    prisma.leavePolicy.findMany({
      where: { tenantId },
      select: { leaveTypeId: true },
    }),
    prisma.leaveRequest.count({
      where: { tenantId, employeeId, status: 'PENDING' },
    }),
  ])

  if (leavePolicies.length === 0) {
    return fallbackResponse(
      'LEAVE_POLICY_NOT_CONFIGURED',
      'Leave policy is not configured for this tenant yet. Please contact HR to configure leave policies first.',
      'hr_tool_leave_policy_not_configured'
    )
  }

  if (leaveBalances.length === 0) {
    return fallbackResponse(
      'NO_LEAVE_RECORDS_FOUND',
      'No leave balance records were found for your employee profile yet.',
      'hr_tool_no_leave_records_found'
    )
  }

  const latestByLeaveType = new Map<string, { balance: number; asOfDate: Date }>()
  for (const row of leaveBalances) {
    if (!latestByLeaveType.has(row.leaveTypeId)) {
      latestByLeaveType.set(row.leaveTypeId, {
        balance: Number(row.balance),
        asOfDate: row.asOfDate,
      })
    }
  }

  const lines = leaveTypes
    .map((leaveType) => {
      const latest = latestByLeaveType.get(leaveType.id)
      if (!latest) return null
      return `- ${leaveType.name}: ${latest.balance} days`
    })
    .filter((line): line is string => Boolean(line))

  const allAsOfDates = Array.from(latestByLeaveType.values()).map((row) => row.asOfDate.getTime())
  const latestSyncedAt = allAsOfDates.length > 0 ? new Date(Math.max(...allAsOfDates)) : new Date()

  return {
    handled: true,
    toolName: 'getMyLeaveBalances',
    message: `Your current leave balance is:\n${lines.join('\n')}\n- ${pendingRequests} pending leave request(s)\nLast synced ${formatDateTime(latestSyncedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getMyLeaveBalances success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

async function getMyUpcomingLeave(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const requests = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      employeeId,
      endDate: { gte: today },
      status: { in: ['PENDING', 'APPROVED'] },
    },
    select: {
      startDate: true,
      endDate: true,
      days: true,
      status: true,
      leaveType: {
        select: {
          name: true,
        },
      },
      updatedAt: true,
    },
    orderBy: [{ startDate: 'asc' }],
    take: 10,
  })

  if (requests.length === 0) {
    return fallbackResponse(
      'NO_LEAVE_RECORDS_FOUND',
      'No upcoming leave requests were found for your profile.',
      'hr_tool_no_upcoming_leave'
    )
  }

  const lines = requests.map(
    (request, idx) =>
      `${idx + 1}. ${request.leaveType.name}: ${formatDateOnly(request.startDate)} to ${formatDateOnly(request.endDate)} (${Number(request.days)} days, ${request.status})`
  )
  const latestUpdatedAt = new Date(Math.max(...requests.map((request) => request.updatedAt.getTime())))

  return {
    handled: true,
    toolName: 'getMyUpcomingLeave',
    message: `Here is your upcoming time off:\n${lines.join('\n')}\nLast synced ${formatDateTime(latestUpdatedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getMyUpcomingLeave success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

async function getMyLeaveHistory(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      employeeId,
    },
    select: {
      startDate: true,
      endDate: true,
      days: true,
      status: true,
      leaveType: {
        select: {
          name: true,
        },
      },
      updatedAt: true,
    },
    orderBy: [{ startDate: 'desc' }],
    take: 12,
  })

  if (requests.length === 0) {
    return fallbackResponse(
      'NO_LEAVE_RECORDS_FOUND',
      'No leave history records were found for your profile.',
      'hr_tool_no_leave_history'
    )
  }

  const lines = requests.map(
    (request, idx) =>
      `${idx + 1}. ${request.leaveType.name}: ${formatDateOnly(request.startDate)} to ${formatDateOnly(request.endDate)} (${Number(request.days)} days, ${request.status})`
  )
  const latestUpdatedAt = new Date(Math.max(...requests.map((request) => request.updatedAt.getTime())))

  return {
    handled: true,
    toolName: 'getMyLeaveHistory',
    message: `Your leave history:\n${lines.join('\n')}\nLast synced ${formatDateTime(latestUpdatedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getMyLeaveHistory success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

async function getMyPayslips(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const runs = await prisma.payrollRun.findMany({
    where: {
      tenantId,
      employeeId,
    },
    select: {
      id: true,
      netPayInr: true,
      payoutStatus: true,
      generatedAt: true,
      createdAt: true,
      cycle: {
        select: {
          month: true,
          year: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 6,
  })

  if (runs.length === 0) {
    return fallbackResponse('NO_PAYSLIPS_FOUND', 'No payslips were found for your profile.', 'hr_tool_no_payslips')
  }

  const lines = runs.map(
    (run, idx) =>
      `${idx + 1}. ${formatMonthYear(run.cycle.month, run.cycle.year)}: ₹${Number(run.netPayInr).toLocaleString('en-IN')} (${run.payoutStatus})`
  )
  const latestUpdatedAt = new Date(
    Math.max(...runs.map((run) => (run.generatedAt ?? run.createdAt).getTime()))
  )

  return {
    handled: true,
    toolName: 'getMyPayslips',
    message: `Your recent payslips:\n${lines.join('\n')}\nLast synced ${formatDateTime(latestUpdatedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getMyPayslips success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

async function getMyAttendanceSummary(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  startDate.setHours(0, 0, 0, 0)

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      employeeId,
      date: {
        gte: startDate,
      },
    },
    select: {
      date: true,
      status: true,
      workHours: true,
      updatedAt: true,
    },
    orderBy: [{ date: 'desc' }],
  })

  if (records.length === 0) {
    return fallbackResponse(
      'NO_ATTENDANCE_RECORDS_FOUND',
      'No attendance records were found for the last 30 days.',
      'hr_tool_no_attendance_records'
    )
  }

  const presentCount = records.filter((record) => record.status === 'PRESENT').length
  const absentCount = records.filter((record) => record.status === 'ABSENT').length
  const leaveCount = records.filter((record) => record.status === 'LEAVE').length
  const totalWorkHours = records.reduce((sum, record) => sum + Number(record.workHours ?? 0), 0)
  const averageWorkHours = totalWorkHours / records.length
  const latestUpdatedAt = new Date(Math.max(...records.map((record) => record.updatedAt.getTime())))

  return {
    handled: true,
    toolName: 'getMyAttendanceSummary',
    message: `Your attendance summary (last 30 days):\n- Present: ${presentCount} days\n- Absent: ${absentCount} days\n- Leave: ${leaveCount} days\n- Average work hours/day: ${averageWorkHours.toFixed(2)}\nLast synced ${formatDateTime(latestUpdatedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getMyAttendanceSummary success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

async function getLeavePolicyForEmployee(employeeId: string, tenantId: string): Promise<HrSelfServiceResult> {
  const policies = await prisma.leavePolicy.findMany({
    where: {
      tenantId,
    },
    select: {
      accrualType: true,
      accrualAmount: true,
      maxBalance: true,
      carryForwardLimit: true,
      minDaysNotice: true,
      maxConsecutiveDays: true,
      requiresApproval: true,
      leaveType: {
        select: {
          name: true,
        },
      },
      updatedAt: true,
    },
    orderBy: [{ leaveType: { name: 'asc' } }],
  })

  if (policies.length === 0) {
    return fallbackResponse(
      'LEAVE_POLICY_NOT_CONFIGURED',
      'No leave policy is configured for your tenant yet.',
      'hr_tool_leave_policy_not_configured'
    )
  }

  const lines = policies.map((policy, idx) => {
    const details = [
      `Accrual: ${Number(policy.accrualAmount)} (${policy.accrualType})`,
      `Approval: ${policy.requiresApproval ? 'Required' : 'Not required'}`,
      policy.maxBalance != null ? `Max balance: ${Number(policy.maxBalance)}` : null,
      policy.carryForwardLimit != null ? `Carry forward: ${Number(policy.carryForwardLimit)}` : null,
      policy.minDaysNotice != null ? `Min notice: ${policy.minDaysNotice} day(s)` : null,
      policy.maxConsecutiveDays != null ? `Max consecutive: ${policy.maxConsecutiveDays} day(s)` : null,
    ].filter((value): value is string => Boolean(value))
    return `${idx + 1}. ${policy.leaveType.name} - ${details.join(', ')}`
  })
  const latestUpdatedAt = new Date(Math.max(...policies.map((policy) => policy.updatedAt.getTime())))

  return {
    handled: true,
    toolName: 'getLeavePolicyForEmployee',
    message: `Your applicable leave policy:\n${lines.join('\n')}\nLast synced ${formatDateTime(latestUpdatedAt)}.`,
    contextSources: ['hr_self_service_tool'],
    auditReason: `hr_tool:getLeavePolicyForEmployee success employee:${formatEmployeeIdentifierForAudit(employeeId)}`,
  }
}

export async function handleHrSelfServiceQuery(input: HrSelfServiceInput): Promise<HrSelfServiceResult> {
  const intent = detectHrIntent(input.message)
  if (!intent) {
    return { handled: false }
  }

  if (!hasHrModuleAccess(input.licensedModules)) {
    return fallbackResponse(
      'ESS_PERMISSION_MISSING',
      'ESS permission is missing for this account. Please ask your admin to enable the HR module access for self-service.',
      'hr_tool_ess_permission_missing'
    )
  }

  const targetEmployee = detectTargetEmployee(input.message)
  if (targetEmployee && /\bmy\b/i.test(input.message)) {
    return fallbackResponse(
      'UNRESOLVED_TARGET_EMPLOYEE',
      "I detected both 'my' and another employee reference. Please ask either for your own data or provide only the target employee code.",
      'hr_tool_ambiguous_target_employee'
    )
  }

  const resolved = await resolveEmployeeContext(input, targetEmployee)
  if (!resolved.context) {
    return resolved.fallback || { handled: false }
  }

  const { employeeId } = resolved.context
  switch (intent) {
    case 'leave_balance':
      return getMyLeaveBalances(employeeId, input.tenantId)
    case 'upcoming_leave':
      return getMyUpcomingLeave(employeeId, input.tenantId)
    case 'leave_history':
      return getMyLeaveHistory(employeeId, input.tenantId)
    case 'payslips':
      return getMyPayslips(employeeId, input.tenantId)
    case 'attendance_summary':
      return getMyAttendanceSummary(employeeId, input.tenantId)
    case 'leave_policy':
      return getLeavePolicyForEmployee(employeeId, input.tenantId)
    default:
      return { handled: false }
  }
}

export const __private__ = {
  detectHrIntent,
  detectTargetEmployee,
  hasPrivilegedCrossEmployeeAccess,
  hasHrModuleAccess,
}
