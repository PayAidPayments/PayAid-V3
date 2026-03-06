'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { Button } from '@/components/ui/button'
import { FileText, Scale, Percent, Calendar, Info } from 'lucide-react'
import { getModuleConfig } from '@/lib/modules/module-config'
import { cn } from '@/lib/utils/cn'

const TABS = [
  { id: 'gstr1', label: 'GSTR-1', href: 'GSTR-1', description: 'Outward supplies (sales register)' },
  { id: 'gstr3b', label: 'GSTR-3B', href: 'GSTR-3B', description: 'Monthly summary return' },
  { id: 'tds', label: 'TDS', href: 'TDS', description: 'Tax deducted at source' },
] as const

export default function FinanceTaxPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId as string
  const tab = (searchParams.get('tab') as 'gstr1' | 'gstr3b' | 'tds') || 'gstr1'
  const moduleConfig = getModuleConfig('finance')

  const baseGst = `/finance/${tenantId}/GST`
  const baseTds = `/finance/${tenantId}/TDS`

  const heroMetrics = [
    { label: 'GSTR-1', value: 'Sales', icon: <FileText className="w-5 h-5" />, href: `${baseGst}/GSTR-1` },
    { label: 'GSTR-3B', value: 'Summary', icon: <Scale className="w-5 h-5" />, href: `${baseGst}/GSTR-3B` },
    { label: 'TDS', value: 'Deductions', icon: <Percent className="w-5 h-5" />, href: baseTds },
    { label: 'Portal', value: 'GST.gov.in', icon: <Info className="w-5 h-5" />, href: 'https://www.gst.gov.in' },
  ]

  if (!moduleConfig) return <div>Module configuration not found</div>

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="GST & TDS"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />
      <div className="p-6 space-y-6">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <Link href={`/finance/${tenantId}/Tax?tab=gstr1`}>
            <button className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'gstr1' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200')}>
              GSTR-1
            </button>
          </Link>
          <Link href={`/finance/${tenantId}/Tax?tab=gstr3b`}>
            <button className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'gstr3b' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200')}>
              GSTR-3B
            </button>
          </Link>
          <Link href={`/finance/${tenantId}/Tax?tab=tds`}>
            <button className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'tds' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200')}>
              TDS
            </button>
          </Link>
        </div>
        <GlassCard>
          <div className="p-6">
            {tab === 'gstr1' && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">GSTR-1 — Outward supplies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Detailed report of all outward supplies (sales). File by 11th of the following month.</p>
                <Link href={`${baseGst}/GSTR-1`}><Button>View GSTR-1</Button></Link>
              </>
            )}
            {tab === 'gstr3b' && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">GSTR-3B — Summary return</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Monthly summary: outward supplies, ITC, net GST payable. File by 20th.</p>
                <Link href={`${baseGst}/GSTR-3B`}><Button>View GSTR-3B</Button></Link>
              </>
            )}
            {tab === 'tds' && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">TDS — Tax deducted at source</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Track TDS deducted on payments and filing due dates.</p>
                <Link href={baseTds}><Button>View TDS</Button></Link>
              </>
            )}
          </div>
        </GlassCard>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>GSTR-1: 11th · GSTR-3B: 20th of following month. File at <a href="https://www.gst.gov.in" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">gst.gov.in</a></span>
        </div>
      </div>
    </div>
  )
}
