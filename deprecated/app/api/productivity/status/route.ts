/**
 * GET /api/productivity/status
 * Returns whether drive/meet are configured (so client can show message instead of iframe when not set).
 * Does not expose URLs.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    drive: !!(process.env.DRIVE_SERVER_URL || process.env.OFFICE_SERVER_URL),
    meet: !!process.env.NEXT_PUBLIC_MEET_BASE_URL,
  })
}
