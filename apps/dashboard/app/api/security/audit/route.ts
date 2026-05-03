import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { runSecurityAudit, runAccessControlAudit } from '@/lib/security/security-audit'

/**
 * POST /api/security/audit
 * Run security audit
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const auditResult = await runSecurityAudit(tenantId)

    return NextResponse.json({
      success: true,
      data: auditResult,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error running security audit:', error)
    return NextResponse.json(
      { error: 'Failed to run security audit' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/security/audit/access-control
 * Run access control audit
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    if (searchParams.get('type') === 'access-control') {
      const auditResult = await runAccessControlAudit(tenantId)
      return NextResponse.json({
        success: true,
        data: auditResult,
      })
    }

    return NextResponse.json(
      { error: 'Invalid audit type' },
      { status: 400 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error running access control audit:', error)
    return NextResponse.json(
      { error: 'Failed to run access control audit' },
      { status: 500 }
    )
  }
}
