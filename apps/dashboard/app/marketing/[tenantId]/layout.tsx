import { getMarketingTopBarItems } from '@/lib/marketing/marketing-top-bar-items'
import Link from 'next/link'
import { Megaphone } from 'lucide-react'

interface MarketingLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantId: string }>
}

export default async function MarketingTenantLayout({ children, params }: MarketingLayoutProps) {
  const { tenantId } = await params
  const items = getMarketingTopBarItems(tenantId)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Module top bar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 flex h-11 items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="flex items-center gap-1.5 mr-3 shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Marketing
            </span>
          </span>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
