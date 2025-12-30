'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'

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
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, categoryFilter, statusFilter],
    queryFn: async () => {
      const queryString = new URLSearchParams()
      queryString.set('page', page.toString())
      queryString.set('limit', '20')
      if (categoryFilter) queryString.set('category', categoryFilter)
      if (statusFilter) queryString.set('status', statusFilter)
      
      const response = await fetch(`/api/accounting/expenses?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch expenses')
      return response.json()
    },
  })

  const expenses = data?.expenses || []
  const pagination = data?.pagination
  const queryClient = useQueryClient()
  
  const dynamicTitle = getDynamicTitle('Expenses', statusFilter)
  const dynamicDescription = getDynamicDescription('Expenses', statusFilter)

  const categories = [
    'Travel',
    'Office Supplies',
    'Marketing',
    'Utilities',
    'Rent',
    'Salaries',
    'Other',
  ]

  const approveExpense = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounting/expenses/${id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve expense')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const rejectExpense = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/accounting/expenses/${id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejectionReason: reason }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject expense')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      reimbursed: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this expense?')) {
      approveExpense.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      rejectExpense.mutate({ id, reason })
    }
  }

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
        <div className="flex gap-2">
          <Link href="/dashboard/accounting/expenses/reports">
            <Button variant="outline">📊 Reports</Button>
          </Link>
          <Link href="/dashboard/accounting/expenses/new">
            <Button>New Expense</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dynamicTitle}</CardTitle>
              <CardDescription>{dynamicDescription}</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell className="font-medium">
                        {expense.description}
                        {expense.isRecurring && (
                          <span className="ml-2 text-xs text-gray-500">🔄 {expense.recurringFrequency}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.employee ? (
                          <span className="text-sm">{expense.employee.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status}
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
                      <TableCell>
                        {expense.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(expense.id)}
                              disabled={approveExpense.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(expense.id)}
                              disabled={rejectExpense.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              ✗
                            </Button>
                          </div>
                        )}
                        {expense.status === 'approved' && expense.employeeId && (
                          <span className="text-xs text-gray-500">Ready for reimbursement</span>
                        )}
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
