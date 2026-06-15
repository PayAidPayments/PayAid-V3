/**
 * Tenant bridge: tool execution.
 *
 * Bolna sends `{ action, args }` when the LLM asks for a side-effect call
 * (CRM update, send payment link, schedule callback, etc.). We delegate to
 * the shared Bolna tool bridge → `ToolExecutor` so audit + entitlement +
 * draft-first behaviour stay centralized in PayAid.
 *
 * Auth: shared bridge secret + per-call JWT.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateBolnaBridge } from '@/lib/voice-agent/runtime/bridge-auth'
import { executeBolnaBridgeTool } from '@/lib/voice-agent/runtime/bolna-tool-bridge'

export const runtime = 'nodejs'

interface ExecuteBody {
  action?: string
  args?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const auth = authenticateBolnaBridge(request.headers)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => ({}))) as ExecuteBody
  const action = (body.action || '').trim()
  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 })
  }

  try {
    const { result, draft } = await executeBolnaBridgeTool({
      claims: auth.claims,
      action,
      args: (body.args as Record<string, unknown>) || {},
    })

    if (result.error === 'Voice agent not found for this call') {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 })
    }

    const message = result.error || ''
    if (message.includes('not licensed')) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 403 })
    }

    return NextResponse.json({
      ok: !result.error,
      draft: draft === true,
      tool_call_id: result.tool_call_id,
      result: result.result,
      error: result.error,
    })
  } catch (error) {
    console.error('[runtime/bolna/tools/execute] failed:', error)
    const message = error instanceof Error ? error.message : 'Tool execution failed'
    if (message.includes('not licensed')) {
      return NextResponse.json({ ok: false, error: message }, { status: 403 })
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
