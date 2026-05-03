'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SalaryStructure {
  id: string
  name: string
  description?: string
  isDefault: boolean
  structureJson: any
  _count: {
    employeeSalaryStructures: number
  }
  createdAt: string
}

export default function SalaryStructuresPage() {
  const { data, isLoading, refetch } = useQuery<{
    structures: SalaryStructure[]
  }>({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const response = await fetch('/api/hr/payroll/salary-structures')
      if (!response.ok) throw new Error('Failed to fetch salary structures')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const structures = data?.structures || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Structures</h1>
          <p className="mt-2 text-gray-600">Manage salary component structures</p>
        </div>
        <Link href="/dashboard/hr/payroll/salary-structures/new">
          <Button>Create Structure</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Structures</CardTitle>
          <CardDescription>{structures.length} total structures</CardDescription>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No salary structures found</p>
              <Link href="/dashboard/hr/payroll/salary-structures/new">
                <Button>Create Your First Structure</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {structures.map((structure) => (
                <Card key={structure.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {structure.name}
                          {structure.isDefault && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </CardTitle>
                        {structure.description && (
                          <CardDescription className="mt-1">{structure.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/hr/payroll/salary-structures/${structure.id}`}>
                          <Button variant="outline" size="sm">
                            View/Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <strong>{structure._count.employeeSalaryStructures}</strong> employees assigned
                    </div>
                    {structure.structureJson?.components && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Components:</div>
                        <div className="flex flex-wrap gap-2">
                          {(structure.structureJson.components as Array<{ name: string; type: string }>)
                            .slice(0, 5)
                            .map((comp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                              >
                                {comp.name} ({comp.type})
                              </span>
                            ))}
                          {structure.structureJson.components.length > 5 && (
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                              +{structure.structureJson.components.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
