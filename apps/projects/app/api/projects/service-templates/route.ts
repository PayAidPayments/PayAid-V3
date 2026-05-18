import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { listServiceTemplatesPublic } from '@/lib/api/projects/service-templates'

/** GET `/api/projects/service-templates` — read-only §6 presets for **Create project** + API clients. */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'projects')

    const templates = listServiceTemplatesPublic()
    return NextResponse.json({ templates }, { status: 200 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List service templates error:', error)
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 })
  }
}
