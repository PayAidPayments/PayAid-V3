import { PublishedSectionBlocks } from '@/lib/website-builder/published-section-blocks'
import type { WebsiteEditorSettingsBlocks } from '@/lib/website-builder/site-schema'

export type WebsitePublishedPageSummary = {
  id: string
  title: string
  slug: string
}

export function publishedSiteDocumentTitle(
  siteName: string,
  metaTitle: string | null | undefined,
  titleSuffix: string | undefined
): string {
  const base = metaTitle?.trim() || siteName
  return base + (titleSuffix?.trim() ?? '')
}

export function publishedSiteMetaDescription(
  settingsDescription: string | undefined,
  metaDescription: string | null | undefined
): string {
  return settingsDescription?.trim() || metaDescription?.trim() || ''
}

function hasRenderableSettings(settings: WebsiteEditorSettingsBlocks | undefined): boolean {
  if (!settings) return false
  const h = settings.header
  const hero = settings.hero
  const seo = settings.seo
  const c = settings.contact
  if (h?.siteName?.trim() || h?.logoUrl?.trim() || h?.sticky) return true
  if (
    hero?.headline?.trim() ||
    hero?.subheadline?.trim() ||
    hero?.primaryCta?.label?.trim() ||
    hero?.primaryCta?.href?.trim() ||
    hero?.secondaryCta?.label?.trim() ||
    hero?.secondaryCta?.href?.trim()
  )
    return true
  if (seo?.titleSuffix?.trim() || seo?.defaultDescription?.trim() || seo?.defaultOgImage?.trim()) return true
  if (c?.email?.trim() || c?.phone?.trim() || (c?.addressLines && c.addressLines.some((l) => l.trim()))) return true
  return false
}

