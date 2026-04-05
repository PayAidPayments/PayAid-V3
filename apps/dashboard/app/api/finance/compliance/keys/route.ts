import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getTenantComplianceKeys, setTenantComplianceKeys } from '@/lib/finance/compliance/tenant-compliance-keys'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const keys = await getTenantComplianceKeys(tenantId)
    return NextResponse.json({
      configured: {
        gspApiKey: Boolean(keys.gspApiKey),
        gspApiSecret: Boolean(keys.gspApiSecret),
        irpUsername: Boolean(keys.irpUsername),
        irpPassword: Boolean(keys.irpPassword),
      },
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    await setTenantComplianceKeys(tenantId, {
      gspApiKey: body.gspApiKey,
      gspApiSecret: body.gspApiSecret,
      irpUsername: body.irpUsername,
      irpPassword: body.irpPassword,
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
