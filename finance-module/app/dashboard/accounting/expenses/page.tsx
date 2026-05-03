'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, categoryFilter],
    queryFn: async () => {
      const queryString = new URLSearchParams()
      queryString.set('page', page.toString())
      queryString.set('limit', '20')
      if (categoryFilter) queryString.set('category', categoryFilter)
      
      const response = await fetch(`/api/accounting/expenses?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch expenses')
      return response.json()
    },
  })

  const expenses = data?.expenses || []
  const pagination = data?.pagination

  const categories = [
    'Travel',
    'Office Supplies',
    'Marketing',
    'Utilities',
    'Rent',
    'Salaries',
    'Other',
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">Track and manage business expenses</p>
        </div>
        <Link href="/dashboard/accounting/expenses/new">
          <Button>New Expense</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>View and manage all your expenses</CardDescription>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No expenses found</p>
              <Link href="/dashboard/accounting/expenses/new">
                <Button>Create Your First Expense</Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                Note: Expense tracking requires Expense model in database schema
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.date
                          ? format(new Date(expense.date), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell>{expense.vendor || '-'}</TableCell>
                      <TableCell className="text-right">
                        ₹{expense.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense.gstAmount
                          ? `₹${expense.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{((expense.amount || 0) + (expense.gstAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
