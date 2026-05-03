'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface LeaveBalance {
  leaveType: {
    id: string
    name: string
    code: string
    isPaid: boolean
  }
  balance: number
  asOfDate?: string
  policy?: {
    accrualType: string
    accrualAmount: number
    maxBalance: number
    carryForwardLimit: number
  }
}

export default function LeaveBalancesPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: employees } = useQuery<{ employees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const { data: balanceData, isLoading } = useQuery<{ balances: LeaveBalance[] }>({
    queryKey: ['leave-balances', selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null
      const response = await fetch(`/api/hr/leave/balances?employeeId=${selectedEmployeeId}`)
      if (!response.ok) throw new Error('Failed to fetch leave balances')
      return response.json()
    },
    enabled: !!selectedEmployeeId,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Balances</h1>
          <p className="mt-2 text-gray-600">View leave balances for employees</p>
        </div>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 px-3"
        >
          <option value="">Select Employee</option>
          {employees?.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.employeeCode} - {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      </div>

      {!selectedEmployeeId ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>Please select an employee to view leave balances</p>
          </CardContent>
        </Card>
      ) : balanceData && balanceData.balances.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
            <CardDescription>
              Current leave balances as of{' '}
              {balanceData.balances[0]?.asOfDate
                ? new Date(balanceData.balances[0].asOfDate).toLocaleDateString()
                : 'today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Accrual</TableHead>
                  <TableHead>Max Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceData.balances.map((balance) => (
                  <TableRow key={balance.leaveType.id}>
                    <TableCell className="font-medium">
                      {balance.leaveType.name}
                      {balance.leaveType.code && (
                        <span className="text-gray-500 ml-2">({balance.leaveType.code})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          balance.leaveType.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {balance.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {balance.balance} days
                    </TableCell>
                    <TableCell>
                      {balance.policy ? (
                        <div className="text-sm">
                          {balance.policy.accrualType === 'MONTHLY'
                            ? `${balance.policy.accrualAmount} days/month`
                            : balance.policy.accrualType === 'YEARLY'
                            ? `${balance.policy.accrualAmount} days/year`
                            : 'Manual'}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {balance.policy?.maxBalance ? `${balance.policy.maxBalance} days` : 'No limit'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No leave balances found for this employee</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
