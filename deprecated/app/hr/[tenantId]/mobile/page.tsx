'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, FileText, Receipt, Home, Smartphone } from 'lucide-react'

/**
 * HR Mobile Hub – PWA-friendly entry for leave, attendance, payslips, reimbursements.
 * Linked from HR dashboard and can be the start_url for mobile installs.
 */
export default function HRMobileHubPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const actions = [
    { href: `/hr/${tenantId}/Leave/Apply`, label: 'Apply for Leave', icon: Calendar, description: 'Submit leave request' },
    { href: `/hr/${tenantId}/Attendance/Mark`, label: 'Mark Attendance', icon: Clock, description: 'Check in / out' },
    { href: `/hr/${tenantId}/Payslips`, label: 'Payslips', icon: FileText, description: 'View and download' },
    { href: `/hr/${tenantId}/Reimbursements/new`, label: 'Reimbursement', icon: Receipt, description: 'Submit claim' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-8 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Smartphone className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">HR on the go</h1>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Quick access to leave, attendance, payslips, and reimbursements. Install this app for offline-ready access.
      </p>

      <div className="space-y-3">
        {actions.map(({ href, label, icon: Icon, description }) => (
          <Link key={href} href={href}>
            <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link href={`/hr/${tenantId}/Home`}>
          <Button variant="outline" className="w-full gap-2 border-slate-200 dark:border-slate-700" size="lg">
            <Home className="h-4 w-4" />
            Back to HR dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
