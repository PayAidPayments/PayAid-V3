/**
 * Voice agent training pack JSON shape (draft + approved snapshots).
 */

export type TrainingPackApprovedSnapshot = {
  sampleConversations?: Array<{ user: string; assistant: string }>
  goodBadExamples?: Array<{ scenario?: string; good: string; bad: string; why?: string }>
  bannedPhrases?: string[]
  objections?: Array<{ trigger: string; response: string }>
  escalations?: Array<{ when: string; action: string }>
  notes?: string
}

export type TrainingPackDraftSnapshot = TrainingPackApprovedSnapshot
