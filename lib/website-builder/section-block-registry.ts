/**
 * Canonical mapping from persisted **page-tree section identifiers** (strings) → block kind / labels / copy.
 * Used by `/sites/lp/...` preview cards; swap matchers or plug in CMS-driven ids without changing UI layout code.
 */

export type PublishedSectionKind =
  | 'hero'
  | 'cta'
  | 'faq'
  | 'pricing'
  | 'testimonial'
  | 'gallery'
  | 'features'
  | 'contact'
  | 'stats'
  | 'team'
  | 'general'

export type SectionBlockDefinition = {
  kind: PublishedSectionKind
  label: string
  matchers: RegExp[]
  /** Shown under the section title on public preview routes. */
  previewDescription: string
}

/** First matching row wins — keep more-specific patterns before broader ones where needed. */
export const SECTION_BLOCK_REGISTRY: SectionBlockDefinition[] = [
  {
    kind: 'hero',
    label: 'Hero',
    matchers: [/(^|[-_])(hero|banner|masthead)/i],
    previewDescription:
      'Typically a headline, supporting line, and primary actions. Replace with hero template output when wired.',
  },
  {
    kind: 'cta',
    label: 'Call to action',
    matchers: [/(^|[-_])(cta|call-to-action|signup|subscribe|book|demo)/i],
    previewDescription: 'Conversion-focused strip or card; connect to CTAs from settings or CRM when unified.',
  },
  {
    kind: 'faq',
    label: 'FAQ',
    matchers: [/faq/i],
    previewDescription: 'Question/answer accordion or list — feed from FAQs module or markdown when available.',
  },
  {
    kind: 'pricing',
    label: 'Pricing',
    matchers: [/pric(e|ing)|plan/i],
    previewDescription: 'Plans and comparison table; bind to Stripe/products catalog in a unified commerce slice.',
  },
  {
    kind: 'testimonial',
    label: 'Testimonials',
    matchers: [/testimonial|review|quote/i],
    previewDescription: 'Social proof carousel or grid; optionally sync reviews from integrations.',
  },
  {
    kind: 'gallery',
    label: 'Gallery',
    matchers: [/galler(y|ies)|portfolio|carousel|slider/i],
    previewDescription: 'Image grid or carousel; tie to Brand Kit assets or gallery CMS.',
  },
  {
    kind: 'features',
    label: 'Features',
    matchers: [/feature|benefit|highlight|service/i],
    previewDescription: 'Icon + headline grid for services/features; maps well to editable block JSON later.',
  },
  {
    kind: 'contact',
    label: 'Contact',
    matchers: [/contact|location|map|hours/i],
    previewDescription: 'Form map and details; may merge with `schemaJson.settings.contact` in one template.',
  },
  {
    kind: 'stats',
    label: 'Stats',
    matchers: [/stat|metric|number|count|social-proof/i],
    previewDescription: 'Key metrics or logos strip; populate from CRM or analytics in production.',
  },
  {
    kind: 'team',
    label: 'Team',
    matchers: [/team|staff|about-us|people/i],
    previewDescription: 'People cards bios; optionally pull from Employees / directory module.',
  },
  {
    kind: 'general',
    label: 'Section',
    matchers: [],
    previewDescription:
      'No heuristic kind matched — use a generic block or extend SECTION_BLOCK_REGISTRY for this identifier.',
  },
]

const KNOWN_LOOKUP = Object.fromEntries(
  SECTION_BLOCK_REGISTRY.map((entry) => [entry.kind, entry])
) as Record<PublishedSectionKind, SectionBlockDefinition>

export function inferPublishedSectionKind(sectionId: string): PublishedSectionKind {
  const key = sectionId.trim().toLowerCase()
  if (!key) return 'general'
  for (const entry of SECTION_BLOCK_REGISTRY) {
    if (!entry.matchers.length) continue
    if (entry.matchers.some((re) => re.test(key))) return entry.kind
  }
  return 'general'
}

export function getSectionBlockPresentation(kind: PublishedSectionKind): SectionBlockDefinition {
  return KNOWN_LOOKUP[kind] ?? KNOWN_LOOKUP.general
}
