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

/** Kinds supported by `WebsiteCanvasBlocksPanel` and `WebsiteHomeCanvasSections`. */
export const WEBSITE_CANVAS_BLOCK_KINDS = [
  'features',
  'cta_strip',
  'testimonials',
  'faq',
  'rich_text',
  'image_split',
] as const

export type WebsiteCanvasBlockKind = (typeof WEBSITE_CANVAS_BLOCK_KINDS)[number]

export type WebsiteCanvasCta = {
  label?: string
  href?: string
}

export type WebsiteCanvasBlock = {
  id: string
  kind: WebsiteCanvasBlockKind
  headline?: string
  subheadline?: string
  body?: string
  bullets?: string[]
  imageUrl?: string
  primaryCta?: WebsiteCanvasCta
  secondaryCta?: WebsiteCanvasCta
}

export type WebsiteSiteSchemaCanvas = {
  homeBlocks?: WebsiteCanvasBlock[]
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
  /** Marketing sections below hero (`schemaJson.canvas.homeBlocks`). */
  canvas?: WebsiteSiteSchemaCanvas
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

function isCanvasBlockKind(k: string): k is WebsiteCanvasBlockKind {
  return (WEBSITE_CANVAS_BLOCK_KINDS as readonly string[]).includes(k)
}

function normalizeCanvasBlock(raw: unknown): WebsiteCanvasBlock | null {
  if (!isPlainObject(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const kindStr = typeof raw.kind === 'string' ? raw.kind.trim() : ''
  if (!id || !isCanvasBlockKind(kindStr)) return null
  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets.map((x) => (typeof x === 'string' ? x : String(x)))
    : undefined
  const pickCta = (v: unknown): WebsiteCanvasCta | undefined => {
    if (!isPlainObject(v)) return undefined
    const label = typeof v.label === 'string' ? v.label : undefined
    const href = typeof v.href === 'string' ? v.href : undefined
    if (label === undefined && href === undefined) return undefined
    return { label, href }
  }
  return {
    id,
    kind: kindStr,
    headline: typeof raw.headline === 'string' ? raw.headline : undefined,
    subheadline: typeof raw.subheadline === 'string' ? raw.subheadline : undefined,
    body: typeof raw.body === 'string' ? raw.body : undefined,
    bullets,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    primaryCta: pickCta(raw.primaryCta),
    secondaryCta: pickCta(raw.secondaryCta),
  }
}

function normalizeCanvasInput(raw: unknown): WebsiteSiteSchemaCanvas | undefined {
  if (!isPlainObject(raw)) return undefined
  const hb = raw.homeBlocks
  if (!Array.isArray(hb)) return { homeBlocks: [] }
  const homeBlocks = hb.map(normalizeCanvasBlock).filter((b): b is WebsiteCanvasBlock => b != null)
  return { homeBlocks }
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
  if ('canvas' in raw && raw.canvas != null) {
    const c = normalizeCanvasInput(raw.canvas)
    if (c) out.canvas = c
  }
  return out
}

export function mergeWebsiteSiteSchemaJson(
  base: unknown,
  patch: Partial<WebsiteSiteSchemaJson> & Record<string, unknown>
): WebsiteSiteSchemaJson {
  const b = readWebsiteSiteSchemaJson(base)
  const { settings: patchSettings, canvas: patchCanvas, ...patchRest } = patch
  const merged: WebsiteSiteSchemaJson = {
    ...b,
    ...patchRest,
    settings:
      patchSettings !== undefined ? mergeEditorSettingsBlocks(b.settings, normalizeWebsiteEditorSettings(patchSettings)) : b.settings,
  }
  if (patchCanvas !== undefined) {
    merged.canvas = normalizeCanvasInput(patchCanvas) ?? { homeBlocks: [] }
  }
  return merged
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
