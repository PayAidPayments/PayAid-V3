import Link from 'next/link'

/** Stub — full multi-channel composer will reuse Studio + Library. */
export default async function MarketingSocialNewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">New social post</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Composer stub. Use{' '}
        <Link href={`/marketing/${tenantId}/Social-Media/Create-Post`} className="text-violet-600 font-medium hover:underline">
          Create Post
        </Link>{' '}
        for the current flow.
      </p>
      <Link
        href={`/marketing/${tenantId}/social`}
        className="inline-block text-sm text-violet-600 hover:underline"
      >
        ← Back to Social
      </Link>
    </div>
  )
}
