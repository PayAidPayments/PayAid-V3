'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText, User, Building2, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

interface OnboardingDetail {
  id: string
  tenantId: string
  status: string
  kycStatus: string
  riskScore: number | null
  documents: any
  reviewedById: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  notes: string | null
  tenant: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    gstin: string | null
    website: string | null
    createdAt: string
    status: string
  }
  kycDocuments: Array<{
    id: string
    documentType: string
    fileName: string
    verificationStatus: string
    createdAt: string
  }>
}

export default function OnboardingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const [data, setData] = useState<OnboardingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | 'needs_info' | null>(null)
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [riskScore, setRiskScore] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (tenantId) {
      fetchOnboarding()
    }
  }, [tenantId])

  const fetchOnboarding = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/onboarding/${tenantId}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json.data)
      setNotes(json.data.notes || '')
      setRiskScore(json.data.riskScore?.toString() || '')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load onboarding details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!action) return

    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      const body: any = {
        status: action,
        notes,
      }

      if (action === 'reject') {
        body.rejectionReason = rejectionReason
      }

      if (riskScore) {
        body.riskScore = parseFloat(riskScore)
      }

      const res = await fetch(`/api/super-admin/onboarding/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast({
        title: 'Success',
        description: `Onboarding ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked as needs info'}`,
      })

      router.push('/super-admin/onboarding')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update onboarding status',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
      setAction(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_review: { variant: 'secondary' as const, icon: AlertCircle, label: 'Pending Review' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      needs_info: { variant: 'outline' as const, icon: AlertCircle, label: 'Needs Info' },
    }
    const config = variants[status] || { variant: 'secondary' as const, icon: AlertCircle, label: status }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!data) {
    return (
      <div className="p-6">
        <p>Onboarding record not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/super-admin/onboarding">Back to Queue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/onboarding">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.tenant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(data.status)}
              <Badge variant="outline">{data.kycStatus}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Merchant Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Merchant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Merchant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{data.tenant.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">GSTIN</Label>
                  <p className="font-medium">{data.tenant.gstin || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {data.tenant.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {data.tenant.phone || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {data.tenant.address
                      ? `${data.tenant.address}, ${data.tenant.city || ''}, ${data.tenant.state || ''}, ${data.tenant.country || ''}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <p className="font-medium">{data.tenant.website || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(data.tenant.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KYC Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                KYC Documents ({data.kycDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.kycDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : (
                  data.kycDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">{doc.documentType.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doc.verificationStatus === 'verified'
                              ? 'default'
                              : doc.verificationStatus === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {doc.verificationStatus}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/super-admin/kyc-verification/${doc.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review History */}
          {data.reviewedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reviewed At:</span>{' '}
                    {new Date(data.reviewedAt).toLocaleString()}
                  </div>
                  {data.rejectionReason && (
                    <div>
                      <span className="text-muted-foreground">Rejection Reason:</span>{' '}
                      <span className="text-red-600">{data.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Risk Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={riskScore}
                  onChange={(e) => setRiskScore(e.target.value)}
                  placeholder="Enter risk score"
                />
              </div>
              {data.riskScore !== null && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.riskScore < 30
                          ? 'bg-green-500'
                          : data.riskScore < 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${data.riskScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.riskScore < 30
                      ? 'Low Risk'
                      : data.riskScore < 70
                      ? 'Medium Risk'
                      : 'High Risk'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this merchant..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          {data.status === 'pending_review' || data.status === 'needs_info' ? (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {action === null ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => setAction('approve')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Merchant
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setAction('reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Merchant
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setAction('needs_info')}
                      disabled={actionLoading}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request More Info
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {action === 'reject' && (
                      <div>
                        <Label>Rejection Reason *</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this merchant is being rejected..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleAction}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Confirm'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAction(null)
                          setRejectionReason('')
                        }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This merchant has been {data.status}. No further actions available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
