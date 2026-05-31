'use client'

import { Badge } from '@/components/ui/badge'
import {
  type VoiceBehaviorConfig,
  VOICE_BEHAVIOR_PREVIEW_DISCLAIMER,
  labelForPacePreset,
  labelForTonePreset,
  labelForVerbosityPreset,
  VOICE_TONE_PRESETS,
} from '@/lib/voice-agent/voice-behavior-config'

type Props = {
  behavior: VoiceBehaviorConfig
  /** Studio editor vs read-only demo banner */
  variant?: 'demo' | 'studio'
}

export function VoiceBehaviorPreview({ behavior, variant = 'demo' }: Props) {
  const toneMeta = VOICE_TONE_PRESETS.find((p) => p.value === behavior.tonePreset)

  return (
    <div
      className={
        variant === 'demo'
          ? 'rounded-md border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2'
          : 'rounded-md border bg-muted/25 p-3 space-y-2'
      }
    >
      <p className="text-xs font-medium text-foreground">Voice behavior preview</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" title={toneMeta?.clientDescription}>
          Tone: {labelForTonePreset(behavior.tonePreset)}
        </Badge>
        <Badge variant="outline">Pace: {labelForPacePreset(behavior.pacePreset)}</Badge>
        <Badge variant="outline">Verbosity: {labelForVerbosityPreset(behavior.verbosityPreset)}</Badge>
      </div>
      {toneMeta?.clientDescription ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tone preview:</span> {toneMeta.clientDescription}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground leading-snug">{VOICE_BEHAVIOR_PREVIEW_DISCLAIMER}</p>
    </div>
  )
}
