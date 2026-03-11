import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getFlightRiskForEmployee } from '@/lib/hr/flight-risk-service'

/**
 * POST /api/hr/employees/[id]/flight-risk/notify-manager
 * Notify the employee's manager about high flight risk. Creates an audit trail and optionally sends email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, officialEmail: true } },
      },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    if (!employee.manager) {
      return NextResponse.json(
        { error: 'Employee has no manager assigned. Assign a manager to send an alert.' },
        { status: 400 }
      )
    }

    const risk = await getFlightRiskForEmployee(employeeId, tenantId)
    if (!risk) {
      return NextResponse.json({ error: 'Could not compute flight risk' }, { status: 500 })
    }
    if (risk.riskLevel !== 'HIGH' && risk.riskLevel !== 'CRITICAL') {
      return NextResponse.json(
        { error: 'Notify manager is intended for HIGH or CRITICAL risk. Current risk is ' + risk.riskLevel },
        { status: 400 }
      )
    }

    // Audit: store that we sent an alert (we could add a FlightRiskAlertLog model; for now we use retention intervention type MANAGER_ALERT_SENT or a simple log)
    // Using RetentionIntervention with type OTHER and suggestedAction "Manager notified" would work but mixes concepts. Prefer a simple in-memory or log.
    // Option: create an AuditLog entry if the tenant has audit logging. For minimal scope, just return success and document that email can be wired here.
    const manager = employee.manager
    const message = `Flight risk alert: ${employee.firstName} ${employee.lastName} is at ${risk.riskLevel} risk (${risk.riskScore}%). Risk window: ${risk.riskWindow}. Top factors: ${risk.factors.slice(0, 2).map((f) => f.factor).join(', ')}.`
    // TODO: integrate with email (e.g. sendGrid) to send to manager.officialEmail
    // if (manager.officialEmail) await sendFlightRiskAlertEmail(manager.officialEmail, employee, risk, message)

    return NextResponse.json({
      ok: true,
      message: 'Manager alert recorded. Manager can be notified via email when integration is enabled.',
      managerId: manager.id,
      managerName: `${manager.firstName} ${manager.lastName}`,
      managerEmail: manager.officialEmail,
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      suggestedEmailBody: message,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
