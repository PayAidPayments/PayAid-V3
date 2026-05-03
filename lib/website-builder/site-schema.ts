/**
 * Typed view of `WebsiteSite` persisted `schemaJson` (and bridge `contentJson.schema`).
 * Editor-facing blocks mirror the Bizboost-style split: header / hero / seo / contact.
 * Unknown top-level keys are preserved when merging patches (see `mergeWebsiteSiteSchemaJson`).
 */

export type WebsiteHeaderSettings = {
  siteName?: string
  logoUrl?: string
  sticky?: boolean
}

export type WebsiteHeroCta = {
  label?: string
  href?: string
}

export type WebsiteHeroSettings = {
  headline?: string
  subheadline?: string
  primaryCta?: WebsiteHeroCta
  secondaryCta?: WebsiteHeroCta
}

export type WebsiteSeoSettings = {
  titleSuffix?: string
  defaultDescription?: string
  defaultOgImage?: string
}

export type WebsiteContactSettings = {
  email?: string
  phone?: string
  /** Multi-line address for simple editors */
  addressLines?: string[]
}

export type WebsiteEditorSettingsBlocks = {
  header?: WebsiteHeaderSettings
  hero?: WebsiteHeroSettings
  seo?: WebsiteSeoSettings
  contact?: WebsiteContactSettings
}

export type WebsiteAiDraftPagePlanEntry = {
  pageType?: string
  title?: string
  sections?: string[]
}

/** AI generator payload shape (subset; extra keys allowed at runtime). */
export type WebsiteAiDraft = {
  pagePlan?: WebsiteAiDraftPagePlanEntry[]
} & Record<string, unknown>

export type WebsiteSiteSchemaJson = {
  settings?: WebsiteEditorSettingsBlocks
  aiDraft?: WebsiteAiDraft | null
  aiDraftGeneratedAt?: string
  aiDraftAppliedAt?: string
  editorTelemetry?: Record<string, unknown>
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function pickSettingsBlock<T extends object>(raw: unknown): Partial<T> | undefined {
  if (!isPlainObject(raw)) return undefined
  return raw as Partial<T>
}

/** Returns only the four named blocks; missing blocks stay undefined. */
export function normalizeWebsiteEditorSettings(raw: unknown): WebsiteEditorSettingsBlocks {
  if (!isPlainObject(raw)) return {}
  return {
    header: pickSettingsBlock<WebsiteHeaderSettings>(raw.header),
    hero: pickSettingsBlock<WebsiteHeroSettings>(raw.hero),
    seo: pickSettingsBlock<WebsiteSeoSettings>(raw.seo),
    contact: pickSettingsBlock<WebsiteContactSettings>(raw.contact),
  }
}

function mergeEditorSettingsBlocks(
  base: WebsiteEditorSettingsBlocks | undefined,
  patch: WebsiteEditorSettingsBlocks | undefined
): WebsiteEditorSettingsBlocks | undefined {
  if (!base && !patch) return undefined
  const b = base ?? {}
  const p = patch ?? {}
  return {
    header: p.header != null ? { ...b.header, ...p.header } : b.header,
    hero: p.hero != null ? { ...b.hero, ...p.hero } : b.hero,
    seo: p.seo != null ? { ...b.seo, ...p.seo } : b.seo,
    contact: p.contact != null ? { ...b.contact, ...p.contact } : b.contact,
  }
}

/**
 * Reads persisted schema JSON into a typed overlay while keeping unknown top-level keys
 * for PATCH round-trips.
 */
export function readWebsiteSiteSchemaJson(raw: unknown): WebsiteSiteSchemaJson {
  if (!isPlainObject(raw)) return {}
  const out: WebsiteSiteSchemaJson = { ...raw }
  if ('settings' in raw) {
    out.settings = normalizeWebsiteEditorSettings(raw.settings)
  }
  return out
}

export function mergeWebsiteSiteSchemaJson(
  base: unknown,
  patch: Partial<WebsiteSiteSchemaJson> & Record<string, unknown>
): WebsiteSiteSchemaJson {
  const b = readWebsiteSiteSchemaJson(base)
  const { settings: patchSettings, ...patchRest } = patch
  return {
    ...b,
    ...patchRest,
    settings:
      patchSettings !== undefined ? mergeEditorSettingsBlocks(b.settings, normalizeWebsiteEditorSettings(patchSettings)) : b.settings,
  }
}

export function getAiDraftPagePlan(schema: unknown): WebsiteAiDraftPagePlanEntry[] {
  const s = readWebsiteSiteSchemaJson(schema)
  const plan = s.aiDraft?.pagePlan
  if (!Array.isArray(plan)) return []
  return plan.filter((p): p is WebsiteAiDraftPagePlanEntry => isPlainObject(p))
}

export function hasAiDraftPagePlan(schema: unknown): boolean {
  return getAiDraftPagePlan(schema).length > 0
}
