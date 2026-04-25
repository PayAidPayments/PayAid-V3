export type StudioWorkspaceMode = 'social' | 'direct'

export const DIRECT_CHANNEL_IDS = ['email', 'sms', 'whatsapp'] as const
export const SOCIAL_CHANNEL_IDS = ['facebook', 'instagram', 'linkedin', 'youtube'] as const
export type StudioWorkspaceChannel =
  | (typeof DIRECT_CHANNEL_IDS)[number]
  | (typeof SOCIAL_CHANNEL_IDS)[number]

export function getWorkspaceDefaultChannels(
  workspaceMode: StudioWorkspaceMode
): StudioWorkspaceChannel[] {
  return workspaceMode === 'direct'
    ? [...DIRECT_CHANNEL_IDS]
    : ['facebook', 'instagram', 'linkedin']
}

export function filterChannelsForWorkspace(
  channels: string[],
  workspaceMode: StudioWorkspaceMode
): StudioWorkspaceChannel[] {
  const allowed = workspaceMode === 'direct' ? DIRECT_CHANNEL_IDS : SOCIAL_CHANNEL_IDS
  return channels.filter((c): c is StudioWorkspaceChannel =>
    (allowed as readonly string[]).includes(c)
  )
}
