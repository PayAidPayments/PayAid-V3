'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

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

export default function HRLeaveBalancesPage() {
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
    return <PageLoading message="Loading leave balances..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leave Balances</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View leave balances for employees</p>
        </div>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
        >
          <option value="">Select Employee</option>
          {employees?.employees && Array.isArray(employees.employees) ? employees.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.employeeCode} - {emp.firstName} {emp.lastName}
            </option>
          )) : null}
        </select>
      </div>

      {!selectedEmployeeId ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>Please select an employee to view leave balances</p>
          </CardContent>
        </Card>
      ) : balanceData && balanceData.balances && Array.isArray(balanceData.balances) && balanceData.balances.length > 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Leave Balances</CardTitle>
            <CardDescription className="dark:text-gray-400">
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
                  <TableHead className="dark:text-gray-300">Leave Type</TableHead>
                  <TableHead className="dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Balance</TableHead>
                  <TableHead className="dark:text-gray-300">Accrual</TableHead>
                  <TableHead className="dark:text-gray-300">Max Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(balanceData.balances || []).map((balance, index) => (
                  <TableRow key={index} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-gray-100">{balance.leaveType.name}</TableCell>
                    <TableCell>
                      <Badge variant={balance.leaveType.isPaid ? 'default' : 'secondary'} className="dark:bg-gray-700 dark:text-gray-200">
                        {balance.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold dark:text-gray-100">{balance.balance} days</TableCell>
                    <TableCell className="dark:text-gray-300">
                      {balance.policy ? (
                        <div className="text-sm">
                          <div>{balance.policy.accrualType}</div>
                          {balance.policy.accrualAmount > 0 && (
                            <div className="text-gray-500 dark:text-gray-400">{balance.policy.accrualAmount} days</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      {balance.policy?.maxBalance ? `${balance.policy.maxBalance} days` : 'Unlimited'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No leave balances found for this employee</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
