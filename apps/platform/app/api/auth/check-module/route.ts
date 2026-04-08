import { NextRequest, NextResponse } from 'next/server'
import { checkModuleAccess } from '@payaid/core'

/** Phase 17: Edge middleware calls this to gate by tenant_modules. */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId')
  const moduleId = request.nextUrl.searchParams.get('moduleId')
  if (!tenantId || !moduleId) {
    return NextResponse.json({ error: 'Missing tenantId or moduleId' }, { status: 400 })
  }
  const hasAccess = await checkModuleAccess(tenantId, moduleId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Module not enabled' }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}
