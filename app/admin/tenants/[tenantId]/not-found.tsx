import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, ArrowLeft } from 'lucide-react'

export default function AdminTenantNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Tenant not found
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This tenant doesn&apos;t exist or you don&apos;t have access to it. Check the ID or go back to the tenants list.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admin/tenants">
            <Button className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All tenants
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full sm:w-auto">
              Admin dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