function CtaLink({ label, href }: { label: string; href: string }) {
  const trimmed = label.trim()
  if (!trimmed) return null
  const h = href.trim()
  const isHref = /^https?:\/\//i.test(h) || h.startsWith('/')
  if (isHref && h) {
    return (
      <a
        href={h}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
      >
        {trimmed}
      </a>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500">
      {trimmed}
      {h ? <span className="ml-1 text-xs text-gray-400">({h || 'no link'})</span> : null}
    </span>
  )
}

export type WebsiteSettingsPublicLayoutProps = {
  siteName: string
  metaTitle?: string | null
  metaDescription?: string | null
  settings: WebsiteEditorSettingsBlocks | undefined
  /** `dashboard` shows a Preview chip; `public` omits it. */
  variant: 'dashboard' | 'public'
  /** Optional page tree summaries (e.g. from `contentJson.pages`). */
  pageSummaries?: WebsitePublishedPageSummary[]
  /**
   * When set on `public`, renders Home + per-page links to `/sites/lp/.../[pageSlug]`
   * and hides the plain “Pages” bullet list.
   */
  publishedNavigation?: { basePath: string; activePageSlug: string | null }
  /** Inner route: skip hero/about blocks; render page title + section ids. */
  publishedInnerPage?: { title: string; sections: string[] }
}

/**
 * Shared layout for dashboard preview and public published sites (`schemaJson.settings`).
 */
function navLinkClasses(active: boolean) {
  return `text-sm font-medium whitespace-nowrap ${active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
}

export function WebsiteSettingsPublicLayout({
  siteName,
  metaTitle,
  metaDescription,
  settings,
  variant,
  pageSummaries,
  publishedNavigation,
  publishedInnerPage,
}: WebsiteSettingsPublicLayoutProps) {
  const hasBlockContent = hasRenderableSettings(settings)
  const hasMetaOnly = Boolean(metaTitle?.trim() || metaDescription?.trim())
  const hasContent = hasBlockContent || hasMetaOnly
  const header = settings?.header
  const hero = settings?.hero
  const seo = settings?.seo
  const contact = settings?.contact
  const navLabel = header?.siteName?.trim() || siteName
  const stickyClass = header?.sticky ? 'sticky top-0 z-10' : ''
  const headerAside =
    variant === 'dashboard' ? (
      <span className="hidden text-xs text-gray-400 sm:inline">Preview</span>
    ) : null

  const showNav =
    variant === 'public' &&
    publishedNavigation &&
    pageSummaries &&
    pageSummaries.some((p) => p.slug?.trim())

  const showBulletedPages =
    pageSummaries &&
    pageSummaries.length > 0 &&
    (variant === 'dashboard' || !publishedNavigation)

  const showHeroMarketing = Boolean(hasBlockContent && !publishedInnerPage)
  const showAboutSitePanel =
    !publishedInnerPage &&
    Boolean(
      seo?.titleSuffix?.trim() ||
        seo?.defaultDescription?.trim() ||
        seo?.defaultOgImage?.trim() ||
        metaTitle ||
        metaDescription
    )

  if (!hasContent) {
    if (variant === 'dashboard') {
      return (
        <p className="text-sm text-gray-500">
          No editor settings or site meta to show yet. Save <span className="font-medium">Editor settings</span> or set
          meta title/description in <span className="font-medium">Edit site</span>.
        </p>
      )
    }
    if (variant === 'public' && publishedInnerPage) {
      return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {showNav && publishedNavigation ? (
            <PublishedLpNavBar
              basePath={publishedNavigation.basePath}
              activeSlug={publishedNavigation.activePageSlug}
              pages={pageSummaries ?? []}
            />
          ) : null}
          <PublishedInnerArticle title={publishedInnerPage.title} sections={publishedInnerPage.sections} />
        </div>
      )
    }
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{siteName}</h1>
        {metaDescription?.trim() ? (
          <p className="mt-4 text-gray-600 whitespace-pre-wrap">{metaDescription.trim()}</p>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Content coming soon.</p>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {hasBlockContent ? (
        <header
          className={`flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 ${stickyClass}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {header?.logoUrl?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element -- editor / tenant-provided URL
              <img
                src={header.logoUrl.trim()}
                alt=""
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : null}
            <span className="truncate text-sm font-semibold text-gray-900">{navLabel}</span>
          </div>
          {headerAside}
        </header>
      ) : null}

      {showNav && publishedNavigation ? (
        <PublishedLpNavBar
          basePath={publishedNavigation.basePath}
          activeSlug={publishedNavigation.activePageSlug}
          pages={pageSummaries ?? []}
        />
      ) : null}

      {publishedInnerPage ? (
        <PublishedInnerArticle title={publishedInnerPage.title} sections={publishedInnerPage.sections} />
      ) : null}

      {showHeroMarketing ? (
        <section className="px-4 py-8 sm:px-8 sm:py-10 bg-gradient-to-b from-gray-50 to-white">
          {hero?.headline?.trim() ? (
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{hero.headline.trim()}</h1>
          ) : (
            <h1 className="text-lg font-medium text-gray-400">No hero headline</h1>
          )}
          {hero?.subheadline?.trim() ? (
            <p className="mt-3 max-w-2xl text-base text-gray-600 whitespace-pre-wrap">{hero.subheadline.trim()}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaLink label={hero?.primaryCta?.label ?? ''} href={hero?.primaryCta?.href ?? ''} />
            <CtaLink label={hero?.secondaryCta?.label ?? ''} href={hero?.secondaryCta?.href ?? ''} />
          </div>
        </section>
      ) : null}

      {showAboutSitePanel && (
        <section
          className={`border-t border-gray-100 px-4 py-4 sm:px-8 bg-white ${!hasBlockContent ? 'border-t-0' : ''}`}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {variant === 'dashboard' ? 'SEO snapshot' : 'About this site'}
          </h2>
          <p className="mt-2 text-sm text-gray-800">
            <span className="text-gray-500">{variant === 'dashboard' ? 'Example title:' : 'Title:'}</span>{' '}
            {(metaTitle?.trim() || (variant === 'dashboard' ? 'Page title' : siteName)) +
              (seo?.titleSuffix?.trim() ?? '')}
          </p>
          {(seo?.defaultDescription?.trim() || metaDescription?.trim()) && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
              {seo?.defaultDescription?.trim() || metaDescription?.trim()}
            </p>
          )}
          {seo?.defaultOgImage?.trim() ? (
            <p className="mt-2 truncate text-xs text-gray-500 font-mono">{seo.defaultOgImage.trim()}</p>
          ) : null}
        </section>
      )}

      {hasBlockContent &&
        (contact?.email?.trim() || contact?.phone?.trim() || contact?.addressLines?.length) && (
          <footer className="border-t border-gray-100 px-4 py-4 sm:px-8 bg-gray-50 text-sm text-gray-700">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
            <ul className="mt-2 space-y-1">
              {contact.email?.trim() ? <li>{contact.email.trim()}</li> : null}
              {contact.phone?.trim() ? <li>{contact.phone.trim()}</li> : null}
              {(contact.addressLines ?? [])
                .filter((l) => l.trim())
                .map((line, i) => (
                  <li key={`${i}-${line.trim().slice(0, 48)}`}>{line.trim()}</li>
                ))}
            </ul>
          </footer>
        )}

      {showBulletedPages ? (
        <section className="border-t border-gray-100 px-4 py-4 sm:px-8 bg-white">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pages</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {pageSummaries!.map((p) => (
              <li key={p.id}>
                <span className="font-medium">{p.title}</span>
                {p.slug ? <span className="text-gray-500"> ({p.slug})</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function PublishedLpNavBar({
  basePath,
  activeSlug,
  pages,
}: {
  basePath: string
  activeSlug: string | null
  pages: WebsitePublishedPageSummary[]
}) {
  function norm(s: string) {
    try {
      return decodeURIComponent(s).trim().toLowerCase()
    } catch {
      return s.trim().toLowerCase()
    }
  }
  const activeNorm = activeSlug === null ? null : norm(activeSlug)

  const homeActive = activeNorm === null

  return (
    <nav aria-label="Page" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
      <a href={basePath} className={navLinkClasses(homeActive)} {...(homeActive ? { 'aria-current': 'page' as const } : {})}>
        Home
      </a>
      {pages
        .filter((p) => p.slug?.trim())
        .map((p) => {
          const href = `${basePath}/${encodeURIComponent(p.slug.trim())}`
          const pageActive = activeNorm !== null && norm(p.slug) === activeNorm
          return (
            <a key={p.id} href={href} className={navLinkClasses(pageActive)} {...(pageActive ? { 'aria-current': 'page' as const } : {})}>
              {p.title}
            </a>
          )
        })}
    </nav>
  )
}

function PublishedInnerArticle({ title, sections }: { title: string; sections: string[] }) {
  const list = sections.map((s) => s.trim()).filter(Boolean)
  return (
    <article className="border-t border-gray-100 px-4 py-8 sm:px-8 sm:py-10 bg-white">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
      <PublishedSectionBlocks sectionIds={list} />
    </article>
  )
}
