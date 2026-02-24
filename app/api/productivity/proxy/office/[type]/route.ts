/**
 * Proxy to Nextcloud/ONLYOFFICE Document Server for PayAid Sheets (s), Docs (d), Slides (p).
 * White-labeled: third-party names hidden; use PayAid branding on front.
 *
 * Query: tenantId, token (JWT). Optional: fileId for existing document.
 * Env: OFFICE_SERVER_URL (e.g. https://office.yourdomain.com)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyProductivityProxyToken } from '@/lib/productivity/verify-proxy-token'

const OFFICE_TYPES = ['s', 'd', 'p'] as const
type OfficeType = (typeof OFFICE_TYPES)[number]

function isOfficeType(s: string): s is OfficeType {
  return OFFICE_TYPES.includes(s as OfficeType)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  if (!isOfficeType(type)) {
    return NextResponse.json({ error: 'Invalid office type' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const token = searchParams.get('token')

  if (!tenantId || !token) {
    return NextResponse.json(
      { error: 'Missing tenantId or token' },
      { status: 401 }
    )
  }

  try {
    verifyProductivityProxyToken(request, tenantId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  const officeBase = process.env.OFFICE_SERVER_URL
  if (!officeBase) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>PayAid</title></head><body style="font-family:system-ui;padding:2rem;text-align:center;"><p>Document server is not configured. Set OFFICE_SERVER_URL to your Nextcloud/ONLYOFFICE instance.</p><p>You can still use <strong>PayAid PDF</strong> for PDFs.</p></body></html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Map type to path: s = spreadsheet, d = document, p = presentation
  const pathMap: Record<OfficeType, string> = {
    s: 's',
    d: 'd',
    p: 'p',
  }
  const fileId = searchParams.get('fileId') ?? 'new'
  const upstreamPath = `${officeBase}/${pathMap[type]}/${fileId}`
  const url = new URL(upstreamPath)
  url.searchParams.set('token', token)
  url.searchParams.set('tenantId', tenantId)

  // Redirect to document server (or proxy response if same-origin required)
  return NextResponse.redirect(url.toString(), 302)
}
