/**
 * Draft-first guard for browser-live tool calls (mirrors Bolna bridge policy).
 */

import { assessToolGatewayCall } from '@/lib/voice-agent/security/tool-gateway'

export type BrowserLiveToolAssessment =
  | { action: 'execute' }
  | {
      action: 'draft'
      draft: {
        action: string
        args: Record<string, unknown>
        message: string
      }
    }
  | {
      action: 'deny'
      message: string
    }

export function assessBrowserLiveToolCall(input: {
  name: string
  args: Record<string, unknown>
  registeredToolNames?: string[]
}): BrowserLiveToolAssessment {
  const registered = input.registeredToolNames?.length
    ? input.registeredToolNames
    : [input.name.trim()].filter(Boolean)

  const decision = assessToolGatewayCall({
    name: input.name,
    args: input.args,
    registeredToolNames: registered,
    channel: 'browser_live',
  })

  if (decision.action === 'deny') {
    return { action: 'deny', message: decision.message }
  }
  if (decision.action === 'draft') {
    return {
      action: 'draft',
      draft: {
        action: input.name,
        args: decision.args,
        message: decision.message,
      },
    }
  }
  return { action: 'execute' }
}
