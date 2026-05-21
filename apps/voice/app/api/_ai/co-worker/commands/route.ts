import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { parseNLCommand, executeNLCommand } from '@/lib/ai/co-worker/nl-commands'

/** POST /api/ai/co-worker/commands - Execute natural language command */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { command } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'command is required' },
        { status: 400 }
      )
    }

    const parsed = parseNLCommand(command)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Could not parse command', suggestions: [
          'Create a contact named John Doe',
          'Add a deal for ₹50000',
          'Schedule a follow-up task in 3 days',
          'Show me all contacts',
        ]},
        { status: 400 }
      )
    }

    const result = await executeNLCommand(tenantId, userId, parsed)

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      parsed,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to execute command' },
      { status: 500 }
    )
  }
}
