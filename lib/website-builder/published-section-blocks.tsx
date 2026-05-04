/**
 * Public `/sites/lp/...` section preview cards — visuals only; kinds and copy come from `section-block-registry.ts`.
 */

import {
  getSectionBlockPresentation,
  inferPublishedSectionKind,
  type PublishedSectionKind,
} from '@/lib/website-builder/section-block-registry'

export { inferPublishedSectionKind, type PublishedSectionKind } from '@/lib/website-builder/section-block-registry'

const KIND_STYLES: Record<
  PublishedSectionKind,
  { ring: string; bg: string; badge: string }
> = {
  hero: {
    ring: 'ring-indigo-200',
    bg: 'bg-gradient-to-br from-indigo-50/80 to-white',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  cta: {
    ring: 'ring-amber-200',
    bg: 'bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-900',
  },
  faq: { ring: 'ring-sky-200', bg: 'bg-sky-50/50', badge: 'bg-sky-100 text-sky-900' },
  pricing: { ring: 'ring-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-900' },
  testimonial: { ring: 'ring-violet-200', bg: 'bg-violet-50/50', badge: 'bg-violet-100 text-violet-900' },
  gallery: { ring: 'ring-fuchsia-200', bg: 'bg-fuchsia-50/40', badge: 'bg-fuchsia-100 text-fuchsia-900' },
  features: { ring: 'ring-teal-200', bg: 'bg-teal-50/40', badge: 'bg-teal-100 text-teal-900' },
  contact: { ring: 'ring-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-200 text-slate-800' },
  stats: { ring: 'ring-orange-200', bg: 'bg-orange-50/50', badge: 'bg-orange-100 text-orange-900' },
  team: { ring: 'ring-rose-200', bg: 'bg-rose-50/40', badge: 'bg-rose-100 text-rose-900' },
  general: { ring: 'ring-gray-200', bg: 'bg-gray-50/80', badge: 'bg-gray-200 text-gray-800' },
}

export function PublishedSectionBlocks({ sectionIds }: { sectionIds: string[] }) {
  const ids = sectionIds.map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">No section identifiers on this page yet.</p>
  }

  return (
    <div className="mt-8 grid gap-4 sm:gap-5">
      {ids.map((id) => (
        <PublishedSectionCard key={id} sectionId={id} />
      ))}
    </div>
  )
}

function PublishedSectionCard({ sectionId }: { sectionId: string }) {
  const kind = inferPublishedSectionKind(sectionId)
  const def = getSectionBlockPresentation(kind)
  const styles = KIND_STYLES[kind]

  return (
    <section
      className={`rounded-xl border border-gray-100 shadow-sm ring-1 ${styles.ring} ${styles.bg} p-4 sm:p-5`}
      aria-labelledby={`section-${sanitizeDomId(sectionId)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`section-${sanitizeDomId(sectionId)}`} className="text-lg font-semibold text-gray-900">
          <span className={`mr-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
            {def.label}
          </span>
          <span className="font-mono text-sm font-normal text-gray-700">{sectionId}</span>
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{def.previewDescription}</p>
    </section>
  )
}

function sanitizeDomId(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'block'
}
