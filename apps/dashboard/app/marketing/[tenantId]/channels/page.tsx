import Link from 'next/link'
import { getChannelAccounts } from '@/lib/marketing/marketing-data'
import { MarketingChannelsClient } from '@/components/marketing/MarketingChannelsClient'

export default async function MarketingChannelsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const { rows, channelAccountsTableReady } = await getChannelAccounts(tenantId)
  const accounts = rows.map((a) => ({
    id: a.id,
    type: a.type,
    provider: a.provider,
    status: a.status,
  }))

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Channels</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect email, SMS, WhatsApp, and social accounts. Sending always uses profiles configured here.
        </p>
      </header>

      {!channelAccountsTableReady && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200/80 dark:border-amber-500/35 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        >
          <p className="font-medium">Marketing database schema is not up to date</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            From the repo root run{' '}
            <code className="rounded bg-amber-100/80 dark:bg-amber-900/40 px-1 text-xs">
              npm run db:migrate:deploy
            </code>
            . Do not use <code className="rounded px-1 text-xs">npm run db:migrate</code> against Supabase (shadow DB
            + first migration = P3006). Set <code className="rounded px-1 text-xs">DATABASE_DIRECT_URL</code> in{' '}
            <code className="rounded px-1 text-xs">.env</code> to Supabase&apos;s direct Postgres URI when the pooler
            blocks migrations (see <code className="rounded px-1 text-xs">.env.example</code>). Reload after deploy.
          </p>
          <p className="mt-2">
            <Link
              href={`/marketing/${tenantId}/settings`}
              className="font-medium text-amber-950 underline underline-offset-2 hover:no-underline dark:text-amber-50"
            >
              Open Marketing settings
            </Link>
          </p>
        </div>
      )}

      <MarketingChannelsClient tenantId={tenantId} accounts={accounts} />
    </div>
  )
}
