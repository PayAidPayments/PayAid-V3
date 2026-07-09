import { handleHrSelfServiceQuery } from '@/lib/ai/hr-self-service'
import { prisma } from '@/lib/db/prisma'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    employee: { findFirst: jest.fn() },
    leaveType: { findMany: jest.fn() },
    leaveBalance: { findMany: jest.fn() },
    leavePolicy: { findMany: jest.fn() },
    leaveRequest: { count: jest.fn(), findMany: jest.fn() },
    payrollRun: { findMany: jest.fn() },
    attendanceRecord: { findMany: jest.fn() },
  },
}))

jest.mock('@/lib/hr/ess-resolver', () => ({
  getEmployeeForUser: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  employee: { findFirst: jest.Mock }
  leaveType: { findMany: jest.Mock }
  leaveBalance: { findMany: jest.Mock }
  leavePolicy: { findMany: jest.Mock }
  leaveRequest: { count: jest.Mock; findMany: jest.Mock }
  payrollRun: { findMany: jest.Mock }
  attendanceRecord: { findMany: jest.Mock }
}

const mockedGetEmployeeForUser = getEmployeeForUser as jest.MockedFunction<typeof getEmployeeForUser>

const baseInput = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  roles: ['employee'],
  permissions: ['hr:read'],
  licensedModules: ['hr'],
}

describe('handleHrSelfServiceQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns leave balance for linked employee with records', async () => {
    mockedGetEmployeeForUser.mockResolvedValue({
      id: 'emp-1',
      employeeCode: 'EMP001',
      firstName: 'Asha',
      lastName: 'N',
      officialEmail: null,
      departmentId: null,
      designationId: null,
      managerId: null,
      department: null,
      designation: null,
    } as never)
    mockedPrisma.leaveType.findMany.mockResolvedValue([{ id: 'lt-1', name: 'Annual Leave', code: 'AL' }])
    mockedPrisma.leaveBalance.findMany.mockResolvedValue([
      {
        leaveTypeId: 'lt-1',
        balance: 8.5,
        asOfDate: new Date('2026-07-08T05:02:00.000Z'),
      },
    ])
    mockedPrisma.leavePolicy.findMany.mockResolvedValue([{ leaveTypeId: 'lt-1' }])
    mockedPrisma.leaveRequest.count.mockResolvedValue(1)

    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      message: 'What is my leave balance?',
    })

    expect(result.handled).toBe(true)
    expect(result.toolName).toBe('getMyLeaveBalances')
    expect(result.message).toContain('Annual Leave: 8.5 days')
    expect(result.message).toContain('1 pending leave request')
  })

  it('returns precise fallback when employee profile is not linked', async () => {
    mockedGetEmployeeForUser.mockResolvedValue(null)

    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      message: 'How many leaves do I have left?',
    })

    expect(result.handled).toBe(true)
    expect(result.reasonCode).toBe('EMPLOYEE_PROFILE_NOT_LINKED')
    expect(result.message).toContain('not linked to an employee profile')
  })

  it('returns precise fallback when leave policy is not configured', async () => {
    mockedGetEmployeeForUser.mockResolvedValue({
      id: 'emp-1',
      employeeCode: 'EMP001',
      firstName: 'Asha',
      lastName: 'N',
      officialEmail: null,
      departmentId: null,
      designationId: null,
      managerId: null,
      department: null,
      designation: null,
    } as never)
    mockedPrisma.leaveType.findMany.mockResolvedValue([{ id: 'lt-1', name: 'Annual Leave', code: 'AL' }])
    mockedPrisma.leaveBalance.findMany.mockResolvedValue([])
    mockedPrisma.leavePolicy.findMany.mockResolvedValue([])
    mockedPrisma.leaveRequest.count.mockResolvedValue(0)

    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      message: 'What is my leave balance?',
    })

    expect(result.handled).toBe(true)
    expect(result.reasonCode).toBe('LEAVE_POLICY_NOT_CONFIGURED')
    expect(result.message).toContain('Leave policy is not configured')
  })

  it('allows manager to fetch their own leave balance', async () => {
    mockedGetEmployeeForUser.mockResolvedValue({
      id: 'emp-manager',
      employeeCode: 'EMP900',
      firstName: 'Maya',
      lastName: 'Manager',
      officialEmail: null,
      departmentId: null,
      designationId: null,
      managerId: null,
      department: null,
      designation: null,
    } as never)
    mockedPrisma.leaveType.findMany.mockResolvedValue([{ id: 'lt-1', name: 'Sick Leave', code: 'SL' }])
    mockedPrisma.leaveBalance.findMany.mockResolvedValue([
      {
        leaveTypeId: 'lt-1',
        balance: 4,
        asOfDate: new Date('2026-07-08T04:32:00.000Z'),
      },
    ])
    mockedPrisma.leavePolicy.findMany.mockResolvedValue([{ leaveTypeId: 'lt-1' }])
    mockedPrisma.leaveRequest.count.mockResolvedValue(0)

    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      roles: ['manager'],
      message: 'What is my leave balance?',
    })

    expect(result.handled).toBe(true)
    expect(result.reasonCode).toBeUndefined()
    expect(result.message).toContain('Sick Leave: 4 days')
  })

  it("allows manager to fetch another employee's leave balance", async () => {
    mockedPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-2',
      employeeCode: 'EMP002',
      firstName: 'Ravi',
      lastName: 'K',
    })
    mockedPrisma.leaveType.findMany.mockResolvedValue([{ id: 'lt-1', name: 'Casual Leave', code: 'CL' }])
    mockedPrisma.leaveBalance.findMany.mockResolvedValue([
      {
        leaveTypeId: 'lt-1',
        balance: 2,
        asOfDate: new Date('2026-07-08T05:30:00.000Z'),
      },
    ])
    mockedPrisma.leavePolicy.findMany.mockResolvedValue([{ leaveTypeId: 'lt-1' }])
    mockedPrisma.leaveRequest.count.mockResolvedValue(0)

    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      roles: ['manager'],
      message: 'What is leave balance for employee EMP002?',
    })

    expect(result.handled).toBe(true)
    expect(result.reasonCode).toBeUndefined()
    expect(result.message).toContain('Casual Leave: 2 days')
  })

  it("denies unauthorized user asking for another employee's leave balance", async () => {
    const result = await handleHrSelfServiceQuery({
      ...baseInput,
      roles: ['employee'],
      permissions: ['hr:ess:read'],
      message: 'What is leave balance for employee EMP002?',
    })

    expect(result.handled).toBe(true)
    expect(result.reasonCode).toBe('ACCESS_DENIED')
    expect(result.message).toContain('only share your own HR self-service data')
  })
})
