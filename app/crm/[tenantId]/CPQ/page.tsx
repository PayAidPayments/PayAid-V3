'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calculator, 
  Plus, 
  FileText, 
  Download,
  Send,
  Settings,
  Package,
  DollarSign,
  Percent
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

interface Product {
  id: string
  name: string
  description: string
  basePrice: number
  unit: string
  category: string
  discounts?: {
    quantity: number
    percentage: number
  }[]
}

interface QuoteItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

interface Quote {
  id: string
  name: string
  contactId?: string
  contactName?: string
  items: QuoteItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  validUntil: string
  createdAt: string
}

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [newQuote, setNewQuote] = useState({
    name: '',
    contactId: '',
    items: [] as QuoteItem[],
  })

  useEffect(() => {
    fetchData()
  }, [tenantId, token])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!token) return

      const [quotesRes, productsRes] = await Promise.all([
        fetch('/api/crm/cpq/quotes', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/crm/cpq/products', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (quotesRes.ok) {
        const data = await quotesRes.json()
        setQuotes(data.quotes || [])
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateQuoteTotal = (items: QuoteItem[], discount: number = 0, taxRate: number = 18) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = (subtotal * discount) / 100
    const afterDiscount = subtotal - discountAmount
    const tax = (afterDiscount * taxRate) / 100
    const total = afterDiscount + tax

    return { subtotal, discountAmount, tax, total }
  }

  if (loading) {
    return <PageLoading message="Loading CPQ..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configure-Price-Quote (CPQ)</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create complex quotes with product configurations, pricing rules, and discounts
          </p>
        </div>
        <Button
          onClick={() => setShowCreateQuote(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {quotes.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {quotes.filter(q => q.status === 'sent').length}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {quotes.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ₹{quotes.reduce((sum, q) => sum + q.total, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
          <CardDescription>Manage your configured quotes and proposals</CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{quote.name}</h3>
                        <Badge
                          className={
                            quote.status === 'accepted'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : quote.status === 'sent'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }
                        >
                          {quote.status}
                        </Badge>
                      </div>
                      {quote.contactName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          For: {quote.contactName}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Items</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {quote.items.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Subtotal</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹{quote.subtotal.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Tax</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹{quote.tax.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Total</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹{quote.total.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No quotes created yet. Create your first configured quote.
              </p>
              <Button
                onClick={() => setShowCreateQuote(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Quote
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quote Modal */}
      {showCreateQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Configured Quote</CardTitle>
              <CardDescription>Build a quote with product configurations and pricing rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quote Name
                </label>
                <Input
                  value={newQuote.name}
                  onChange={(e) => setNewQuote({ ...newQuote, name: e.target.value })}
                  placeholder="e.g., Enterprise Package Quote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Products
                </label>
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₹{product.basePrice.toLocaleString('en-IN')} / {product.unit}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const existingItem = newQuote.items.find(i => i.productId === product.id)
                          if (existingItem) {
                            setNewQuote({
                              ...newQuote,
                              items: newQuote.items.map(i =>
                                i.productId === product.id
                                  ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
                                  : i
                              ),
                            })
                          } else {
                            setNewQuote({
                              ...newQuote,
                              items: [
                                ...newQuote.items,
                                {
                                  productId: product.id,
                                  productName: product.name,
                                  quantity: 1,
                                  unitPrice: product.basePrice,
                                  discount: 0,
                                  subtotal: product.basePrice,
                                },
                              ],
                            })
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {newQuote.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote Items
                  </label>
                  <div className="space-y-2">
                    {newQuote.items.map((item, idx) => {
                      const totals = calculateQuoteTotal(newQuote.items, 0, 18)
                      return (
                        <div
                          key={idx}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                ₹{item.subtotal.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateQuoteTotal(newQuote.items, 0, 18).subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Tax (18%):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateQuoteTotal(newQuote.items, 0, 18).tax.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-700">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total:</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ₹{calculateQuoteTotal(newQuote.items, 0, 18).total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateQuote(false)
                    setNewQuote({ name: '', contactId: '', items: [] })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle quote creation
                    setShowCreateQuote(false)
                    setNewQuote({ name: '', contactId: '', items: [] })
                    fetchData()
                  }}
                  disabled={!newQuote.name.trim() || newQuote.items.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
