import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/whatsapp/bot
 * Handle WhatsApp messages from employees for HR queries
 * Supports: Leave application, payslip requests, attendance queries, leave balance
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { phoneNumber, message, employeeId } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

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
      employee = await prisma.employee.findFirst({
        where: {
          tenantId,
          OR: [
            { mobileNumber: { contains: phoneNumber.replace(/\D/g, '') } },
            { mobileNumber: { contains: phoneNumber } },
          ],
        },
      })
    }

    if (!employee) {
      return NextResponse.json({
        response: "I couldn't find your employee record. Please contact HR.",
        requiresHuman: true,
      })
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
    // Payslip request
    else if (
      messageLower.includes('payslip') ||
      messageLower.includes('salary slip') ||
      messageLower.includes('pay slip')
    ) {
      // Extract month/year if mentioned
      const monthMatch = message.match(/(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})/i)
      
      response = `I'll help you get your payslip. Please specify the month (e.g., "February 2026" or "last month").\n\n` +
        `Or reply with "latest" for the most recent payslip.`
      
      action = {
        type: 'PAYSLIP_REQUEST',
        employeeId: employee.id,
        requiresMonth: true,
      }
    }
    // Attendance query
    else if (
      messageLower.includes('attendance') ||
      messageLower.includes('present') ||
      messageLower.includes('absent') ||
      messageLower.includes('marked')
    ) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const attendance = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: employee.id,
          date: today,
          tenantId,
        },
      })

      if (attendance) {
        response = `✅ You are marked *${attendance.status}* today.\n` +
          `Check-in: ${attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString('en-IN') : 'N/A'}\n` +
          `Check-out: ${attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString('en-IN') : 'Not checked out'}`
      } else {
        response = `I couldn't find your attendance record for today. Please contact HR or check in through the app.`
      }
    }
    // Reimbursement status
    else if (
      messageLower.includes('reimbursement') ||
      messageLower.includes('expense') ||
      messageLower.includes('claim')
    ) {
      const reimbursements = await prisma.reimbursement.findMany({
        where: {
          employeeId: employee.id,
          tenantId,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      if (reimbursements.length === 0) {
        response = 'You have no recent reimbursement requests.'
      } else {
        response = '💰 *Recent Reimbursements:*\n\n'
        reimbursements.forEach((reimb) => {
          const statusEmoji = reimb.status === 'APPROVED' ? '✅' : reimb.status === 'REJECTED' ? '❌' : '⏳'
          response += `${statusEmoji} ₹${reimb.amount} - ${reimb.status}\n`
          response += `   Date: ${new Date(reimb.expenseDate).toLocaleDateString('en-IN')}\n\n`
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

    return NextResponse.json({
      response,
      action,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
