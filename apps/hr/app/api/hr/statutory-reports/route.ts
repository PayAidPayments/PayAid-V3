import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #28: Statutory report generator - list. */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({
      reports: [
        { id: 'FORM_16', name: 'Form 16', description: 'Income tax certificate' },
        { id: 'FORM_12BA', name: 'Form 12BA', description: 'Statement of deductions' },
        { id: 'TDS_24Q', name: 'TDS 24Q', description: 'Quarterly TDS statement' },
        { id: 'PF_ECR', name: 'PF ECR', description: 'EPFO ECR file', downloadUrl: '/api/hr/payroll/reports/ecr' },
        { id: 'PT', name: 'Professional Tax', description: 'State PT return' },
        { id: 'GRATUITY', name: 'Gratuity Statement', description: 'Per employee' },
      ],
      note: 'Form 16/12BA/24Q: add template engine and populate from payroll/tax data; ECR already available.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
