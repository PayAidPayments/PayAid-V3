import { NextRequest, NextResponse } from 'next/server'
import { generateReportData } from '@/lib/hr/report-generator'

function decodeShareToken(token: string): { reportId: string; tenantId: string; exp: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    if (typeof payload.reportId !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now() / 1000) return null
    return { reportId: payload.reportId, tenantId: payload.tenantId || '', exp: payload.exp }
  } catch {
    return null
  }
}

/** GET /api/hr/reports/view?token=xxx - Shareable report link (no auth) */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const decoded = decodeShareToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
  const result = await generateReportData(decoded.reportId, decoded.tenantId)
  if (!result) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  return NextResponse.json({ reportName: result.reportName, data: result.data, summary: result.summary })
}
