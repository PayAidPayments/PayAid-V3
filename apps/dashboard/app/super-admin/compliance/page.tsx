'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, FileCheck, Lock } from 'lucide-react'

interface ComplianceSummary {
  pciDss: number
  kycAml: number
  dataRetention: number
  totalTenants: number
}

export default function SuperAdminCompliancePage() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/compliance')
      if (res.ok) {
        const json = await res.json()
        setSummary(json.data || null)
      } else setSummary(null)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Management</h1>
        <p className="text-muted-foreground">
          PCI-DSS, KYC/AML, and data retention compliance overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4" /> PCI-DSS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {summary?.pciDss ?? 0} <span className="text-sm font-normal text-muted-foreground">compliant</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileCheck className="h-4 w-4" /> KYC/AML
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {summary?.kycAml ?? 0} <span className="text-sm font-normal text-muted-foreground">verified</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="h-4 w-4" /> Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {summary?.dataRetention ?? 0} <span className="text-sm font-normal text-muted-foreground">in policy</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Export compliance status for audits. Tenant-level records are in ComplianceRecord; use Reports for full export.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Link href="/super-admin/kyc-verification">
              <Badge variant="secondary" className="cursor-pointer hover:bg-muted">KYC Verification Queue</Badge>
            </Link>
            <Link href="/super-admin/reports">
              <Badge variant="secondary" className="cursor-pointer hover:bg-muted">Reports & Exports</Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
