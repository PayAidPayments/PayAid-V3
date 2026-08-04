/**
 * Marketing-home canvas sections below hero (`schemaJson.canvas.homeBlocks`).
 * Text-only rendering (no raw HTML) for XSS safety in v1.
 */

import type { WebsiteCanvasBlock } from '@/lib/website-builder/site-schema'

function CanvasCta({ label, href }: { label?: string; href?: string }) {
  const trimmed = (label ?? '').trim()
  if (!trimmed) return null
  const h = (href ?? '').trim()
  const isHref = /^https?:\/\//i.test(h) || h.startsWith('/')
  if (isHref && h) {
    return (
      <a
        href={h}
        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        {trimmed}
      </a>
    )
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500">
      {trimmed}
    </span>
  )
}

function CanvasSecondaryCta({ label, href }: { label?: string; href?: string }) {
  const trimmed = (label ?? '').trim()
  if (!trimmed) return null
  const h = (href ?? '').trim()
  const isHref = /^https?:\/\//i.test(h) || h.startsWith('/')
  if (isHref && h) {
    return (
      <a
        href={h}
        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
      >
        {trimmed}
      </a>
    )
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500">
      {trimmed}
    </span>
  )
}

export function WebsiteHomeCanvasSections({ blocks }: { blocks: WebsiteCanvasBlock[] }) {
  const list = blocks.filter((b) => b?.id?.trim())
  if (list.length === 0) return null

  return (
    <div className="border-t border-gray-100 bg-white">
      {list.map((block) => (
        <CanvasBlockSection key={block.id} block={block} />
      ))}
    </div>
  )
}

function CanvasBlockSection({ block }: { block: WebsiteCanvasBlock }) {
  const bullets = (block.bullets ?? []).map((s) => s.trim()).filter(Boolean)

  switch (block.kind) {
    case 'features':
      return (
        <section className="border-b border-gray-100 px-4 py-10 sm:px-8">
          {block.headline?.trim() ? (
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{block.headline.trim()}</h2>
          ) : null}
          {block.subheadline?.trim() ? (
            <p className="mt-2 max-w-2xl text-base text-gray-600">{block.subheadline.trim()}</p>
          ) : null}
          {bullets.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bullets.map((line, i) => (
                <li
                  key={`${block.id}-b-${i}`}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-800 shadow-sm"
                >
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )
    case 'cta_strip':
      return (
        <section className="border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-10 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {block.headline?.trim() ? (
              <h2 className="text-2xl font-bold tracking-tight text-white">{block.headline.trim()}</h2>
            ) : null}
            {block.subheadline?.trim() ? (
              <p className="mt-3 text-base text-blue-100">{block.subheadline.trim()}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <CanvasCta label={block.primaryCta?.label} href={block.primaryCta?.href} />
              <CanvasSecondaryCta label={block.secondaryCta?.label} href={block.secondaryCta?.href} />
            </div>
          </div>
        </section>
      )
    case 'testimonials':
      return (
        <section className="border-b border-gray-100 px-4 py-10 sm:px-8">
          {block.headline?.trim() ? (
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{block.headline.trim()}</h2>
          ) : null}
          <figure className="mt-6 rounded-xl border border-violet-100 bg-violet-50/50 p-6 shadow-sm">
            <blockquote className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
              {(block.body ?? '').trim() || 'Add testimonial copy in the canvas editor.'}
            </blockquote>
            {block.subheadline?.trim() ? (
              <figcaption className="mt-4 text-sm font-medium text-violet-900">{block.subheadline.trim()}</figcaption>
            ) : null}
          </figure>
        </section>
      )
    case 'faq':
      return (
        <section className="border-b border-gray-100 px-4 py-10 sm:px-8">
          {block.headline?.trim() ? (
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{block.headline.trim()}</h2>
          ) : null}
          <div className="mt-6 space-y-4">
            {bullets.length > 0 ? (
              bullets.map((line, i) => (
                <div key={`${block.id}-faq-${i}`} className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-sm font-medium text-gray-900">{line}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Add FAQ lines (one per row) in the canvas editor.</p>
            )}
          </div>
        </section>
      )
    case 'rich_text':
      return (
        <section className="border-b border-gray-100 px-4 py-10 sm:px-8">
          {block.headline?.trim() ? (
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{block.headline.trim()}</h2>
          ) : null}
          {(block.body ?? '').trim() ? (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-gray-700 whitespace-pre-wrap">{block.body!.trim()}</p>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Add body text in the canvas editor.</p>
          )}
        </section>
      )
    case 'image_split':
      return (
        <section className="border-b border-gray-100 px-4 py-10 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              {block.headline?.trim() ? (
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">{block.headline.trim()}</h2>
              ) : null}
              {block.subheadline?.trim() ? (
                <p className="mt-3 text-base text-gray-600 whitespace-pre-wrap">{block.subheadline.trim()}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <CanvasCta label={block.primaryCta?.label} href={block.primaryCta?.href} />
                <CanvasSecondaryCta label={block.secondaryCta?.label} href={block.secondaryCta?.href} />
              </div>
            </div>
            <div className="w-full shrink-0 md:max-w-md md:flex-1">
              {block.imageUrl?.trim() ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.imageUrl.trim()} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  Image URL (canvas block)
                </div>
              )}
            </div>
          </div>
        </section>
      )
    default:
      return null
  }
}
