import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { MarketingSocialTabs, type SocialPostRow } from '@/components/marketing/MarketingSocialTabs'
import { Megaphone, MessageCircle, Settings, Wifi, WifiOff } from 'lucide-react'

interface PageProps {
  params: Promise<{ tenantId: string }>
}

export default async function MarketingSocialMediaPage({ params }: PageProps) {
  const { tenantId } = await params

  const [accounts, socialPosts, scheduledPosts, recentMentions, waAccount] = await Promise.all([
    prisma.socialMediaAccount
      .findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, platform: true, accountName: true, isConnected: true, followerCount: true },
      })
      .catch(() => []),
    prisma.socialPost
      .findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 30,
        select: {
          id: true,
          content: true,
          platform: true,
          status: true,
          scheduledAt: true,
          publishedAt: true,
          account: { select: { accountName: true } },
        },
      })
      .catch(() => []),
    prisma.scheduledPost
      .findMany({
        where: { tenantId },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
        select: {
          id: true,
          content: true,
          platform: true,
          status: true,
          scheduledAt: true,
          account: { select: { accountName: true } },
        },
      })
      .catch(() => []),
    prisma.socialActivityEvent
      .findMany({
        where: { tenantId },
        orderBy: { eventAt: 'desc' },
        take: 12,
        select: {
          id: true,
          platform: true,
          action: true,
          actorName: true,
          objectText: true,
          eventAt: true,
        },
      })
      .catch(() => []),
    prisma.whatsappAccount
      .findFirst({ where: { tenantId, isActive: true }, select: { id: true, businessName: true, primaryPhone: true } })
      .catch(() => null),
  ])

  const postRows: SocialPostRow[] = [
    ...socialPosts.map((p) => ({
      id: p.id,
      preview: p.content.slice(0, 120),
      platform: p.platform,
      status: p.status,
      scheduledAt: p.scheduledAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      accountName: p.account.accountName,
    })),
    ...scheduledPosts.map((p) => ({
      id: p.id,
      preview: p.content.slice(0, 120),
      platform: p.platform,
      status: p.status,
      scheduledAt: p.scheduledAt.toISOString(),
      publishedAt: null,
      accountName: p.account.accountName,
    })),
  ].slice(0, 40)

  const connectedCount = accounts.filter((a) => a.isConnected).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Channels & Social</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Connected accounts, scheduled posts, and social listening
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/settings/${tenantId}/Integrations/Social`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Settings className="w-4 h-4" />
            Connect channels
          </Link>
          <Link
            href={`/marketing/${tenantId}/Studio`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Compose
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Social accounts</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{connectedCount}</p>
          <p className="text-xs text-slate-500">{accounts.length} total configured</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Posts & scheduled</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{postRows.length}</p>
          <p className="text-xs text-slate-500">In queue or published</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Listening events</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{recentMentions.length}</p>
          <p className="text-xs text-slate-500">Recent webhook activity</p>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Account status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.accountName}</p>
                  <p className="text-xs text-slate-500 capitalize">{a.platform}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  {a.isConnected ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Disconnected</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MarketingSocialTabs tenantId={tenantId} posts={postRows} />

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-500" />
            Social listening
          </h2>
          <Link href={`/marketing/${tenantId}/Home`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
            Open Command Center
          </Link>
        </div>
        {recentMentions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No mentions yet. Enable webhooks on connected channels or{' '}
            <Link href={`/marketing/${tenantId}/Home`} className="text-violet-600 font-medium hover:underline">
              seed demo data
            </Link>{' '}
            on Marketing Home.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentMentions.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5"
              >
                <span className="shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 text-[9px] font-semibold uppercase">
                  {m.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {m.actorName || 'Unknown'} · {m.platform}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{m.objectText || '—'}</p>
                </div>
                <time className="text-[10px] text-slate-400 shrink-0">
                  {new Date(m.eventAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>

      {waAccount && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" />
          WhatsApp business: {waAccount.businessName} ({waAccount.primaryPhone})
        </p>
      )}
    </div>
  )
}
