/**
 * Seed realistic org users + RBAC for a tenant.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-org-rbac.ts <tenantId>
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const tenantId = process.argv[2] || 'cmjptk2mw0000aocw31u48n64'
const DEFAULT_PASSWORD = 'Demo@1234'

type EmployeeSeed = {
  fullName: string
  email: string
  roleName: string
  department: string
  designation: string
  managerEmail?: string
  modules: string[]
  salesRep?: { specialization: string; conversionRate: number }
  userRole?: 'owner' | 'admin' | 'manager' | 'member'
}

const EMPLOYEES: EmployeeSeed[] = [
  {
    fullName: 'Aarav Mehta',
    email: 'ceo@demobusiness.com',
    roleName: 'CEO',
    department: 'Leadership',
    designation: 'Chief Executive Officer',
    modules: ['crm', 'finance', 'marketing', 'hr', 'inventory', 'projects', 'analytics'],
    userRole: 'owner',
  },
  {
    fullName: 'Ira Khanna',
    email: 'director@demobusiness.com',
    roleName: 'Director',
    department: 'Leadership',
    designation: 'Director',
    managerEmail: 'ceo@demobusiness.com',
    modules: ['crm', 'finance', 'marketing', 'hr', 'analytics'],
    userRole: 'admin',
  },
  {
    fullName: 'Rohan Sethi',
    email: 'sales.head@demobusiness.com',
    roleName: 'Sales Head',
    department: 'Sales',
    designation: 'Head of Sales',
    managerEmail: 'director@demobusiness.com',
    modules: ['crm', 'finance', 'analytics'],
    salesRep: { specialization: 'Enterprise Sales', conversionRate: 0.34 },
    userRole: 'manager',
  },
  {
    fullName: 'Nisha Verma',
    email: 'sales.manager@demobusiness.com',
    roleName: 'Manager',
    department: 'Sales',
    designation: 'Sales Manager',
    managerEmail: 'sales.head@demobusiness.com',
    modules: ['crm', 'analytics'],
    salesRep: { specialization: 'SMB Sales', conversionRate: 0.29 },
    userRole: 'manager',
  },
  {
    fullName: 'Karan Rao',
    email: 'sales.rep1@demobusiness.com',
    roleName: 'Sales Rep',
    department: 'Sales',
    designation: 'Senior Sales Executive',
    managerEmail: 'sales.manager@demobusiness.com',
    modules: ['crm'],
    salesRep: { specialization: 'Retail', conversionRate: 0.22 },
  },
  {
    fullName: 'Pooja Iyer',
    email: 'sales.rep2@demobusiness.com',
    roleName: 'Executive',
    department: 'Sales',
    designation: 'Sales Executive',
    managerEmail: 'sales.manager@demobusiness.com',
    modules: ['crm'],
    salesRep: { specialization: 'B2B SaaS', conversionRate: 0.19 },
  },
  {
    fullName: 'Neeraj Bhat',
    email: 'accountant@demobusiness.com',
    roleName: 'Accountant',
    department: 'Finance',
    designation: 'Senior Accountant',
    managerEmail: 'director@demobusiness.com',
    modules: ['finance', 'analytics'],
  },
  {
    fullName: 'Gayatri Menon',
    email: 'finance.exec@demobusiness.com',
    roleName: 'Finance Executive',
    department: 'Finance',
    designation: 'Accounts Executive',
    managerEmail: 'accountant@demobusiness.com',
    modules: ['finance'],
  },
  {
    fullName: 'Siddharth Das',
    email: 'ops.head@demobusiness.com',
    roleName: 'Ops Head',
    department: 'Operations',
    designation: 'Head of Operations',
    managerEmail: 'director@demobusiness.com',
    modules: ['inventory', 'projects', 'analytics'],
    userRole: 'manager',
  },
  {
    fullName: 'Mitali Jain',
    email: 'ops.manager@demobusiness.com',
    roleName: 'Ops Manager',
    department: 'Operations',
    designation: 'Operations Manager',
    managerEmail: 'ops.head@demobusiness.com',
    modules: ['inventory', 'projects'],
    userRole: 'manager',
  },
  {
    fullName: 'Akhil Nair',
    email: 'marketing.manager@demobusiness.com',
    roleName: 'Marketing Manager',
    department: 'Marketing',
    designation: 'Marketing Manager',
    managerEmail: 'director@demobusiness.com',
    modules: ['marketing', 'crm', 'analytics'],
    userRole: 'manager',
  },
  {
    fullName: 'Shreya Pillai',
    email: 'hr.manager@demobusiness.com',
    roleName: 'HR',
    department: 'HR',
    designation: 'HR Manager',
    managerEmail: 'director@demobusiness.com',
    modules: ['hr', 'analytics'],
    userRole: 'manager',
  },
  {
    fullName: 'Vikrant Kulkarni',
    email: 'hr.exec@demobusiness.com',
    roleName: 'HR Executive',
    department: 'HR',
    designation: 'HR Executive',
    managerEmail: 'hr.manager@demobusiness.com',
    modules: ['hr'],
  },
  {
    fullName: 'Tanvi Arora',
    email: 'csm@demobusiness.com',
    roleName: 'Customer Success Manager',
    department: 'Customer Success',
    designation: 'CS Manager',
    managerEmail: 'director@demobusiness.com',
    modules: ['crm', 'projects'],
    userRole: 'manager',
  },
  {
    fullName: 'Harsh Vora',
    email: 'support.exec@demobusiness.com',
    roleName: 'Support Executive',
    department: 'Customer Success',
    designation: 'Support Executive',
    managerEmail: 'csm@demobusiness.com',
    modules: ['crm'],
  },
]

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  return { firstName: parts[0] || fullName, lastName: parts.slice(1).join(' ') || 'User' }
}

async function ensureRole(roleName: string, modules: string[]) {
  const permissions = modules.map((m) => `${m}:full`)
  return prisma.role.upsert({
    where: { tenantId_roleName: { tenantId, roleName } },
    update: { permissions, isActive: true, description: `${roleName} role` },
    create: {
      tenantId,
      roleName,
      description: `${roleName} role`,
      roleType: 'custom',
      permissions,
      isSystem: false,
      isActive: true,
    },
  })
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`)

  const owner = await prisma.user.findFirst({
    where: { tenantId, role: { in: ['owner', 'admin'] } },
    orderBy: { createdAt: 'asc' },
  })
  if (!owner) throw new Error('Need at least one owner/admin user in tenant to assign RBAC metadata')

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // Ensure departments and designations
  const departmentMap = new Map<string, string>()
  const designationMap = new Map<string, string>()
  for (const emp of EMPLOYEES) {
    if (!departmentMap.has(emp.department)) {
      const dep = await prisma.department.upsert({
        where: { tenantId_name: { tenantId, name: emp.department } },
        update: { isActive: true },
        create: { tenantId, name: emp.department, isActive: true },
      })
      departmentMap.set(emp.department, dep.id)
    }
    if (!designationMap.has(emp.designation)) {
      const des = await prisma.designation.upsert({
        where: { tenantId_name: { tenantId, name: emp.designation } },
        update: { isActive: true },
        create: { tenantId, name: emp.designation, isActive: true },
      })
      designationMap.set(emp.designation, des.id)
    }
  }

  // Ensure users + roles + userRoles + module access + permissions scaffolding
  const userByEmail = new Map<string, { id: string; email: string }>()
  let employeeCounterBase = await prisma.employee.count({ where: { tenantId } })
  for (const emp of EMPLOYEES) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.fullName,
        tenantId,
        role: emp.userRole || 'member',
      },
      create: {
        email: emp.email,
        name: emp.fullName,
        password: passwordHash,
        role: emp.userRole || 'member',
        tenantId,
      },
      select: { id: true, email: true },
    })
    userByEmail.set(emp.email, user)

    const role = await ensureRole(emp.roleName, emp.modules)
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId, userId: user.id, roleId: role.id } },
      update: { assignedById: owner.id, department: emp.department },
      create: {
        tenantId,
        userId: user.id,
        roleId: role.id,
        assignedById: owner.id,
        department: emp.department,
      },
    })

    for (const moduleName of emp.modules) {
      await prisma.moduleAccess.upsert({
        where: { tenantId_roleId_moduleName: { tenantId, roleId: role.id, moduleName } },
        update: { canView: true, canCreate: true, canEdit: true, canDelete: moduleName !== 'finance', canAdmin: emp.userRole === 'owner' || emp.userRole === 'admin' },
        create: {
          tenantId,
          roleId: role.id,
          moduleName,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: moduleName !== 'finance',
          canAdmin: emp.userRole === 'owner' || emp.userRole === 'admin',
          viewScope: emp.userRole === 'owner' || emp.userRole === 'admin' ? 'all' : 'team',
          editScope: emp.userRole === 'owner' || emp.userRole === 'admin' ? 'all' : 'team',
        },
      })

      const permissionCode = `${moduleName}:full`
      const permission = await prisma.permission.upsert({
        where: { tenantId_permissionCode: { tenantId, permissionCode } },
        update: { moduleName, action: 'admin' },
        create: {
          tenantId,
          permissionCode,
          description: `Full access to ${moduleName}`,
          moduleName,
          action: 'admin',
          isSystem: false,
        },
      })

      await prisma.rolePermission.upsert({
        where: { tenantId_roleId_permissionId: { tenantId, roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { tenantId, roleId: role.id, permissionId: permission.id },
      })
    }

    // Ensure employee profile
    const { firstName, lastName } = splitName(emp.fullName)
    const employeeCode = `EMP${String(++employeeCounterBase).padStart(4, '0')}`
    await prisma.employee.upsert({
      where: { tenantId_officialEmail: { tenantId, officialEmail: emp.email } },
      update: {
        firstName,
        lastName,
        userId: user.id,
        status: 'ACTIVE',
        departmentId: departmentMap.get(emp.department),
        designationId: designationMap.get(emp.designation),
      },
      create: {
        tenantId,
        employeeCode,
        firstName,
        lastName,
        officialEmail: emp.email,
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
        joiningDate: new Date('2025-04-01T00:00:00.000Z'),
        status: 'ACTIVE',
        userId: user.id,
        departmentId: departmentMap.get(emp.department),
        designationId: designationMap.get(emp.designation),
      },
    })

    // Ensure sales reps for allocation flows
    if (emp.salesRep) {
      await prisma.salesRep.upsert({
        where: { userId: user.id },
        update: {
          tenantId,
          specialization: emp.salesRep.specialization,
          conversionRate: emp.salesRep.conversionRate,
          isOnLeave: false,
        },
        create: {
          tenantId,
          userId: user.id,
          specialization: emp.salesRep.specialization,
          conversionRate: emp.salesRep.conversionRate,
          isOnLeave: false,
        },
      })
    }
  }

  // Second pass: wire employee manager hierarchy
  for (const emp of EMPLOYEES) {
    if (!emp.managerEmail) continue
    const user = userByEmail.get(emp.email)
    const managerUser = userByEmail.get(emp.managerEmail)
    if (!user || !managerUser) continue
    const managerEmployee = await prisma.employee.findFirst({
      where: { tenantId, userId: managerUser.id },
      select: { id: true },
    })
    if (!managerEmployee) continue
    await prisma.employee.updateMany({
      where: { tenantId, userId: user.id },
      data: { managerId: managerEmployee.id },
    })
  }

  const [usersCount, employeesCount, salesRepCount, rolesCount, userRolesCount] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.employee.count({ where: { tenantId } }),
    prisma.salesRep.count({ where: { tenantId } }),
    prisma.role.count({ where: { tenantId } }),
    prisma.userRole.count({ where: { tenantId } }),
  ])

  console.log('Demo org + RBAC seeded successfully')
  console.log(`Tenant: ${tenantId}`)
  console.log(`Users: ${usersCount}`)
  console.log(`Employees: ${employeesCount}`)
  console.log(`Sales reps: ${salesRepCount}`)
  console.log(`Roles: ${rolesCount}`)
  console.log(`User-role assignments: ${userRolesCount}`)
  console.log(`Default password for seeded users: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((err) => {
    console.error('Seeding org/RBAC failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

