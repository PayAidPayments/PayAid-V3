import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'

type Severity = 'high' | 'medium' | 'low'

type Finding = {
  code: string
  severity: Severity
  title: string
  detail: string
  evidence_count?: number
}

function asPermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string')
}

function isAdminLikePermission(code: string): boolean {
  return code.includes(':admin') || code.startsWith('admin.') || code.endsWith(':manage')
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSuperAdmin()
    const tenantId = params.id
    const now = new Date()

    const [tenant, roles, userRoles, userPermissions, moduleAccess] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true },
      }),
      prisma.role.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          roleName: true,
          roleType: true,
          permissions: true,
          _count: { select: { userRoles: true } },
          rolePermissions: {
            select: { permission: { select: { permissionCode: true } } },
          },
        },
      }),
      prisma.userRole.findMany({
        where: {
          tenantId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { userId: true, roleId: true },
      }),
      prisma.userPermission.findMany({
        where: {
          tenantId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { userId: true, permissionCode: true, expiresAt: true },
      }),
      prisma.moduleAccess.findMany({
        where: { tenantId },
        select: {
          roleId: true,
          moduleName: true,
          canAdmin: true,
          canDelete: true,
          viewScope: true,
          editScope: true,
        },
      }),
    ])

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found', id: tenantId }, { status: 404 })
    }

    const findings: Finding[] = []
    const rolesById = new Map(roles.map((r) => [r.id, r]))

    // Role-level permission breadth checks.
    for (const role of roles) {
      const denorm = asPermissionList(role.permissions)
      const rel = role.rolePermissions.map((rp) => rp.permission.permissionCode)
      const merged = [...new Set([...denorm, ...rel])]
      const adminLike = merged.filter(isAdminLikePermission)

      if (merged.length >= 25 && role._count.userRoles > 0) {
        findings.push({
          code: 'ROLE_PERMISSION_BREADTH_HIGH',
          severity: 'high',
          title: `Role ${role.roleName} has broad permissions`,
          detail: `${role.roleName} has ${merged.length} effective permissions and ${role._count.userRoles} assigned users.`,
          evidence_count: merged.length,
        })
      }
      if (adminLike.length >= 5 && role._count.userRoles > 0) {
        findings.push({
          code: 'ROLE_ADMIN_LIKE_PERMISSION_DENSITY',
          severity: 'high',
          title: `Role ${role.roleName} has many admin-like grants`,
          detail: `${adminLike.length} admin-like permissions detected on active role ${role.roleName}.`,
          evidence_count: adminLike.length,
        })
      }
    }

    // User-level multi-role and direct admin checks.
    const activeRolesPerUser = new Map<string, Set<string>>()
    for (const ur of userRoles) {
      if (!activeRolesPerUser.has(ur.userId)) activeRolesPerUser.set(ur.userId, new Set())
      activeRolesPerUser.get(ur.userId)!.add(ur.roleId)
    }
    const multiRoleUsers = [...activeRolesPerUser.values()].filter((s) => s.size > 2).length
    if (multiRoleUsers > 0) {
      findings.push({
        code: 'USER_MULTI_ROLE_STACKING',
        severity: 'medium',
        title: 'Users with stacked active roles',
        detail: `${multiRoleUsers} users have more than 2 active roles, which can create privilege drift.`,
        evidence_count: multiRoleUsers,
      })
    }

    const directAdminGrants = userPermissions.filter((up) => isAdminLikePermission(up.permissionCode)).length
    if (directAdminGrants > 0) {
      findings.push({
        code: 'DIRECT_ADMIN_GRANTS_PRESENT',
        severity: 'high',
        title: 'Direct admin-like user permissions detected',
        detail: `${directAdminGrants} direct user permission grants are admin-like and bypass role governance.`,
        evidence_count: directAdminGrants,
      })
    }

    // Module access expansion checks.
    const moduleAccessByRole = new Map<string, { adminLike: number; globalScopes: number }>()
    for (const ma of moduleAccess) {
      if (!moduleAccessByRole.has(ma.roleId)) moduleAccessByRole.set(ma.roleId, { adminLike: 0, globalScopes: 0 })
      const bucket = moduleAccessByRole.get(ma.roleId)!
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
          title: `Role ${role.roleName} has expansive module access`,
          detail: `${role.roleName} has ${agg.adminLike} admin/delete module grants and ${agg.globalScopes} global scope grants.`,
          evidence_count: agg.adminLike + agg.globalScopes,
        })
      }
    }

    const severityWeight: Record<Severity, number> = { high: 3, medium: 2, low: 1 }
    const sorted = findings.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])

    return NextResponse.json({
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      summary: {
        total_findings: sorted.length,
        high: sorted.filter((f) => f.severity === 'high').length,
        medium: sorted.filter((f) => f.severity === 'medium').length,
        low: sorted.filter((f) => f.severity === 'low').length,
        posture: sorted.some((f) => f.severity === 'high')
          ? 'high_risk'
          : sorted.some((f) => f.severity === 'medium')
          ? 'moderate_risk'
          : 'healthy',
      },
      findings: sorted,
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN required' }, { status: 403 })
    console.error('Tenant permission posture error:', e)
    return NextResponse.json({ error: 'Failed to evaluate permission posture' }, { status: 500 })
  }
}

