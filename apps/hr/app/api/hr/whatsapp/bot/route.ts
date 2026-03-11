import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getPayslipMessageForEmployee, parseMonthYearFromText } from '@/lib/hr/whatsapp-payslip-helper'

/**
 * POST /api/hr/whatsapp/bot
 * Handle WhatsApp messages from employees for HR queries (Phase 1.2)
 * Supports: Leave apply/balance, payslip (latest/last month/specific month), attendance, reimbursement status
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

    let employee = null
    if (employeeId) {
      employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
      })
    }
    if (!employee) {
      const normalized = phoneNumber.replace(/\D/g, '')
      employee = await prisma.employee.findFirst({
        where: {
          tenantId,
          OR: [
            { mobileNumber: { contains: normalized } },
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

    const isPayslipIntent =
      messageLower.includes('payslip') || messageLower.includes('salary slip') || messageLower.includes('pay slip') ||
      messageLower.includes('send my payslip') || messageLower.includes('वेतन पर्ची') || messageLower.includes('சம்பள சீட்டு') || messageLower.includes('వేతన పత్రం')
    const isLeaveIntent =
      messageLower.includes('leave') || messageLower.includes('holiday') || messageLower.includes('absent') ||
      messageLower.includes('ছুটি') || messageLower.includes('ரஜா') || messageLower.includes('రజా')
    const isAttendanceIntent =
      messageLower.includes('attendance') || messageLower.includes('present') || messageLower.includes('absent') ||
      messageLower.includes('marked') || messageLower.includes('am i present') || messageLower.includes('check in') ||
      messageLower.includes('हाजिरी') || messageLower.includes('उपस्थिति') || messageLower.includes('வருகை')
    const isReimbursementIntent =
      messageLower.includes('reimbursement') || messageLower.includes('expense') || messageLower.includes('claim') ||
      messageLower.includes('status of my reimbursement') || messageLower.includes('खर्च') || messageLower.includes('செலவு')
    const isForm16Intent =
      messageLower.includes('form 16') || messageLower.includes('form16') || messageLower.includes('tax form') ||
      messageLower.includes('income tax') || messageLower.includes('फॉर्म 16') || messageLower.includes('படிவம் 16')

    let response = ''
    let action: Record<string, unknown> | null = null

    // ---------- Form 16 / tax document (Deferred) ----------
    if (isForm16Intent) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
      response = `📄 *Form 16 / Tax document*\n\n` +
        `Form 16 is available in the HR portal under Documents / Tax Declarations.\n` +
        (baseUrl ? `Portal: ${baseUrl}\n\n` : '') +
        `📄 Form 16 / कर दस्तावेज़: HR पोर्टल में Documents के तहत उपलब्ध है।`
      action = { type: 'FORM_16_REQUEST', employeeId: employee.id }
    }
    // ---------- Leave ----------
    else if (isLeaveIntent) {
      const datePattern = /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g
      const dates = message.match(datePattern) || []
      const leaveTypeMatch = message.match(/\b(CL|SL|PL|EL|ML|HL)\b/i)
      const leaveTypeCode = leaveTypeMatch ? leaveTypeMatch[1].toUpperCase() : null
      const hasDatesAndType = dates.length >= 1 && leaveTypeCode

      // If message has dates + leave type, try to create leave request (WhatsApp Leave Bot)
      if (
        (messageLower.includes('apply') || messageLower.includes('want') || messageLower.includes('need') || messageLower.includes('take')) &&
        hasDatesAndType
      ) {
        const leaveType = await prisma.leaveType.findFirst({
          where: { tenantId, code: leaveTypeCode },
        })
        if (!leaveType) {
          response = `Leave type ${leaveTypeCode} not found. Available: CL, SL, PL. Reply with type and dates.`
        } else {
          const startDate = dates.length >= 2 ? new Date(dates[0]) : new Date(dates[0])
          const endDate = dates.length >= 2 ? new Date(dates[1]) : new Date(dates[0])
          const reasonMatch = message.match(/(?:,|reason|for|because)\s*(.+)/i)
          const reason = reasonMatch ? reasonMatch[1].trim() : 'Applied via WhatsApp'

          const balance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              tenantId,
            },
          })
          if (!balance || Number(balance.balance) < 1) {
            response = `Insufficient ${leaveType.name} balance. Current: ${balance?.balance ?? 0} days. Contact HR.`
          } else {
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const leaveRequest = await prisma.leaveRequest.create({
              data: {
                tenantId,
                employeeId: employee.id,
                leaveTypeId: leaveType.id,
                startDate,
                endDate,
                days,
                reason,
                status: 'PENDING',
              },
              include: { leaveType: true },
            })
            response =
              `✅ *Leave applied successfully!*\n\n` +
              `📅 ${startDate.toLocaleDateString('en-IN')} to ${endDate.toLocaleDateString('en-IN')} (${Number(leaveRequest.days)} day(s))\n` +
              `📋 ${leaveType.name}\n` +
              `📝 ${reason}\n` +
              `⏳ Status: Pending approval. You'll get updates here.`
            action = { type: 'LEAVE_APPLICATION', employeeId: employee.id, leaveRequestId: leaveRequest.id }
          }
        }
      } else if (
        messageLower.includes('apply') ||
        messageLower.includes('want') ||
        messageLower.includes('need') ||
        messageLower.includes('take')
      ) {
        response =
          `To apply for leave, send:\n` +
          `• Dates (e.g. 2026-02-25 to 2026-02-26)\n` +
          `• Leave type: CL, SL, or PL\n` +
          `• Reason (optional)\n\n` +
          `Example: *Apply leave from 2026-02-25 to 2026-02-26, CL, Personal work*`
        action = { type: 'LEAVE_APPLICATION', employeeId: employee.id, requiresDetails: true }
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
    // ---------- Payslip (incl. Hindi/Tamil/Telugu) ----------
    else if (isPayslipIntent) {
      const parsed = parseMonthYearFromText(message)
      const { message: payslipMsg } = await getPayslipMessageForEmployee(tenantId, employee.id, {
        month: parsed.month,
        year: parsed.year,
        preferLastMonth: parsed.preferLastMonth,
      })
      response = payslipMsg
      if (!parsed.month && !parsed.preferLastMonth && (messageLower.includes('payslip') || messageLower.includes('salary'))) {
        response += '\n\n💡 Reply with "latest" or "last month" or "February 2026" for a specific month.'
      }
      action = { type: 'PAYSLIP_REQUEST', employeeId: employee.id }
    }
    // ---------- Attendance (incl. Hindi/Tamil) ----------
    else if (isAttendanceIntent) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const attendance = await prisma.attendanceRecord.findFirst({
        where: { employeeId: employee.id, date: today, tenantId },
      })
      if (attendance) {
        const checkIn = attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
        const checkOut = attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Not checked out'
        response = `✅ You are marked *${attendance.status}* today.\n` +
          `Check-in: ${checkIn}\nCheck-out: ${checkOut}`
      } else {
        response = `No attendance record for today. Please check in through the app or contact HR.`
      }
    }
    // ---------- Reimbursement (incl. Hindi/Tamil) ----------
    else if (isReimbursementIntent) {
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
    // ---------- Help / menu ----------
    else if (
      messageLower.includes('help') ||
      messageLower.includes('commands') ||
      messageLower.includes('menu') ||
      messageLower === 'hi' ||
      messageLower === 'hello' ||
      messageLower === 'hey'
    ) {
      response = `👋 *HR Assistant*\n\n` +
        `📅 *Leave:* "Leave balance" | "Apply leave from 25-02-2026 to 26-02-2026, CL, reason"\n` +
        `💰 *Payslip:* "Payslip" | "Send my payslip" | "Latest" | "Last month"\n` +
        `✅ *Attendance:* "Am I present?" | "Attendance"\n` +
        `💵 *Reimbursement:* "Reimbursement status" | "Status of my reimbursement"\n` +
        `📄 *Form 16:* "Form 16" | "Tax form"\n\n` +
        `Type any of the above to get started! (Hindi/Tamil/Telugu supported for key words.)`
    }
    else {
      response = `I didn't understand that. Type *help* to see commands, or contact HR.`
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
