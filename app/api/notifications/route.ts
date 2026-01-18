import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'

interface Notification {
  id: string
  type: string
  module: string
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: any
}

/**
 * GET /api/notifications
 * Get aggregated notifications from all licensed modules for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const module = searchParams.get('module') // Optional: filter by module

    // Get tenant with licensed modules
    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { licensedModules: true },
      })
    )

    const licensedModules = tenant?.licensedModules || []
    const notifications: Notification[] = []
    const now = new Date()
    
    // Calculate today's start and end
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Helper to add notification
    const addNotification = (
      id: string,
      type: string,
      moduleName: string,
      title: string,
      message: string,
      priority: 'LOW' | 'MEDIUM' | 'HIGH',
      createdAt: Date,
      actionUrl?: string,
      metadata?: any
    ) => {
      if (moduleName && !licensedModules.includes(moduleName)) return // Skip if module not licensed
      if (module && moduleName !== module) return // Skip if module filter doesn't match
      
      notifications.push({
        id,
        type,
        module: moduleName,
        title,
        message,
        priority,
        isRead: false, // Will be checked against read notifications
        createdAt: createdAt.toISOString(),
        actionUrl,
        metadata,
      })
    }

    // 1. CRM Module Notifications
    if (licensedModules.includes('crm') && (!module || module === 'crm')) {
      // Overdue tasks
      const overdueTasks = await prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            tenantId: user.tenantId,
            assignedToId: user.userId,
            dueDate: { lt: now },
            status: { in: ['pending', 'in_progress'] },
          },
          take: 10,
          orderBy: { dueDate: 'asc' },
        })
      )

      overdueTasks.forEach((task) => {
        addNotification(
          `task-${task.id}`,
          'TASK_OVERDUE',
          'crm',
          'Overdue Task',
          `Task "${task.title}" is overdue`,
          'HIGH',
          task.dueDate || now,
          `/crm/${user.tenantId}/Tasks?filter=overdue`
        )
      })

      // Tasks due today
      const tasksDueToday = await prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            tenantId: user.tenantId,
            assignedToId: user.userId,
            dueDate: { gte: todayStart, lte: todayEnd },
            status: { in: ['pending', 'in_progress'] },
          },
          take: 5,
        })
      )

      tasksDueToday.forEach((task) => {
        addNotification(
          `task-today-${task.id}`,
          'TASK_DUE_TODAY',
          'crm',
          'Task Due Today',
          `Task "${task.title}" is due today`,
          'MEDIUM',
          now,
          `/crm/${user.tenantId}/Tasks`
        )
      })

      // Deals closing this week
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const dealsClosing = await prismaWithRetry(() =>
        prisma.deal.findMany({
          where: {
            tenantId: user.tenantId,
            expectedCloseDate: { gte: now, lte: weekEnd },
            stage: { not: 'lost' },
          },
          take: 5,
          orderBy: { expectedCloseDate: 'asc' },
        })
      )

      dealsClosing.forEach((deal) => {
        addNotification(
          `deal-${deal.id}`,
          'DEAL_CLOSING',
          'crm',
          'Deal Closing Soon',
          `Deal "${deal.name}" is closing on ${deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'soon'}`,
          'MEDIUM',
          now,
          `/crm/${user.tenantId}/Deals`
        )
      })
    }

    // 2. Finance Module Notifications
    if (licensedModules.includes('finance') && (!module || module === 'finance')) {
      // Overdue invoices
      const overdueInvoices = await prismaWithRetry(() =>
        prisma.invoice.findMany({
          where: {
            tenantId: user.tenantId,
            dueDate: { lt: now },
            status: { in: ['sent', 'partial'] },
          },
          take: 10,
          orderBy: { dueDate: 'asc' },
        })
      )

      overdueInvoices.forEach((invoice) => {
        addNotification(
          `invoice-${invoice.id}`,
          'INVOICE_OVERDUE',
          'finance',
          'Overdue Invoice',
          `Invoice #${invoice.invoiceNumber} is overdue (₹${invoice.total.toLocaleString('en-IN')})`,
          'HIGH',
          invoice.dueDate || now,
          `/finance/${user.tenantId}/Invoices`
        )
      })

      // Expenses pending approval (expenses without approval or rejected)
      const allExpenses = await prismaWithRetry(() =>
        prisma.expense.findMany({
          where: {
            tenantId: user.tenantId,
            approvedAt: null,
            rejectedAt: null,
          },
          include: {
            approvals: {
              take: 1,
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
      )

      // Filter expenses that don't have any approvals yet
      const pendingExpenses = allExpenses.filter(expense => expense.approvals.length === 0)

      pendingExpenses.slice(0, 5).forEach((expense) => {
        addNotification(
          `expense-${expense.id}`,
          'EXPENSE_PENDING',
          'finance',
          'Expense Pending Approval',
          `Expense of ₹${Number(expense.amount).toLocaleString('en-IN')} is pending approval`,
          'MEDIUM',
          expense.createdAt,
          `/finance/${user.tenantId}/Expenses`
        )
      })
    }

    // 3. HR Module Notifications
    if (licensedModules.includes('hr') && (!module || module === 'hr')) {
      // Leave requests pending approval
      const pendingLeaves = await prismaWithRetry(() =>
        prisma.leaveRequest.findMany({
          where: {
            tenantId: user.tenantId,
            status: 'pending',
          },
          include: {
            employee: {
              select: { firstName: true, lastName: true },
            },
          },
          take: 10,
        })
      )

      pendingLeaves.forEach((leave) => {
        addNotification(
          `leave-${leave.id}`,
          'LEAVE_PENDING',
          'hr',
          'Leave Request Pending',
          `${leave.employee.firstName} ${leave.employee.lastName} has a pending leave request`,
          'MEDIUM',
          leave.createdAt,
          `/hr/${user.tenantId}/Leave/requests`
        )
      })

      // Attendance issues
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const missingAttendance = await prismaWithRetry(() =>
        prisma.employee.findMany({
          where: {
            tenantId: user.tenantId,
            status: 'active',
          },
          include: {
            attendanceRecords: {
              where: {
                date: today,
              },
            },
          },
        })
      )

      missingAttendance
        .filter((emp) => emp.attendanceRecords.length === 0)
        .slice(0, 5)
        .forEach((emp) => {
          addNotification(
            `attendance-${emp.id}`,
            'ATTENDANCE_MISSING',
            'hr',
            'Missing Attendance',
            `${emp.firstName} ${emp.lastName} has not marked attendance today`,
            'LOW',
            now,
            `/hr/${user.tenantId}/Attendance`
          )
        })
    }

    // 4. Projects Module Notifications
    if (licensedModules.includes('projects') && (!module || module === 'projects')) {
      // Tasks due soon
      const projectTasksDue = await prismaWithRetry(() =>
        prisma.projectTask.findMany({
          where: {
            project: {
              tenantId: user.tenantId,
            },
            assignedToId: user.userId,
            dueDate: { gte: now, lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
            status: { not: 'completed' },
          },
          include: {
            project: {
              select: { name: true },
            },
          },
          take: 10,
        })
      )

      projectTasksDue.forEach((task) => {
        addNotification(
          `project-task-${task.id}`,
          'PROJECT_TASK_DUE',
          'projects',
          'Project Task Due',
          `Task "${task.name}" in project "${task.project.name}" is due soon`,
          'MEDIUM',
          task.dueDate || now,
          `/projects/${user.tenantId}/Tasks`
        )
      })
    }

    // 5. Inventory Module Notifications
    if (licensedModules.includes('inventory') && (!module || module === 'inventory')) {
      // Low stock alerts
      const lowStockProducts = await prismaWithRetry(() =>
        prisma.product.findMany({
          where: {
            tenantId: user.tenantId,
            quantity: { lte: prisma.product.fields.reorderLevel },
          },
          take: 10,
        })
      )

      lowStockProducts.forEach((product) => {
        addNotification(
          `stock-${product.id}`,
          'STOCK_LOW',
          'inventory',
          'Low Stock Alert',
          `Product "${product.name}" is running low (${product.quantity} units remaining)`,
          product.quantity === 0 ? 'HIGH' : 'MEDIUM',
          now,
          `/inventory/${user.tenantId}/Products`
        )
      })
    }

    // 6. Appointments Module Notifications
    if (licensedModules.includes('appointments') && (!module || module === 'appointments')) {
      // Upcoming appointments today
      const todayAppointments = await prismaWithRetry(() =>
        prisma.appointment.findMany({
          where: {
            tenantId: user.tenantId,
            assignedToId: user.userId,
            appointmentDate: {
              gte: todayStart,
              lte: todayEnd,
            },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          take: 5,
        })
      )

      todayAppointments.forEach((apt) => {
        addNotification(
          `appointment-${apt.id}`,
          'APPOINTMENT_TODAY',
          'appointments',
          'Appointment Today',
          `You have an appointment with ${apt.contactName} at ${apt.startTime}`,
          'MEDIUM',
          now,
          `/dashboard/appointments/${apt.id}`
        )
      })
    }

    // Sort by priority and date
    notifications.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply limit
    const limitedNotifications = notifications.slice(0, limit)
    const unreadCount = limitedNotifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      notifications: limitedNotifications,
      unreadCount,
      total: notifications.length,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    
    // Handle pool exhaustion
    const errorMessage = error?.message || String(error)
    const isPoolExhausted = errorMessage.includes('MaxClientsInSessionMode') || 
                            errorMessage.includes('max clients reached')
    
    if (isPoolExhausted) {
      return NextResponse.json(
        { 
          notifications: [],
          unreadCount: 0,
          total: 0,
          error: 'Database temporarily unavailable',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get notifications', message: error?.message },
      { status: 500 }
    )
  }
}

