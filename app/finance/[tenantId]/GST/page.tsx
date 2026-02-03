'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, Scale, Calendar, Info } from 'lucide-react'

export default function FinanceGSTPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const moduleConfig = getModuleConfig('finance')

  const heroMetrics = [
    {
      label: 'GSTR-1',
      value: 'Sales Register',
      icon: FileText,
      href: `/finance/${tenantId}/GST/GSTR-1`,
    },
    {
      label: 'GSTR-3B',
      value: 'Summary Return',
      icon: Scale,
      href: `/finance/${tenantId}/GST/GSTR-3B`,
    },
    {
      label: 'Filing Due',
      value: '11th & 20th',
      icon: Calendar,
      href: '#',
    },
    {
      label: 'Portal',
      value: 'GST.gov.in',
      icon: Info,
      href: 'https://www.gst.gov.in',
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="GST Reports"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">GSTR-1</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sales Register - Outward Supplies</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Detailed report of all outward supplies (sales) made during the month. Required for
                monthly GST filing.
              </p>
              <Link href={`/finance/${tenantId}/GST/GSTR-1`}>
                <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                  View GSTR-1
                </Button>
              </Link>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">GSTR-3B</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Summary Return - Monthly GST Filing</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Monthly summary return showing outward supplies, inward supplies, input tax credit,
                and net GST payable.
              </p>
              <Link href={`/finance/${tenantId}/GST/GSTR-3B`}>
                <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                  View GSTR-3B
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">GST Filing Guide</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>GSTR-1:</strong> File by 11th of the following month. Contains details of all
              outward supplies (sales invoices).
            </p>
            <p>
              <strong>GSTR-3B:</strong> File by 20th of the following month. Contains summary of
              outward supplies, inward supplies, and net GST payable.
            </p>
            <p>
              <strong>Filing Portal:</strong> Visit{' '}
              <a
                href="https://www.gst.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                www.gst.gov.in
              </a>{' '}
              to file your returns.
            </p>
          </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
