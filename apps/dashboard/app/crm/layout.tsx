/**
 * Pass-through layout only. Do not set `revalidate` here: it would override the
 * root `force-dynamic` / `revalidate = 0` and force static prerender of every
 * CRM route at build (hundreds of pages → Vercel timeouts). Prefer per-fetch
 * caching or `unstable_cache` where needed.
 */
export default function CRMRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
