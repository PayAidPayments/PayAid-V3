#!/usr/bin/env node

const defaultTtlMinutes = Number(process.env.MARKER_MUTATION_APPROVAL_TTL_MINUTES || 30)
const maxWindowHours = Number(process.env.MARKER_MUTATION_APPROVAL_MAX_WINDOW_HOURS || 24)
const enforceMaxWindow = process.env.MARKER_MUTATION_APPROVAL_ENFORCE_MAX_WINDOW === '1'

console.log(
  JSON.stringify(
    {
      ok: true,
      policy: {
        defaultTtlMinutes,
        maxWindowHours,
        enforceMaxWindow,
      },
      envKeys: [
        'MARKER_MUTATION_APPROVAL_TTL_MINUTES',
        'MARKER_MUTATION_APPROVAL_MAX_WINDOW_HOURS',
        'MARKER_MUTATION_APPROVAL_ENFORCE_MAX_WINDOW',
        'MARKER_MUTATION_APPROVAL_UNTIL_ISO',
      ],
      notes: [
        'Use markers:status to inspect current approval file state.',
        'Use markers:allow-mutation or markers:allow-mutation:until to create approvals.',
      ],
    },
    null,
    2
  )
)

