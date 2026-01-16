'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useContacts } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { StageBadge } from '@/components/crm/StageBadge'

export default function CRMAccountsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  // Accounts page shows customers - use stage filter instead of type
  const { data, isLoading } = useContacts({ page, limit: 20, search, stage: 'customer' })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const accounts = data?.contacts || []
  const pagination = data?.pagination

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar - Zoho Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">CRM</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/crm/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href={`/crm/${tenantId}/Leads`} className="text-gray-600 hover:text-gray-900">Leads</Link>
              <Link href={`/crm/${tenantId}/Contacts`} className="text-gray-600 hover:text-gray-900">Contacts</Link>
              <Link href={`/crm/${tenantId}/Accounts`} className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">Accounts</Link>
              <Link href={`/crm/${tenantId}/Deals`} className="text-gray-600 hover:text-gray-900">Deals</Link>
              <Link href={`/crm/${tenantId}/Tasks`} className="text-gray-600 hover:text-gray-900">Tasks</Link>
              <Link href={`/crm/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900">Reports</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            <p className="mt-2 text-gray-600">Manage your customer accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/crm/${tenantId}/Contacts/new`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">New Account</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
            <CardDescription>View and manage all your customer accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No accounts found</p>
                <Link href={`/crm/${tenantId}/Contacts/new`}>
                  <Button>Create Your First Account</Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Link href={`/crm/${tenantId}/Contacts/${account.id}`} className="font-medium text-blue-600 hover:underline">
                            {account.company || account.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StageBadge 
                            stage={account.stage || (account.type === 'customer' ? 'customer' : account.type === 'lead' ? 'prospect' : 'contact')} 
                          />
                        </TableCell>
                        <TableCell>{account.email || '-'}</TableCell>
                        <TableCell>{account.phone || '-'}</TableCell>
                        <TableCell>{account.city || '-'}</TableCell>
                        <TableCell>
                          {account.createdAt ? format(new Date(account.createdAt), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Link href={`/crm/${tenantId}/Contacts/${account.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} accounts
                    </p>
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
    </div>
  )
}

