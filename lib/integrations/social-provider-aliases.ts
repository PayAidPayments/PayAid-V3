export const SOCIAL_SETTINGS_PROVIDER_IDS = [
  'linkedin',
  'facebook',
  'instagram',
  'twitter',
  'youtube',
] as const

export const SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES = [
  ...SOCIAL_SETTINGS_PROVIDER_IDS,
  'google',
] as const

export type SocialSettingsProviderId = (typeof SOCIAL_SETTINGS_PROVIDER_IDS)[number]
export type SocialSettingsProviderIdWithAliases =
  (typeof SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES)[number]

export function normalizeSocialProviderAlias(
  provider: string
): SocialSettingsProviderId {
  return provider === 'google' ? 'youtube' : (provider as SocialSettingsProviderId)
}

export function getSocialProviderAliases(
  provider: string
): SocialSettingsProviderIdWithAliases[] {
  const normalized = normalizeSocialProviderAlias(provider)
  return normalized === 'youtube' ? ['youtube', 'google'] : [normalized]
}
