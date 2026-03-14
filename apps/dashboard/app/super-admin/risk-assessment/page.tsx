'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react'

interface RiskRow {
  tenantId: string
  tenantName: string
  riskScore: number
  riskTier: string
  factors?: Record<string, number>
}

export default function SuperAdminRiskAssessmentPage() {
  const [rows, setRows] = useState<RiskRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/risk-assessment')
      if (res.ok) {
        const json = await res.json()
        setRows(json.data || [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'low': return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'high': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
      case 'blocked': return 'bg-red-500/10 text-red-700 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Assessment</h1>
        <p className="text-muted-foreground">
          Merchant risk scores and underwriting status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Low Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rows.filter((r) => r.riskTier === 'low').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {rows.filter((r) => r.riskTier === 'medium').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {rows.filter((r) => r.riskTier === 'high').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rows.filter((r) => r.riskTier === 'blocked').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Risk Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Risk is derived from onboarding data and KYC status. Use manual override on tenant detail when needed.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No risk data yet. Risk scores are computed from onboarding and KYC; ensure onboarding records exist.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.tenantId}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <Link href={`/super-admin/tenants/${r.tenantId}`} className="font-medium hover:underline">
                      {r.tenantName}
                    </Link>
                    <Badge className={tierColor(r.riskTier)}>{r.riskTier}</Badge>
                    <span className="text-sm text-muted-foreground">Score: {r.riskScore}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/super-admin/tenants/${r.tenantId}`}>View tenant</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
