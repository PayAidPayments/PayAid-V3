/**
 * WhatsApp HR Bot Handler (Phase 1.2)
 * Core logic for leave/payslip/attendance/reimbursement. Use from webhook or POST /api/hr/whatsapp/bot.
 */
import { prisma } from '@/lib/db/prisma'
import { getPayslipMessageForEmployee, parseMonthYearFromText } from '@/lib/hr/whatsapp-payslip-helper'

export interface BotResponse {
  response: string
  action?: {
    type: string
    employeeId: string
    requiresDetails?: boolean
    requiresMonth?: boolean
  }
  employeeId: string
  employeeName: string
}

export async function processHRBotMessage(
  tenantId: string,
  phoneNumber: string,
  message: string,
  employeeId?: string
): Promise<BotResponse | null> {
  // Find employee by phone number or employeeId
  let employee
  if (employeeId) {
    employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId,
      },
    })
  } else {
    // Try to find by phone number
    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    employee = await prisma.employee.findFirst({
      where: {
        tenantId,
        OR: [
          { mobileNumber: { contains: normalizedPhone } },
          { mobileNumber: { contains: phoneNumber } },
        ],
      },
    })
  }

  if (!employee) {
    return {
      response: "I couldn't find your employee record. Please contact HR.",
      employeeId: '',
      employeeName: '',
      action: {
        type: 'REQUIRES_HUMAN',
        employeeId: '',
      },
    }
  }

  const messageLower = message.toLowerCase().trim()

  // Parse intent using simple keyword matching (can be enhanced with NLP)
  let response = ''
  let action = null

  // Leave application intent
  if (
    messageLower.includes('leave') ||
    messageLower.includes('holiday') ||
    messageLower.includes('absent')
  ) {
    // Check if it's a query or application
    if (
      messageLower.includes('apply') ||
      messageLower.includes('want') ||
      messageLower.includes('need') ||
      messageLower.includes('take')
    ) {
      // Extract date from message (simple parsing)
      const dateMatch = message.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|tomorrow|today/i)
      
      response = `To apply for leave, please provide:\n` +
        `1. Start date (e.g., "2026-02-25" or "tomorrow")\n` +
        `2. End date (or "1 day" for single day)\n` +
        `3. Leave type (CL/SL/PL)\n` +
        `4. Reason\n\n` +
        `Example: "Apply leave from 2026-02-25 to 2026-02-26, CL, Personal work"`
      
      action = {
        type: 'LEAVE_APPLICATION',
        employeeId: employee.id,
        requiresDetails: true,
      }
    } else {
      // Leave balance query
      const balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId: employee.id,
          tenantId,
        },
        include: {
          leaveType: true,
        },
      })

      if (balances.length === 0) {
        response = 'Your leave balances are not available. Please contact HR.'
      } else {
        response = '📅 *Your Leave Balances:*\n\n'
        balances.forEach((bal) => {
          response += `• ${bal.leaveType.name}: ${bal.balance} days\n`
        })
      }
    }
  }
  // Payslip
  else if (
    messageLower.includes('payslip') ||
    messageLower.includes('salary slip') ||
    messageLower.includes('pay slip') ||
    messageLower.includes('send my payslip')
  ) {
    const parsed = parseMonthYearFromText(message)
    const { message: payslipMsg } = await getPayslipMessageForEmployee(tenantId, employee.id, {
      month: parsed.month,
      year: parsed.year,
      preferLastMonth: parsed.preferLastMonth,
    })
    response = payslipMsg
    if (!parsed.month && !parsed.preferLastMonth) {
      response += '\n\n💡 Reply "latest" or "last month" or "February 2026" for a specific month.'
    }
    action = { type: 'PAYSLIP_REQUEST', employeeId: employee.id }
  }
  // Attendance
  else if (
    messageLower.includes('attendance') ||
    messageLower.includes('present') ||
    messageLower.includes('absent') ||
    messageLower.includes('marked') ||
    messageLower.includes('am i present') ||
    messageLower.includes('check in')
  ) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const attendance = await prisma.attendanceRecord.findFirst({
      where: { employeeId: employee.id, date: today, tenantId },
    })
    if (attendance) {
      const checkIn = attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
      const checkOut = attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Not checked out'
      response = `✅ You are marked *${attendance.status}* today.\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`
    } else {
      response = 'No attendance record for today. Please check in through the app or contact HR.'
    }
  }
  // Reimbursement / expense status (Expense model)
  else if (
    messageLower.includes('reimbursement') ||
    messageLower.includes('expense') ||
    messageLower.includes('claim') ||
    messageLower.includes('status of my reimbursement')
  ) {
    const expenses = await prisma.expense.findMany({
      where: { employeeId: employee.id, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    if (expenses.length === 0) {
      response = 'You have no recent reimbursement/expense requests.'
    } else {
      response = '💰 *Recent Reimbursements:*\n\n'
      expenses.forEach((ex) => {
        const status = (ex.status || 'pending').toUpperCase()
        const statusEmoji = status === 'APPROVED' || ex.approvedAt ? '✅' : ex.rejectedAt ? '❌' : '⏳'
        response += `${statusEmoji} ₹${Number(ex.amount).toLocaleString('en-IN')} - ${status}\n`
        response += `   ${ex.description || 'Expense'} | ${new Date(ex.date).toLocaleDateString('en-IN')}\n\n`
      })
    }
  }
  // Help/Commands
  else if (
    messageLower.includes('help') ||
    messageLower.includes('commands') ||
    messageLower.includes('menu') ||
    messageLower === 'hi' ||
    messageLower === 'hello'
  ) {
    response = `👋 *HR Assistant - Available Commands:*\n\n` +
      `📅 *Leave:*\n` +
      `  • "Leave balance" - Check leave balances\n` +
      `  • "Apply leave" - Apply for leave\n\n` +
      `💰 *Payslip:*\n` +
      `  • "Payslip" or "Salary slip" - Get payslip\n\n` +
      `✅ *Attendance:*\n` +
      `  • "Attendance" or "Am I present?" - Check today's attendance\n\n` +
      `💵 *Reimbursement:*\n` +
      `  • "Reimbursement status" - Check reimbursement status\n\n` +
      `Type any command above to get started!`
  }
  // Default response
  else {
    response = `I didn't understand that. Type "help" to see available commands.\n\n` +
      `Or contact HR for assistance.`
  }

  return {
    response,
    action: action || undefined,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
  }
}
