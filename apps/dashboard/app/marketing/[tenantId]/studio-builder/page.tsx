import dynamic from 'next/dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

// Builder content is tenant-scoped and database-backed.
// Force runtime rendering to avoid build-time page data collection stalls on Vercel.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MarketingStudioForm = dynamic(() =>
  import('@/components/marketing/MarketingStudioForm').then((m) => ({ default: m.MarketingStudioForm }))
)

export default async function MarketingStudioBuilderPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })
  const brandName = tenant?.name || 'PayAid'

  // Prefer connected channel account branding when available (Meta/LinkedIn/YouTube, etc.).
  const connectedSocial = await prisma.socialMediaAccount.findMany({
    where: { tenantId, isConnected: true },
    select: { id: true, platform: true, accountName: true },
    orderBy: { updatedAt: 'desc' },
  })
  const socialBranding = Object.fromEntries(
    connectedSocial
      .map((a) => [String(a.platform || '').toLowerCase(), a.accountName])
      .filter((x): x is [string, string] => !!x[0] && !!x[1])
  )
  const socialAccounts = connectedSocial
    .map((a) => ({
      id: a.id,
      platform: String(a.platform || '').toLowerCase(),
      accountName: a.accountName,
    }))
    .filter((a) => a.platform && a.accountName)

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Studio</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create AI-assisted copy and media, save to Library, then launch from Campaigns or Social.
          </p>
        </div>
        <Link
          href={`/marketing/${tenantId}/Studio`}
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          Classic studio (segments & analytics)
        </Link>
      </header>
      <MarketingStudioForm
        tenantId={tenantId}
        brandName={brandName}
        socialBranding={socialBranding}
        socialAccounts={socialAccounts}
      />
    </div>
  )
}
