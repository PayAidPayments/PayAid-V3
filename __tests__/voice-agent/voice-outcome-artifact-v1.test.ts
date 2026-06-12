import {
  readVoiceArtifactV1,
  readVoiceOutcomeV1,
  VOICE_OUTCOME_ARTIFACT_V1,
} from '@/lib/voice-agent/voice-outcome-artifact-v1'

describe('voice outcome/artifact v1 metadata freeze', () => {
  it('reads outcome from postCall metadata', () => {
    const outcome = readVoiceOutcomeV1({
      outcomeCode: 'qualified',
      metadataJson: {
        postCall: {
          disposition: 'qualified',
          summary: 'Caller asked for pricing',
          sentiment: 'positive',
          routing: 'matched_contact',
        },
      },
    })
    expect(outcome?.schema).toBe(VOICE_OUTCOME_ARTIFACT_V1)
    expect(outcome?.disposition).toBe('qualified')
    expect(outcome?.summary).toContain('pricing')
  })

  it('reads artifact from recording + transcript', () => {
    const artifact = readVoiceArtifactV1({
      recordingUrl: 'https://example.com/rec.wav',
      transcriptJson: [{ role: 'user', text: 'hi' }],
      metadataJson: { postCall: { recordingMime: 'audio/wav' } },
    })
    expect(artifact?.schema).toBe(VOICE_OUTCOME_ARTIFACT_V1)
    expect(artifact?.recordingUrl).toContain('rec.wav')
    expect(artifact?.transcriptTurnCount).toBe(1)
  })
})
