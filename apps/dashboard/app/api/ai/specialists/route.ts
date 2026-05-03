import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { listSpecialistsForModule, SPECIALISTS } from '@/lib/ai/specialists/registry'

/** GET /api/ai/specialists?module=crm - List available specialists */
export async function GET(request: NextRequest) {
  try {
    const { licensedModules } = await requireModuleAccess(request, 'ai-studio')
    const moduleSlug = request.nextUrl.searchParams.get('module')

    const specialists = moduleSlug ? listSpecialistsForModule(moduleSlug) : SPECIALISTS

    const visibleSpecialists = specialists.filter((specialist) => {
      if (licensedModules.length === 0) return true
      return specialist.modules.some((m) => licensedModules.includes(m))
    })

    return NextResponse.json({
      specialists: visibleSpecialists,
      total: visibleSpecialists.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list specialists' },
      { status: 500 }
    )
  }
}

