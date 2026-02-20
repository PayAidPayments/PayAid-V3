'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, ChevronRight } from 'lucide-react'

interface AppRecord {
  id: string
  tenantId: string
  status: string
  tenant: { id: string; name: string; email: string | null; createdAt: string }
  kycDocuments: Array<{ id: string; documentType: string; verificationStatus: string }>
}

export default function SuperAdminApplicationsPage() {
  const [records, setRecords] = useState<AppRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/onboarding?status=pending_review')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setRecords(json.data || [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Merchant Applications</h1>
        <p className="text-muted-foreground">
          New signups awaiting approval
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Pending Review ({records.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and approve or reject from the onboarding detail page.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2">No pending applications.</p>
              <p className="text-sm">
                New tenant signups will appear here when they start onboarding.
                <Link href="/super-admin/onboarding" className="ml-2 hover:underline">View full onboarding queue</Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <Link
                  key={r.id}
                  href={`/super-admin/onboarding/${r.tenantId}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{r.tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{r.tenant.email || '—'}</p>
                    </div>
                    <Badge variant="secondary">{r.kycDocuments.length} doc(s)</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/super-admin/onboarding" className="hover:underline">Full Onboarding Queue</Link>
        {' · '}
        <Link href="/super-admin/kyc-verification" className="hover:underline">KYC Verification</Link>
      </p>
    </div>
  )
}
