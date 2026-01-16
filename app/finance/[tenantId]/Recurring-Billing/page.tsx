'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoading } from '@/components/ui/loading'
import { 
  RefreshCw, 
  Plus,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface RecurringInvoice {
  id: string
  invoiceNumber: string
  customerName: string | null
  customerEmail: string | null
  total: number
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface DunningAttempt {
  id: string
  invoiceId: string | null
  attemptNumber: number
  status: string
  amount: number
  attemptedAt: string
  invoice: {
    invoiceNumber: string
    customerName: string | null
    total: number
  } | null
}

export default function FinanceRecurringBillingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('invoices')
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([])
  const [dunningAttempts, setDunningAttempts] = useState<DunningAttempt[]>([])

  useEffect(() => {
    fetchData()
  }, [activeTab, token])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'invoices') {
        const res = await fetch('/api/recurring-billing/invoices', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices || [])
        }
      } else if (activeTab === 'dunning') {
        const res = await fetch('/api/recurring-billing/dunning', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setDunningAttempts(data.dunningAttempts || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch('/api/recurring-billing/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      })

      if (res.ok) {
        const data = await res.json()
        alert('Invoice generated successfully!')
        await fetchData()
      } else {
        const error = await res.json()
        alert(error.message || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error)
      alert('Failed to generate invoice')
    }
  }

  const extractFrequency = (notes: string | null): string => {
    if (!notes) return 'Unknown'
    const match = notes.match(/FREQUENCY:(\w+)/)
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Monthly'
  }

  if (loading) {
    return <PageLoading message="Loading recurring billing..." fullScreen={false} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Recurring Billing</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage recurring invoices and payment retries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/finance/${tenantId}/Invoices/New?recurring=true`}>
              <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Recurring Invoice
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={fetchData}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
            <TabsTrigger value="invoices" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Recurring Invoices
            </TabsTrigger>
            <TabsTrigger value="dunning" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Dunning Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            {invoices.length === 0 ? (
              <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
                <CardContent>
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Recurring Invoices</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first recurring invoice template to automate billing
                  </p>
                  <Link href={`/finance/${tenantId}/Invoices/New?recurring=true`}>
                    <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Recurring Invoice
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {invoice.invoiceNumber}
                            </h3>
                            <Badge
                              variant={invoice.status === 'paid' ? 'default' : invoice.status === 'draft' ? 'secondary' : 'destructive'}
                              className={
                                invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : invoice.status === 'draft'
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  : ''
                              }
                            >
                              {invoice.status}
                            </Badge>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              {extractFrequency(invoice.notes)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {invoice.customerName && (
                              <div>Customer: {invoice.customerName}</div>
                            )}
                            {invoice.customerEmail && (
                              <div>Email: {invoice.customerEmail}</div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                ₹{invoice.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInvoice(invoice.id)}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Generate Now
                          </Button>
                          <Link href={`/finance/${tenantId}/Invoices/${invoice.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dunning" className="space-y-6">
            {dunningAttempts.length === 0 ? (
              <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
                <CardContent>
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Dunning Attempts</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All payments are up to date
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {dunningAttempts.map((attempt) => (
                  <Card key={attempt.id} className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              Attempt #{attempt.attemptNumber}
                            </h3>
                            <Badge
                              variant={
                                attempt.status === 'success'
                                  ? 'default'
                                  : attempt.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className={
                                attempt.status === 'success'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : attempt.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }
                            >
                              {attempt.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {attempt.invoice && (
                              <>
                                <div>Invoice: {attempt.invoice.invoiceNumber}</div>
                                <div>Customer: {attempt.invoice.customerName || 'N/A'}</div>
                              </>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                ₹{Number(attempt.amount).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(attempt.attemptedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
