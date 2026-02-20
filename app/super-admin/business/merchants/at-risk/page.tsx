'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, Ban, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface AtRiskMerchant {
  id: string
  name: string
  email: string | null
  status: string
  riskScore: number
  riskFactors: string[]
  lastLoginAt: string | null
  failedPayments: number
  chargebacks: number
  kycIssues: number
  newLocationLogins: number
}

export default function AtRiskMerchantsPage() {
  const [merchants, setMerchants] = useState<AtRiskMerchant[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAtRiskMerchants()
  }, [])

  const fetchAtRiskMerchants = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/merchants/at-risk')
      if (res.ok) {
        const json = await res.json()
        setMerchants(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch at-risk merchants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTagMerchant = async (merchantId: string, tag: 'monitor' | 'freeze') => {
    try {
      const res = await fetch(`/api/super-admin/merchants/${merchantId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Merchant tagged as "${tag}"`,
        })
        fetchAtRiskMerchants()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to tag merchant',
        variant: 'destructive',
      })
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">At-Risk Merchants</h1>
        <p className="text-muted-foreground">
          Merchants with risk signals requiring attention
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {merchants.filter((m) => m.riskScore >= 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {merchants.filter((m) => m.riskScore >= 60 && m.riskScore < 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {merchants.filter((m) => m.riskScore < 60).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk-Scored Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Factors</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No at-risk merchants found
                    </TableCell>
                  </TableRow>
                ) : (
                  merchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{merchant.name}</div>
                          {merchant.email && (
                            <div className="text-sm text-muted-foreground">{merchant.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(merchant.riskScore)}>
                          {merchant.riskScore}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {merchant.riskFactors.slice(0, 3).map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                          {merchant.riskFactors.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{merchant.riskFactors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {merchant.failedPayments > 0 && (
                            <div className="text-red-600">Failed payments: {merchant.failedPayments}</div>
                          )}
                          {merchant.chargebacks > 0 && (
                            <div className="text-red-600">Chargebacks: {merchant.chargebacks}</div>
                          )}
                          {merchant.kycIssues > 0 && (
                            <div className="text-orange-600">KYC issues: {merchant.kycIssues}</div>
                          )}
                          {merchant.newLocationLogins > 0 && (
                            <div className="text-yellow-600">New locations: {merchant.newLocationLogins}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {merchant.lastLoginAt
                          ? new Date(merchant.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/super-admin/business/tenants/${merchant.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTagMerchant(merchant.id, 'monitor')}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTagMerchant(merchant.id, 'freeze')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
