/**
 * Proxy to Nextcloud Files (PayAid Drive) with tenant isolation.
 * Query: tenantId, token (JWT). Env: DRIVE_SERVER_URL or OFFICE_SERVER_URL/files
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyProductivityProxyToken } from '@/lib/productivity/verify-proxy-token'

export async function GET(request: NextRequest) {
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

  const driveBase =
    process.env.DRIVE_SERVER_URL ||
    (process.env.OFFICE_SERVER_URL
      ? `${process.env.OFFICE_SERVER_URL.replace(/\/$/, '')}/files`
      : null)

  if (!driveBase) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>PayAid Drive</title></head><body style="font-family:system-ui;padding:2rem;text-align:center;"><p>Drive is not configured. Set DRIVE_SERVER_URL or OFFICE_SERVER_URL.</p></body></html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  const url = new URL(driveBase)
  url.searchParams.set('token', token)
  url.searchParams.set('tenantId', tenantId)

  return NextResponse.redirect(url.toString(), 302)
}
