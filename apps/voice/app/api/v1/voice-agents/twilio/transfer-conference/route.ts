/**
 * GET/POST /api/v1/voice-agents/twilio/transfer-conference
 * TwiML — join supervisor or customer into in-call transfer conference.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function twiml(conferenceName: string, role: string): string {
  const waitUrl = role === 'supervisor' ? '' : ' waitUrl=""'
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Connecting you to a PayAid supervisor.</Say>
  <Dial>
    <Conference${waitUrl} startConferenceOnEnter="true" endConferenceOnExit="false">${conferenceName}</Conference>
  </Dial>
</Response>`
}

export async function GET(request: NextRequest) {
  const conference = request.nextUrl.searchParams.get('conference') || 'payaid_transfer'
  const role = request.nextUrl.searchParams.get('role') || 'supervisor'
  return new NextResponse(twiml(conference, role), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
