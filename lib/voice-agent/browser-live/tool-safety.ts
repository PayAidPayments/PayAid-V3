/**
 * Draft-first guard for browser-live tool calls (mirrors Bolna bridge policy).
 */

import { isDraftFirstToolName } from '@/lib/voice-agent/runtime/bolna-tool-policy'

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

export function assessBrowserLiveToolCall(input: {
  name: string
  args: Record<string, unknown>
}): BrowserLiveToolAssessment {
  const name = input.name.trim()
  if (!name) {
    return {
      action: 'draft',
      draft: {
        action: name,
        args: input.args,
        message: 'Tool name is required.',
      },
    }
  }

  const draftFirst = isDraftFirstToolName(name)
  if (!draftFirst) return { action: 'execute' }
  if (input.args.confirmed === true) return { action: 'execute' }

  return {
    action: 'draft',
    draft: {
      action: name,
      args: input.args,
      message: `Draft preview for "${name}". Re-run with confirmed=true to execute.`,
    },
  }
}
