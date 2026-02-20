import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/whatsapp/leave/apply
 * Apply for leave via WhatsApp message parsing
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, message } = body

    if (!employeeId || !message) {
      return NextResponse.json(
        { error: 'Employee ID and message are required' },
        { status: 400 }
      )
    }

    // Parse leave details from message
    // Example: "Apply leave from 2026-02-25 to 2026-02-26, CL, Personal work"
    const datePattern = /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g
    const dates = message.match(datePattern) || []
    
    // Extract leave type (CL, SL, PL, etc.)
    const leaveTypeMatch = message.match(/\b(CL|SL|PL|EL|ML|HL)\b/i)
    const leaveTypeCode = leaveTypeMatch ? leaveTypeMatch[1].toUpperCase() : 'CL'

    // Extract reason (everything after leave type or dates)
    const reasonMatch = message.match(/(?:,|reason|for|because)\s*(.+)/i)
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Applied via WhatsApp'

    // Get leave type
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        tenantId,
        code: leaveTypeCode,
      },
    })

    if (!leaveType) {
      return NextResponse.json({
        error: `Leave type ${leaveTypeCode} not found. Available types: CL, SL, PL`,
      }, { status: 400 })
    }

    // Parse dates
    let startDate: Date
    let endDate: Date

    if (dates.length >= 2) {
      startDate = new Date(dates[0])
      endDate = new Date(dates[1])
    } else if (dates.length === 1) {
      startDate = new Date(dates[0])
      endDate = new Date(dates[0])
    } else {
      // Try to parse relative dates (tomorrow, next week, etc.)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      startDate = tomorrow
      endDate = tomorrow
    }

    // Verify employee
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId: leaveType.id,
        tenantId,
      },
    })

    if (!balance || balance.balance < 1) {
      return NextResponse.json({
        error: `Insufficient ${leaveType.name} balance. Current balance: ${balance?.balance || 0} days`,
      }, { status: 400 })
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
        appliedVia: 'WHATSAPP',
        createdBy: userId || employeeId,
      },
      include: {
        leaveType: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `✅ Leave request submitted successfully!\n\n` +
        `📅 Dates: ${startDate.toLocaleDateString('en-IN')} to ${endDate.toLocaleDateString('en-IN')}\n` +
        `📋 Type: ${leaveType.name}\n` +
        `📝 Reason: ${reason}\n` +
        `⏳ Status: Pending Approval\n\n` +
        `You'll receive updates via WhatsApp.`,
      leaveRequest,
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
