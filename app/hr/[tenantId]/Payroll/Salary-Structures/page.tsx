'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import Link from 'next/link'

interface SalaryStructure {
  id: string
  name: string
  description?: string
  isDefault: boolean
  structureJson: {
    earnings: Array<{
      name: string
      type: 'fixed' | 'variable' | 'allowance'
      amount?: number
      percentage?: number
      formula?: string
    }>
    deductions: Array<{
      name: string
      type: 'statutory' | 'voluntary' | 'loan'
      amount?: number
      percentage?: number
      formula?: string
    }>
  }
  _count?: {
    employeeSalaryStructures: number
  }
}

export default function SalaryStructuresPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
  })

  const { data, isLoading, refetch } = useQuery<{ structures: SalaryStructure[] }>({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const response = await fetch('/api/hr/payroll/salary-structures')
      if (!response.ok) throw new Error('Failed to fetch salary structures')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/payroll/salary-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          structureJson: {
            earnings: [
              { name: 'Basic Salary', type: 'fixed', amount: 0 },
              { name: 'HRA', type: 'allowance', percentage: 50 },
            ],
            deductions: [
              { name: 'PF', type: 'statutory', percentage: 12 },
              { name: 'ESI', type: 'statutory', percentage: 0.75 },
            ],
          },
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create salary structure')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setShowCreateModal(false)
      setFormData({ name: '', description: '', isDefault: false })
    },
  })

  const structures = data?.structures || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Salary Structures</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage salary component structures</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/hr/${tenantId}/Payroll/Salary-Structures/New`}>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Structure
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <PageLoading message="Loading salary structures..." fullScreen={false} />
      ) : structures.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No salary structures created yet</p>
            <Link href={`/hr/${tenantId}/Payroll/Salary-Structures/New`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Structure</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {structures.map((structure) => (
            <Card key={structure.id} className={`${structure.isDefault ? 'border-purple-500 dark:border-purple-400' : ''} dark:bg-gray-800 dark:border-gray-700`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100">{structure.name}</CardTitle>
                  {structure.isDefault && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
                {structure.description && (
                  <CardDescription className="dark:text-gray-400">{structure.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Earnings</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {structure.structureJson.earnings.length} components
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Deductions</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {structure.structureJson.deductions.length} components
                    </p>
                  </div>
                  {structure._count && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{structure._count.employeeSalaryStructures} employees</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
