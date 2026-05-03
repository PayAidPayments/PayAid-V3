import { getContentItems, getMediaAssets } from '@/lib/marketing/marketing-data'
import { MarketingLibraryTabs } from '@/components/marketing/MarketingLibraryTabs'

export default async function MarketingLibraryPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const [contentRows, mediaRows] = await Promise.all([
    getContentItems(tenantId, 20),
    getMediaAssets(tenantId, 20),
  ])

  const contentItems = contentRows.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    channels: c.channels ?? [],
    goal: c.goal,
    updatedAt: c.updatedAt.toISOString(),
  }))

  const mediaAssets = mediaRows.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.type,
    tags: m.tags ?? [],
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Library</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Content snippets, media, and reusable campaign templates.
        </p>
      </header>
      <MarketingLibraryTabs tenantId={tenantId} contentItems={contentItems} mediaAssets={mediaAssets} />
    </div>
  )
}
