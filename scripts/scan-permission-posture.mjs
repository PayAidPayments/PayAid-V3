import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const outDir = process.env.PERMISSION_POSTURE_EVIDENCE_DIR || 'docs/evidence/security/permission-posture'
const tenantFilter = process.env.PAYAID_TENANT_ID || null

function asPermissionList(value) {
  if (!Array.isArray(value)) return []
  return value.filter((x) => typeof x === 'string')
}

function isAdminLikePermission(code) {
  return code.includes(':admin') || code.startsWith('admin.') || code.endsWith(':manage')
}

async function scanTenant(tenant) {
  const now = new Date()
  const [roles, userRoles, userPermissions, moduleAccess] = await Promise.all([
    prisma.role.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: {
        id: true,
        roleName: true,
        permissions: true,
        _count: { select: { userRoles: true } },
        rolePermissions: { select: { permission: { select: { permissionCode: true } } } },
      },
    }),
    prisma.userRole.findMany({
      where: { tenantId: tenant.id, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { userId: true, roleId: true },
    }),
    prisma.userPermission.findMany({
      where: { tenantId: tenant.id, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { userId: true, permissionCode: true },
    }),
    prisma.moduleAccess.findMany({
      where: { tenantId: tenant.id },
      select: { roleId: true, canAdmin: true, canDelete: true, viewScope: true, editScope: true },
    }),
  ])

  const findings = []
  const rolesById = new Map(roles.map((r) => [r.id, r]))

  for (const role of roles) {
    const denorm = asPermissionList(role.permissions)
    const rel = role.rolePermissions.map((rp) => rp.permission.permissionCode)
    const merged = [...new Set([...denorm, ...rel])]
    const adminLike = merged.filter(isAdminLikePermission)
    if (merged.length >= 25 && role._count.userRoles > 0) {
      findings.push({
        code: 'ROLE_PERMISSION_BREADTH_HIGH',
        severity: 'high',
        detail: `${role.roleName} has ${merged.length} permissions (${role._count.userRoles} users assigned).`,
      })
    }
    if (adminLike.length >= 5 && role._count.userRoles > 0) {
      findings.push({
        code: 'ROLE_ADMIN_LIKE_PERMISSION_DENSITY',
        severity: 'high',
        detail: `${role.roleName} has ${adminLike.length} admin-like permissions.`,
      })
    }
  }

  const activeRolesPerUser = new Map()
  for (const ur of userRoles) {
    if (!activeRolesPerUser.has(ur.userId)) activeRolesPerUser.set(ur.userId, new Set())
    activeRolesPerUser.get(ur.userId).add(ur.roleId)
  }
  const multiRoleUsers = [...activeRolesPerUser.values()].filter((s) => s.size > 2).length
  if (multiRoleUsers > 0) {
    findings.push({
      code: 'USER_MULTI_ROLE_STACKING',
      severity: 'medium',
      detail: `${multiRoleUsers} users have more than 2 active roles.`,
    })
  }

  const directAdminGrants = userPermissions.filter((up) => isAdminLikePermission(up.permissionCode)).length
  if (directAdminGrants > 0) {
    findings.push({
      code: 'DIRECT_ADMIN_GRANTS_PRESENT',
      severity: 'high',
      detail: `${directAdminGrants} direct admin-like grants found in user permissions.`,
    })
  }

  const moduleAccessByRole = new Map()
  for (const ma of moduleAccess) {
    if (!moduleAccessByRole.has(ma.roleId)) moduleAccessByRole.set(ma.roleId, { adminLike: 0, globalScopes: 0 })
    const bucket = moduleAccessByRole.get(ma.roleId)
    if (ma.canAdmin || ma.canDelete) bucket.adminLike += 1
    if (ma.viewScope === 'all' || ma.editScope === 'all') bucket.globalScopes += 1
  }
  for (const [roleId, agg] of moduleAccessByRole.entries()) {
    const role = rolesById.get(roleId)
    if (!role || role._count.userRoles === 0) continue
    if (agg.adminLike >= 4 || agg.globalScopes >= 4) {
      findings.push({
        code: 'ROLE_MODULE_ACCESS_EXPANSIVE',
        severity: 'medium',
        detail: `${role.roleName} has expansive module grants (admin/delete=${agg.adminLike}, global=${agg.globalScopes}).`,
      })
    }
  }

  return {
    tenant_id: tenant.id,
    tenant_slug: tenant.slug,
    tenant_name: tenant.name,
    summary: {
      total_findings: findings.length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    },
    findings,
  }
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: tenantFilter
      ? {
          OR: [{ id: tenantFilter }, { slug: tenantFilter }, { subdomain: tenantFilter }, { domain: tenantFilter }],
        }
      : undefined,
    select: { id: true, slug: true, name: true },
  })

  const reports = []
  for (const tenant of tenants) {
    reports.push(await scanTenant(tenant))
  }

  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${stamp}-permission-posture.json`)
  fs.writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        generated_at_utc: now.toISOString(),
        tenant_filter: tenantFilter,
        tenant_count: reports.length,
        reports,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  const highFindings = reports.reduce((acc, r) => acc + r.summary.high, 0)
  process.stdout.write(`Permission posture report saved: ${outPath}\n`)
  process.stdout.write(`Scanned tenants: ${reports.length}; high findings: ${highFindings}\n`)
}

main()
  .catch((error) => {
    console.error('Permission posture scan failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

