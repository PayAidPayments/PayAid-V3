import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { filterSmartNotifications, groupNotificationsByImportance, type Notification as SmartNotification } from '@/lib/notifications/smart-filter'

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
    const moduleFilter = searchParams.get('module') // Optional: filter by module
    const smartFilter = searchParams.get('smartFilter') === 'true' // Enable smart filtering

    // Get tenant with licensed modules - use minimal retries and handle circuit breaker
    let tenant
    try {
      tenant = await prismaWithRetry(() =>
        prisma.tenant.findUnique({
          where: { id: user.tenantId },
          select: { licensedModules: true },
        }),
        {
          maxRetries: 1, // Only 1 retry
          retryDelay: 200, // Minimal delay
          exponentialBackoff: false,
        }
      )
    } catch (error: any) {
      // If circuit breaker is open or pool exhausted, return empty notifications
      if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker || 
          error?.message?.includes('connection pool') || error?.message?.includes('temporarily unavailable')) {
        return NextResponse.json(
          { 
            notifications: [], 
            unreadCount: 0, 
            total: 0,
            grouped: { high: 0, medium: 0, low: 0 },
          },
          { status: 503 }
        )
      }
      throw error
    }

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
      if (moduleFilter && moduleName !== moduleFilter) return // Skip if module filter doesn't match
      
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
    if (licensedModules.includes('crm') && (!moduleFilter || moduleFilter === 'crm')) {
      // Overdue tasks - use minimal retries
      let overdueTasks = []
      try {
        overdueTasks = await prismaWithRetry(() =>
          prisma.task.findMany({
            where: {
              tenantId: user.tenantId,
              assignedToId: user.userId,
              dueDate: { lt: now },
              status: { in: ['pending', 'in_progress'] },
            },
            take: 10,
            orderBy: { dueDate: 'asc' },
          }),
          {
            maxRetries: 1,
            retryDelay: 200,
            exponentialBackoff: false,
          }
        )
      } catch (error: any) {
        // Skip if circuit breaker is open - continue with other notifications
        if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker) {
          console.warn('[NOTIFICATIONS] Circuit breaker open, skipping CRM overdue tasks')
        } else {
          throw error
        }
      }

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

      // Tasks due today - use minimal retries
      let tasksDueToday = []
      try {
        tasksDueToday = await prismaWithRetry(() =>
          prisma.task.findMany({
            where: {
              tenantId: user.tenantId,
              assignedToId: user.userId,
              dueDate: { gte: todayStart, lte: todayEnd },
              status: { in: ['pending', 'in_progress'] },
            },
            take: 5,
          }),
          {
            maxRetries: 1,
            retryDelay: 200,
            exponentialBackoff: false,
          }
        )
      } catch (error: any) {
        if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker) {
          console.warn('[NOTIFICATIONS] Circuit breaker open, skipping CRM tasks due today')
        } else {
          throw error
        }
      }

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

      // Deals closing this week - use minimal retries
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      let dealsClosing = []
      try {
        dealsClosing = await prismaWithRetry(() =>
          prisma.deal.findMany({
            where: {
              tenantId: user.tenantId,
              expectedCloseDate: { gte: now, lte: weekEnd },
              stage: { not: 'lost' },
            },
            take: 5,
            orderBy: { expectedCloseDate: 'asc' },
          }),
          {
            maxRetries: 1,
            retryDelay: 200,
            exponentialBackoff: false,
          }
        )
      } catch (error: any) {
        if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker) {
          console.warn('[NOTIFICATIONS] Circuit breaker open, skipping CRM deals closing')
        } else {
          throw error
        }
      }

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
    if (licensedModules.includes('finance') && (!moduleFilter || moduleFilter === 'finance')) {
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
    if (licensedModules.includes('hr') && (!moduleFilter || moduleFilter === 'hr')) {
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
    if (licensedModules.includes('projects') && (!moduleFilter || moduleFilter === 'projects')) {
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
    if (licensedModules.includes('inventory') && (!moduleFilter || moduleFilter === 'inventory')) {
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
    if (licensedModules.includes('appointments') && (!moduleFilter || moduleFilter === 'appointments')) {
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

    // Convert to smart filter format
    const smartNotifications: SmartNotification[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      module: n.module || 'general',
      timestamp: new Date(n.createdAt),
      read: n.isRead,
      actionUrl: n.actionUrl,
    }))

    // Apply smart filtering if enabled
    let finalNotifications = smartNotifications
    if (smartFilter) {
      finalNotifications = filterSmartNotifications(smartNotifications, {
        minScore: 30, // Only show notifications with importance score >= 30
        maxCount: limit,
      })
    } else {
      // Sort by priority and date (original behavior)
      finalNotifications.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
      finalNotifications = finalNotifications.slice(0, limit)
    }

    // Convert back to response format
    const responseNotifications = finalNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      module: n.module,
      title: n.title,
      message: n.message,
      priority: n.priority,
      isRead: n.read || false,
      createdAt: n.timestamp.toISOString(),
      actionUrl: n.actionUrl,
    }))

    const unreadCount = responseNotifications.filter((n) => !n.isRead).length

    // Get grouped notifications for summary
    const grouped = groupNotificationsByImportance(smartNotifications)

    return NextResponse.json({
      notifications: responseNotifications,
      unreadCount,
      total: notifications.length,
      smartFilter: smartFilter,
      summary: smartFilter ? {
        critical: grouped.critical.length,
        important: grouped.important.length,
        normal: grouped.normal.length,
      } : undefined,
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

