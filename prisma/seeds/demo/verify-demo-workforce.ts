/**
 * Verify Demo Business workforce linkage and access posture.
 *
 * Prints:
 * - employee count
 * - linked-user coverage
 * - missing RBAC assignments
 * - module access matrix for demo tenant
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDemoWorkforce() {
  const showFullMatrix = process.argv.includes('--full')
  const strictMode = process.argv.includes('--strict')
  console.log('🔎 Verifying Demo Business workforce...')

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
    select: { id: true, name: true, licensedModules: true },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found (subdomain: demo)')
    process.exit(1)
  }

  console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`📦 Licensed modules: ${(tenant.licensedModules || []).join(', ') || 'none'}`)
  console.log('')

  const employees = await prisma.employee.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      officialEmail: true,
      userId: true,
      status: true,
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  const totalEmployees = employees.length
  const linkedEmployees = employees.filter((e) => !!e.userId)
  const unlinkedEmployees = employees.filter((e) => !e.userId)
  const linkedPct = totalEmployees === 0 ? 0 : Math.round((linkedEmployees.length / totalEmployees) * 100)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1) Employee Count')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Total employees: ${totalEmployees}`)
  console.log(`Active/probation employees: ${employees.filter((e) => e.status === 'ACTIVE' || e.status === 'PROBATION').length}`)
  console.log('')

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('2) Linked-User Coverage')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Linked employees: ${linkedEmployees.length}/${totalEmployees} (${linkedPct}%)`)
  if (unlinkedEmployees.length > 0) {
    console.log('Unlinked employees:')
    for (const emp of unlinkedEmployees) {
      console.log(`- ${emp.firstName} ${emp.lastName} <${emp.officialEmail}>`)
    }
  } else {
    console.log('✅ All employees are linked to platform users.')
  }
  console.log('')

  const linkedUserIds = linkedEmployees
    .map((e) => e.userId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  const userRoles = linkedUserIds.length
    ? await prisma.userRole.findMany({
        where: { tenantId: tenant.id, userId: { in: linkedUserIds } },
        select: { userId: true, roleId: true, role: { select: { roleName: true } } },
      })
    : []

  const rbacByUser = new Map<string, string[]>()
  for (const ur of userRoles) {
    const current = rbacByUser.get(ur.userId) || []
    current.push(ur.role.roleName)
    rbacByUser.set(ur.userId, current)
  }

  const missingRbac = linkedEmployees.filter((e) => {
    if (!e.userId) return false
    return (rbacByUser.get(e.userId) || []).length === 0
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('3) Missing RBAC Assignments')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (missingRbac.length === 0) {
    console.log('✅ No linked employee is missing RBAC assignment.')
  } else {
    console.log(`❌ Missing RBAC for ${missingRbac.length} linked employees:`)
    for (const emp of missingRbac) {
      console.log(`- ${emp.firstName} ${emp.lastName} <${emp.officialEmail}>`)
    }
  }
  console.log('')

  const roles = await prisma.role.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, roleName: true },
    orderBy: { roleName: 'asc' },
  })
  const moduleAccess = roles.length
    ? await prisma.moduleAccess.findMany({
        where: { tenantId: tenant.id, roleId: { in: roles.map((r) => r.id) } },
        select: {
          roleId: true,
          moduleName: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canAdmin: true,
        },
      })
    : []

  const roleNameById = new Map(roles.map((r) => [r.id, r.roleName]))
  const matrix = new Map<string, Map<string, string>>()
  for (const role of roles) {
    matrix.set(role.roleName, new Map())
  }

  for (const access of moduleAccess) {
    const roleName = roleNameById.get(access.roleId)
    if (!roleName) continue
    const rights = [
      access.canView ? 'V' : '-',
      access.canCreate ? 'C' : '-',
      access.canEdit ? 'E' : '-',
      access.canDelete ? 'D' : '-',
      access.canAdmin ? 'A' : '-',
    ].join('')
    matrix.get(roleName)?.set(access.moduleName, rights)
  }

  const modules = showFullMatrix
    ? Array.from(new Set([...(tenant.licensedModules || []), ...moduleAccess.map((m) => m.moduleName)])).sort()
    : [...(tenant.licensedModules || [])].sort()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('4) Module Access Matrix (Demo Tenant)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (roles.length === 0) {
    console.log('No active roles found.')
  } else if (modules.length === 0) {
    console.log('No module access rows found.')
  } else {
    console.log('Legend: V=view C=create E=edit D=delete A=admin')
    console.log(`View: ${showFullMatrix ? 'full matrix (--full)' : 'demo licensed modules only (default)'}`)
    for (const role of roles) {
      console.log(`\n[${role.roleName}]`)
      for (const moduleName of modules) {
        const rights = matrix.get(role.roleName)?.get(moduleName) || '-----'
        console.log(`- ${moduleName}: ${rights}`)
      }
    }
  }
  console.log('')

  if (strictMode) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('5) Strict RBAC Guardrails')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const strictFailures: string[] = []
    const licensedModules = [...(tenant.licensedModules || [])]
    const ownerAdminRoles = ['Owner', 'Admin']

    for (const roleName of ownerAdminRoles) {
      const roleMatrix = matrix.get(roleName)
      if (!roleMatrix) {
        strictFailures.push(`${roleName} role not found`)
        continue
      }
      for (const moduleName of licensedModules) {
        const rights = roleMatrix.get(moduleName) || '-----'
        if (rights !== 'VCEDA') {
          strictFailures.push(`${roleName} missing VCEDA on ${moduleName} (found ${rights})`)
        }
      }
    }

    const salesRepMatrix = matrix.get('Sales Rep')
    if (!salesRepMatrix) {
      strictFailures.push('Sales Rep role not found')
    } else {
      for (const moduleName of ['crm', 'sales']) {
        const rights = salesRepMatrix.get(moduleName) || '-----'
        if (rights === '-----') {
          strictFailures.push(`Sales Rep missing access on ${moduleName}`)
        }
      }
    }

    if (strictFailures.length > 0) {
      console.log(`❌ Strict mode failed (${strictFailures.length} issue${strictFailures.length === 1 ? '' : 's'}):`)
      for (const failure of strictFailures) {
        console.log(`- ${failure}`)
      }
      console.log('')
      throw new Error('Strict RBAC guardrails failed')
    } else {
      console.log('✅ Strict RBAC guardrails passed.')
      console.log('')
    }
  }
}

if (require.main === module) {
  verifyDemoWorkforce()
    .then(() => {
      console.log('✅ Demo workforce verification complete.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Demo workforce verification failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

