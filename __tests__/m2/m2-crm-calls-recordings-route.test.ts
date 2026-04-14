import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/crm/calls/recordings/route'

jest.mock('@/lib/telephony/call-recording', () => ({
  handleTwilioRecording: jest.fn(),
  handleExotelRecording: jest.fn(),
}))

describe('POST /api/crm/calls/recordings (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('processes twilio recording payload', async () => {
    const recording = require('@/lib/telephony/call-recording')
    recording.handleTwilioRecording.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/crm/calls/recordings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-provider': 'twilio',
        'x-tenant-id': 'tn_m2',
      },
      body: JSON.stringify({
        RecordingSid: 'RE123',
        CallSid: 'CA123',
        RecordingUrl: 'https://example.com/rec.mp3',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(recording.handleTwilioRecording).toHaveBeenCalledWith(
      'RE123',
      'CA123',
      'https://example.com/rec.mp3',
      'tn_m2'
    )
  })

  it('returns 400 for invalid provider', async () => {
    const req = new NextRequest('http://localhost/api/crm/calls/recordings', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-provider': 'unknown' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid provider')
  })

  it('returns 400 when tenant id header is missing for twilio', async () => {
    const req = new NextRequest('http://localhost/api/crm/calls/recordings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-provider': 'twilio',
      },
      body: JSON.stringify({
        RecordingSid: 'RE124',
        CallSid: 'CA124',
        RecordingUrl: 'https://example.com/rec2.mp3',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Tenant ID required')
  })

  it('processes exotel recording payload', async () => {
    const recording = require('@/lib/telephony/call-recording')
    recording.handleExotelRecording.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/crm/calls/recordings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-provider': 'exotel',
        'x-tenant-id': 'tn_m2',
      },
      body: JSON.stringify({
        recording_id: 'ex_rec_1',
        call_id: 'ex_call_1',
        recording_url: 'https://example.com/exotel-recording.mp3',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(recording.handleExotelRecording).toHaveBeenCalledWith(
      'ex_rec_1',
      'ex_call_1',
      'https://example.com/exotel-recording.mp3',
      'tn_m2'
    )
  })
})
