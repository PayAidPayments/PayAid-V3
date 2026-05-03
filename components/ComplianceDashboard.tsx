'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Eye, 
  EyeOff,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Building2,
  Users,
  Receipt
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

interface AuditLog {
  id: string
  action: string
  dataType: string
  tenantId: string
  userId: string
  context: string
  metadata: Record<string, any>
  timestamp: string
}

interface PIIDetection {
  detected: boolean
  type: 'email' | 'phone' | 'pan' | 'credit_card' | 'aadhaar' | 'ssn' | null
  original: string
  masked: string
  confidence: number
}

export function ComplianceDashboard() {
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('audit')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [piiTestText, setPiiTestText] = useState('')
  const [piiResult, setPiiResult] = useState<{
    containsPII: boolean
    detections: PIIDetection[]
    masked?: string
  } | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    dataType: '',
  })

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab, filters])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.action) params.append('action', filters.action)
      if (filters.dataType) params.append('dataType', filters.dataType)
      params.append('limit', '100')

      const response = await fetch(`/api/compliance/audit-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      if (data.success) {
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const testPII = async () => {
    if (!piiTestText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/compliance/pii-mask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: piiTestText }),
      })

      if (!response.ok) {
        throw new Error('Failed to test PII')
      }

      const data = await response.json()
      if (data.success) {
        setPiiResult({
          containsPII: data.containsPII,
          detections: data.detections || [],
          masked: data.masked,
        })
      }
    } catch (error) {
      console.error('Failed to test PII:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('approval') || action.includes('access')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    if (action.includes('pii') || action.includes('mask')) {
      return 'bg-red-100 text-red-800'
    }
    if (action.includes('decision') || action.includes('execute')) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getPIITypeBadgeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      email: 'bg-blue-100 text-blue-800',
      phone: 'bg-green-100 text-green-800',
      pan: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-red-100 text-red-800',
      aadhaar: 'bg-orange-100 text-orange-800',
      ssn: 'bg-pink-100 text-pink-800',
    }
    return colors[type || ''] || 'bg-gray-100 text-gray-800'
  }

  // Calculate statistics
  const totalLogs = auditLogs.length
  const piiAccessLogs = auditLogs.filter((log) => log.action.includes('pii')).length
  const dataAccessLogs = auditLogs.filter((log) => log.action.includes('data_access')).length
  const aiDecisionLogs = auditLogs.filter((log) => log.action.includes('ai_decision')).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audit Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {totalLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PII Access</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {piiAccessLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Access</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {dataAccessLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Decisions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {aiDecisionLogs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="pii">PII Detection</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR Deletion</TabsTrigger>
          <TabsTrigger value="india">India Compliance</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>All compliance and security events</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Action</label>
                  <input
                    type="text"
                    placeholder="Filter by action"
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Type</label>
                  <input
                    type="text"
                    placeholder="Filter by data type"
                    value={filters.dataType}
                    onChange={(e) => setFilters({ ...filters, dataType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              {/* Audit Logs List */}
              {loading ? (
                <DashboardLoading message="Loading audit logs..." />
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getActionBadgeColor(log.action)}>
                              {log.action}
                            </Badge>
                            <Badge variant="outline">{log.dataType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{log.context}</p>
                          {Object.keys(log.metadata || {}).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">
                                View metadata
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PII Detection Tab */}
        <TabsContent value="pii" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PII Detection & Masking</CardTitle>
              <CardDescription>Test and detect personally identifiable information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Enter text to test:</label>
                <textarea
                  value={piiTestText}
                  onChange={(e) => setPiiTestText(e.target.value)}
                  placeholder="Enter text containing email, phone, PAN, credit card, etc."
                  className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                />
              </div>

              <Button onClick={testPII} disabled={!piiTestText.trim() || loading}>
                <Search className="h-4 w-4 mr-2" />
                Detect PII
              </Button>

              {piiResult && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border ${
                      piiResult.containsPII
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {piiResult.containsPII ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold">
                        {piiResult.containsPII
                          ? 'PII Detected'
                          : 'No PII Detected'}
                      </span>
                    </div>
                    {piiResult.containsPII && (
                      <p className="text-sm text-gray-700">
                        Found {piiResult.detections.length} PII instance(s)
                      </p>
                    )}
                  </div>

                  {piiResult.detections.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Detected PII:</h4>
                      <div className="space-y-2">
                        {piiResult.detections.map((detection, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPIITypeBadgeColor(detection.type)}>
                                {detection.type?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Confidence: {(detection.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Original:</span>
                                <p className="text-gray-700">{detection.original}</p>
                              </div>
                              <div>
                                <span className="font-medium">Masked:</span>
                                <p className="text-gray-700">{detection.masked}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {piiResult.masked && (
                    <div>
                      <h4 className="font-semibold mb-2">Masked Text:</h4>
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{piiResult.masked}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR Deletion Tab */}
        <TabsContent value="gdpr" className="space-y-4">
          <GDPRDeletionTab token={token} />
        </TabsContent>

        {/* India Compliance Tab */}
        <TabsContent value="india" className="space-y-4">
          <IndiaComplianceTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// GDPR Deletion Component
function GDPRDeletionTab({ token }: { token: string | null }) {
  const [entityType, setEntityType] = useState<'customer' | 'contact' | 'employee' | 'invoice' | 'all'>('customer')
  const [entityId, setEntityId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; deletedRecords?: number } | null>(null)

  const handleDeletion = async () => {
    if (!token) return

    if (entityType !== 'all' && !entityId) {
      setResult({ success: false, message: 'Entity ID is required for specific deletions' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/compliance/gdpr/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId: entityId || undefined,
          reason,
        }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.message,
        deletedRecords: data.deletedRecords,
      })
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to process deletion: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          GDPR Data Deletion (Right to be Forgotten)
        </CardTitle>
        <CardDescription>
          Request deletion of personal data per GDPR Article 17
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="customer">Customer/Contact</option>
            <option value="employee">Employee</option>
            <option value="invoice">Invoice</option>
            <option value="all">All User Data</option>
          </select>
        </div>

        {entityType !== 'all' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Entity ID (Optional for bulk deletion)</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Enter entity ID to delete specific record"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Reason for Deletion</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: Provide reason for data deletion request"
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleDeletion}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? 'Processing...' : 'Request Data Deletion'}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {result.success ? 'Deletion Successful' : 'Deletion Failed'}
              </span>
            </div>
            <p className="text-sm text-gray-700">{result.message}</p>
            {result.deletedRecords !== undefined && (
              <p className="text-sm text-gray-600 mt-1">
                Deleted {result.deletedRecords} record(s)
              </p>
            )}
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <strong>⚠️ Important:</strong> Data deletion requests are logged and processed according to GDPR
          requirements. Soft deletion is performed immediately, with hard deletion scheduled after the retention
          period.
        </div>
      </CardContent>
    </Card>
  )
}

// India Compliance Component
function IndiaComplianceTab({ token }: { token: string | null }) {
  const [gstCompliance, setGstCompliance] = useState<any>(null)
  const [laborCompliance, setLaborCompliance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'gst' | 'labor'>('gst')

  useEffect(() => {
    if (token) {
      fetchGSTCompliance()
      fetchLaborCompliance()
    }
  }, [token])

  const fetchGSTCompliance = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch('/api/compliance/india/gst', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setGstCompliance(data.compliance)
        }
      }
    } catch (error) {
      console.error('Failed to fetch GST compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLaborCompliance = async () => {
    if (!token) return
    try {
      const response = await fetch('/api/compliance/india/labor', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLaborCompliance(data.compliance)
        }
      }
    } catch (error) {
      console.error('Failed to fetch labor compliance:', error)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'compliant' || status === 'filed') return 'bg-green-100 text-green-800'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'gst' | 'labor')}>
        <TabsList>
          <TabsTrigger value="gst">GST Compliance</TabsTrigger>
          <TabsTrigger value="labor">Labor Law Compliance</TabsTrigger>
        </TabsList>

        {/* GST Compliance */}
        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                GST Compliance Status
              </CardTitle>
              <CardDescription>GST filing status and tax liability tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DashboardLoading message="Loading GST compliance..." />
              ) : !gstCompliance ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">GSTIN not configured for this tenant</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please configure GSTIN in tenant settings to enable GST compliance tracking
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">GSTIN</p>
                      <p className="font-semibold">{gstCompliance.gstin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Filing Status</p>
                      <Badge className={getStatusColor(gstCompliance.filingStatus)}>
                        {gstCompliance.filingStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tax Liability</p>
                      <p className="font-semibold">₹{gstCompliance.taxLiability.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Output Tax</p>
                      <p className="font-semibold">₹{gstCompliance.outputTax.toLocaleString()}</p>
                    </div>
                  </div>
                  {gstCompliance.nextFilingDate && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Next Filing Date:</strong>{' '}
                        {format(new Date(gstCompliance.nextFilingDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labor Law Compliance */}
        <TabsContent value="labor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Labor Law Compliance
              </CardTitle>
              <CardDescription>PF, ESI, and labor contract compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DashboardLoading message="Loading labor compliance..." />
              ) : !laborCompliance ? (
                <div className="text-center py-8">
                  <DashboardLoading message="Loading..." />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* PF Compliance */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Provident Fund (PF) Compliance</h4>
                      <Badge className={getStatusColor(laborCompliance.pfCompliance.status)}>
                        {laborCompliance.pfCompliance.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Employee Count</p>
                        <p className="font-semibold">{laborCompliance.pfCompliance.employeeCount}</p>
                      </div>
                      {laborCompliance.pfCompliance.nextContributionDate && (
                        <div>
                          <p className="text-gray-600">Next Contribution</p>
                          <p className="font-semibold">
                            {format(new Date(laborCompliance.pfCompliance.nextContributionDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    {laborCompliance.pfCompliance.employeeCount >= 20 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ PF is mandatory for companies with 20+ employees
                      </p>
                    )}
                  </div>

                  {/* ESI Compliance */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Employee State Insurance (ESI)</h4>
                      <Badge className={getStatusColor(laborCompliance.esiCompliance.status)}>
                        {laborCompliance.esiCompliance.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Employee Count</p>
                        <p className="font-semibold">{laborCompliance.esiCompliance.employeeCount}</p>
                      </div>
                      {laborCompliance.esiCompliance.nextContributionDate && (
                        <div>
                          <p className="text-gray-600">Next Contribution</p>
                          <p className="font-semibold">
                            {format(new Date(laborCompliance.esiCompliance.nextContributionDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    {laborCompliance.esiCompliance.employeeCount >= 10 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ ESI is mandatory for companies with 10+ employees (in some states)
                      </p>
                    )}
                  </div>

                  {/* Labor Contract Compliance */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Labor Contract Compliance</h4>
                      <Badge className={getStatusColor(laborCompliance.laborContractCompliance.status)}>
                        {laborCompliance.laborContractCompliance.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Contracts Signed</p>
                        <p className="font-semibold">{laborCompliance.laborContractCompliance.contractsSigned}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contracts Pending</p>
                        <p className="font-semibold text-red-600">
                          {laborCompliance.laborContractCompliance.contractsPending}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
