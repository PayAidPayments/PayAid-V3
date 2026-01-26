import { prisma } from '@/lib/db/prisma'
import { maskPIIInText, containsPII } from '@/lib/compliance/pii-detector'
import { logAudit } from '@/lib/compliance/audit-logger'

export interface SecurityAuditResult {
  timestamp: Date
  tenantId: string
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    details?: any
  }>
  score: number // 0-100
  recommendations: string[]
}

/**
 * Run comprehensive security audit
 */
export async function runSecurityAudit(tenantId: string): Promise<SecurityAuditResult> {
  const checks: SecurityAuditResult['checks'] = []
  let passCount = 0
  let totalChecks = 0

  // 1. Check PII masking implementation
  totalChecks++
  try {
    const testData = { email: 'test@example.com', phone: '1234567890' }
    const masked = maskPIIInText(JSON.stringify(testData))
    if (masked.includes('***') || masked.includes('****')) {
      checks.push({
        name: 'PII Masking',
        status: 'pass',
        message: 'PII masking is properly implemented',
      })
      passCount++
    } else {
      checks.push({
        name: 'PII Masking',
        status: 'fail',
        message: 'PII masking may not be working correctly',
      })
    }
  } catch (error) {
    checks.push({
      name: 'PII Masking',
      status: 'fail',
      message: `PII masking check failed: ${error}`,
    })
  }

  // 2. Check audit logging
  totalChecks++
  try {
    const recentLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      take: 1,
      orderBy: { createdAt: 'desc' },
    })
    checks.push({
      name: 'Audit Logging',
      status: recentLogs.length > 0 ? 'pass' : 'warning',
      message: recentLogs.length > 0
        ? 'Audit logging is active'
        : 'No audit logs found (may be new tenant)',
    })
    if (recentLogs.length > 0) passCount++
    else passCount += 0.5 // Partial credit
  } catch (error) {
    checks.push({
      name: 'Audit Logging',
      status: 'fail',
      message: `Audit logging check failed: ${error}`,
    })
  }

  // 3. Check data encryption
  totalChecks++
  try {
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { tenantId },
      select: { providerCredentials: true },
    })
    if (emailAccount?.providerCredentials) {
      const creds = emailAccount.providerCredentials as any
      // Check if credentials are encrypted (not plain text)
      if (typeof creds === 'object' && creds.encrypted) {
        checks.push({
          name: 'Data Encryption',
          status: 'pass',
          message: 'OAuth credentials are encrypted',
        })
        passCount++
      } else {
        checks.push({
          name: 'Data Encryption',
          status: 'warning',
          message: 'Credentials may not be encrypted',
        })
        passCount += 0.5
      }
    } else {
      checks.push({
        name: 'Data Encryption',
        status: 'warning',
        message: 'No email accounts found to verify encryption',
      })
      passCount += 0.5
    }
  } catch (error) {
    checks.push({
      name: 'Data Encryption',
      status: 'fail',
      message: `Encryption check failed: ${error}`,
    })
  }

  // 4. Check access control
  totalChecks++
  try {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true, role: true },
    })
    const hasAdmin = users.some((u) => u.role === 'admin' || u.role === 'owner')
    const hasMembers = users.some((u) => u.role === 'member')
    checks.push({
      name: 'Access Control',
      status: hasAdmin && hasMembers ? 'pass' : 'warning',
      message: hasAdmin && hasMembers
        ? 'Role-based access control is configured'
        : 'Access control may need review',
      details: {
        adminCount: users.filter((u) => u.role === 'admin' || u.role === 'owner').length,
        memberCount: users.filter((u) => u.role === 'member').length,
      },
    })
    if (hasAdmin && hasMembers) passCount++
    else passCount += 0.5
  } catch (error) {
    checks.push({
      name: 'Access Control',
      status: 'fail',
      message: `Access control check failed: ${error}`,
    })
  }

  // 5. Check GDPR compliance
  totalChecks++
  try {
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { metadata: true },
      take: 10,
    })
    const hasConsent = contacts.some((c) => {
      const meta = c.metadata as any
      return meta?.callRecordingConsent !== undefined || meta?.emailConsent !== undefined
    })
    checks.push({
      name: 'GDPR Compliance',
      status: hasConsent ? 'pass' : 'warning',
      message: hasConsent
        ? 'Consent tracking is implemented'
        : 'Consent tracking may need to be enabled',
    })
    if (hasConsent) passCount++
    else passCount += 0.5
  } catch (error) {
    checks.push({
      name: 'GDPR Compliance',
      status: 'fail',
      message: `GDPR compliance check failed: ${error}`,
    })
  }

  // Calculate score
  const score = Math.round((passCount / totalChecks) * 100)

  // Generate recommendations
  const recommendations: string[] = []
  const failedChecks = checks.filter((c) => c.status === 'fail')
  const warnings = checks.filter((c) => c.status === 'warning')

  if (failedChecks.length > 0) {
    recommendations.push(
      `Address ${failedChecks.length} failed security check(s): ${failedChecks.map((c) => c.name).join(', ')}`
    )
  }
  if (warnings.length > 0) {
    recommendations.push(
      `Review ${warnings.length} warning(s): ${warnings.map((c) => c.name).join(', ')}`
    )
  }
  if (score < 80) {
    recommendations.push('Security score is below 80%. Consider a comprehensive security review.')
  }

  const result: SecurityAuditResult = {
    timestamp: new Date(),
    tenantId,
    checks,
    score,
    recommendations,
  }

  // Log the audit
  await logAudit({
    tenantId,
    userId: 'system',
    action: 'security_audit',
    entityType: 'security',
    entityId: tenantId,
    details: {
      score,
      checksCount: checks.length,
      passCount: checks.filter((c) => c.status === 'pass').length,
    },
  })

  return result
}

/**
 * Run access control and permissions audit
 */
export async function runAccessControlAudit(tenantId: string): Promise<{
  users: Array<{
    id: string
    email: string
    role: string
    permissions: string[]
  }>
  issues: Array<{
    type: 'missing_role' | 'excessive_permissions' | 'no_mfa'
    userId: string
    message: string
  }>
}> {
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
    },
  })

  const userAudit = users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user.role),
  }))

  const issues: Array<{
    type: 'missing_role' | 'excessive_permissions' | 'no_mfa'
    userId: string
    message: string
  }> = []

  users.forEach((user) => {
    if (!user.role || user.role === '') {
      issues.push({
        type: 'missing_role',
        userId: user.id,
        message: `User ${user.email} has no role assigned`,
      })
    }
    if (user.role === 'admin' && !user.twoFactorEnabled) {
      issues.push({
        type: 'no_mfa',
        userId: user.id,
        message: `Admin user ${user.email} does not have 2FA enabled`,
      })
    }
  })

  return {
    users: userAudit,
    issues,
  }
}

function getUserPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    owner: ['*'], // All permissions
    admin: [
      'read:contacts',
      'write:contacts',
      'read:deals',
      'write:deals',
      'read:reports',
      'write:settings',
      'manage:users',
    ],
    member: ['read:contacts', 'read:deals', 'write:contacts', 'write:deals'],
    viewer: ['read:contacts', 'read:deals', 'read:reports'],
  }
  return permissions[role] || []
}
