import type { Prisma } from '@prisma/client'

/** Base tag on all profile-driven operational tasks. */
export const PROFILE_AUTOMATION_BASE_TAG = 'profile_automation'

/** Secondary tag: `pa_profile_auto:<stableKey>` for idempotent seeding. */
export const profileAutomationKeyTag = (stableKey: string) =>
  `pa_profile_auto:${stableKey}`

function parseCadenceToDays(value: string): number | null {
  const v = value.trim().toLowerCase()
  if (v === 'weekly') return 7
  if (v === 'biweekly') return 14
  if (v === 'monthly') return 30
  if (v === 'quarterly') return 90
  if (v === 'annual') return 365
  if (v === 'campaign_end') return 30
  return null
}

export function parseProjectProfileMetadata(notes: string | null | undefined): Record<string, string> {
  if (!notes) return {}
  const marker = '[Profile Metadata]'
  const i = notes.indexOf(marker)
  if (i < 0) return {}
  const block = notes.slice(i + marker.length).trim()
  const out: Record<string, string> = {}
  for (const raw of block.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const sep = line.indexOf(':')
    if (sep <= 0) continue
    const key = line.slice(0, sep).trim()
    const value = line.slice(sep + 1).trim()
    if (key && value) out[key] = value
  }
  return out
}

export async function seedOperationalTasksFromProfileMetadata(
  tx: Prisma.TransactionClient,
  input: { projectId: string; ownerId: string | null; notes: string | null | undefined }
): Promise<number> {
  const m = parseProjectProfileMetadata(input.notes)
  let created = 0
  const dueInDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  const makeTask = async (
    stableKey: string,
    name: string,
    description: string,
    days = 14
  ) => {
    const keyTag = profileAutomationKeyTag(stableKey)
    const dup = await tx.projectTask.findFirst({
      where: {
        projectId: input.projectId,
        tags: { hasEvery: [PROFILE_AUTOMATION_BASE_TAG, keyTag] },
      },
      select: { id: true },
    })
    if (dup) return

    await tx.projectTask.create({
      data: {
        projectId: input.projectId,
        name,
        description,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: dueInDays(days),
        tags: [PROFILE_AUTOMATION_BASE_TAG, keyTag],
        ...(input.ownerId ? { assignedToId: input.ownerId } : {}),
      },
    })
    created += 1
  }

  const renewalCadence = m['Renewal cadence']
  const renewalDays = renewalCadence ? parseCadenceToDays(renewalCadence) : null
  if (renewalDays) {
    await makeTask(
      'renewal_review_setup',
      'Renewal review setup',
      `Establish recurring renewal review cadence (${renewalCadence}).`,
      renewalDays
    )
  }

  const reportingCadence = m['Reporting cadence']
  const reportingDays = reportingCadence ? parseCadenceToDays(reportingCadence) : null
  if (reportingDays) {
    await makeTask(
      'reporting_cadence_setup',
      'Client reporting cadence setup',
      `Set up recurring delivery reports (${reportingCadence}).`,
      reportingDays
    )
  }

  const releaseCadence = m['Release cadence']
  const releaseDays = releaseCadence ? parseCadenceToDays(releaseCadence) : null
  if (releaseDays) {
    await makeTask(
      'release_cadence_kickoff',
      'Release cadence kickoff',
      `Align release rhythm and checkpoints (${releaseCadence}).`,
      releaseDays
    )
  }

  if (m['UAT owner']) {
    await makeTask(
      'uat_ownership_alignment',
      'UAT ownership alignment',
      `Confirm UAT owner responsibilities with ${m['UAT owner']}.`,
      10
    )
  }

  if (m['SLA target (hours)']) {
    await makeTask(
      'sla_workflow_definition',
      'SLA response workflow definition',
      `Define operational SLA workflow for ${m['SLA target (hours)']} hour target.`,
      7
    )
  }

  return created
}

