'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface WholesaleCustomer {
  id: string
  customerName: string
  customerType: string
  phone?: string
  email?: string
  address?: string
  gstin?: string
  creditLimit?: number
  paymentTerms?: string
  status: string
  pricings: any[]
  creditLimits: any[]
}

export default function WholesaleCustomersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [customerType, setCustomerType] = useState<string>('all')

  const { data, isLoading } = useQuery<{ customers: WholesaleCustomer[] }>({
    queryKey: ['wholesale-customers', selectedStatus, customerType],
    queryFn: async () => {
      let url = '/api/industries/wholesale/customers'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (customerType !== 'all') params.append('customerType', customerType)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch customers')
      return response.json()
    },
  })

  const customers = data?.customers || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wholesale Customers</h1>
        <p className="mt-2 text-gray-600">Manage wholesale and distribution customers</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            <option value="WHOLESALER">Wholesaler</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="STOCKIST">Stockist</option>
            <option value="RETAILER">Retailer</option>
          </select>
        </CardContent>
      </Card>

      {/* Customers List */}
      {isLoading ? (
        <div className="text-center py-8">Loading customers...</div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No customers found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>{customer.customerName}</CardTitle>
                <CardDescription>
                  Type: {customer.customerType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                  {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
                  {customer.gstin && <p><strong>GSTIN:</strong> {customer.gstin}</p>}
                  {customer.creditLimit && <p><strong>Credit Limit:</strong> ₹{customer.creditLimit.toLocaleString()}</p>}
                  {customer.paymentTerms && <p><strong>Payment Terms:</strong> {customer.paymentTerms}</p>}
                  <p><strong>Pricing Tiers:</strong> {customer.pricings.length}</p>
                  <p><strong>Credit Limits:</strong> {customer.creditLimits.length}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

