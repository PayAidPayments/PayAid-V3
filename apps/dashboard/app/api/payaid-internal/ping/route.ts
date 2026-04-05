import { NextResponse } from 'next/server'

/** Dev probe: Turbopack sometimes fails to bind handlers under /api/auth/*. */
export async function GET() {
  return NextResponse.json({ ok: true, segment: 'payaid-internal' })
}
