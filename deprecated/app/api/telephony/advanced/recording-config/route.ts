import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AdvancedTelephonyService } from '@/lib/telephony/advanced-features'
import { z } from 'zod'

const recordingConfigSchema = z.object({
  enabled: z.boolean(),
  autoRecord: z.boolean(),
  recordInbound: z.boolean(),
  recordOutbound: z.boolean(),
  storageProvider: z.enum(['local', 's3', 'twilio']),
  retentionDays: z.number().min(1).max(365),
})

/**
 * POST /api/telephony/advanced/recording-config
 * Configure call recording
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const config = recordingConfigSchema.parse(body)

    await AdvancedTelephonyService.configureCallRecording(tenantId, config)

    return NextResponse.json({
      success: true,
      message: 'Call recording configured successfully',
    })
  } catch (error) {
    console.error('[Telephony Recording Config] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
