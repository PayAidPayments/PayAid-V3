import { getSocialPosts } from '@/lib/marketing/marketing-data'
import { MarketingSocialTabs } from '@/components/marketing/MarketingSocialTabs'

export default async function MarketingSocialPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const rows = await getSocialPosts(tenantId, 20)
  const posts = rows.map((p) => ({
    id: p.id,
    preview: p.content.slice(0, 80) + (p.content.length > 80 ? '…' : ''),
    platform: p.platform,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    accountName: p.account.accountName,
  }))

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Social</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Plan and schedule posts. Connect Meta, LinkedIn, and YouTube under Channels first.
        </p>
      </header>
      <MarketingSocialTabs tenantId={tenantId} posts={posts} />
    </div>
  )
}
