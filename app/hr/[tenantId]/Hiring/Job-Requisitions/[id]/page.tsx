'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface JobRequisition {
  id: string
  title: string
  department?: { id: string; name: string }
  location?: { id: string; name: string; city: string; state: string }
  employmentType: string
  budgetedCtcMinInr?: number
  budgetedCtcMaxInr?: number
  status: string
  candidateJobs: Array<{
    id: string
    stage: string
    candidate: {
      id: string
      fullName: string
      email: string
      phone: string
      status: string
    }
  }>
  offers: Array<{
    id: string
    offeredCtcInr: number
    offerStatus: string
    candidate: { id: string; fullName: string; email: string }
    employee?: { id: string; employeeCode: string; firstName: string; lastName: string }
  }>
  _count: {
    candidateJobs: number
    offers: number
  }
  createdAt: string
}

interface Department {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  city: string
  state: string
}

export default function JobRequisitionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    locationId: '',
    employmentType: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'CONTRACT',
    budgetedCtcMinInr: '',
    budgetedCtcMaxInr: '',
    status: 'DRAFT' as 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ON_HOLD' | 'CLOSED',
  })
  const [error, setError] = useState('')

  const { data: requisition, isLoading, refetch } = useQuery<JobRequisition>({
    queryKey: ['job-requisition', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/job-requisitions/${id}`)
      if (!response.ok) throw new Error('Failed to fetch job requisition')
      const data = await response.json()
      setFormData({
        title: data.title,
        departmentId: data.departmentId || '',
        locationId: data.locationId || '',
        employmentType: data.employmentType,
        budgetedCtcMinInr: data.budgetedCtcMinInr ? Number(data.budgetedCtcMinInr).toString() : '',
        budgetedCtcMaxInr: data.budgetedCtcMaxInr ? Number(data.budgetedCtcMaxInr).toString() : '',
        status: data.status,
      })
      return data
    },
  })

  const { data: departmentsData } = useQuery<{ departments: Department[] }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/hr/departments?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch departments')
      return response.json()
    },
  })

  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/hr/locations?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch locations')
      return response.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/hr/job-requisitions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          departmentId: data.departmentId || null,
          locationId: data.locationId || null,
          budgetedCtcMinInr: data.budgetedCtcMinInr ? parseFloat(data.budgetedCtcMinInr) : null,
          budgetedCtcMaxInr: data.budgetedCtcMaxInr ? parseFloat(data.budgetedCtcMaxInr) : null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update job requisition')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      refetch()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (isLoading) {
    return <PageLoading message="Loading job requisition..." fullScreen={false} />
  }

  if (!requisition) {
    return <PageLoading message="Job requisition not found" fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{requisition.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Job Requisition Details</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Edit
              </Button>
              <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions`}>
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Edit Job Requisition</CardTitle>
            <CardDescription className="dark:text-gray-400">Update the job requisition details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="departmentId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                  >
                    <option value="">Select Department</option>
                    {departmentsData?.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="locationId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <select
                    id="locationId"
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                  >
                    <option value="">Select Location</option>
                    {locationsData?.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.city}, {loc.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="employmentType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employment Type
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERN">Intern</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="budgetedCtcMinInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budgeted CTC (Min) ₹
                  </label>
                  <Input
                    id="budgetedCtcMinInr"
                    name="budgetedCtcMinInr"
                    type="number"
                    step="0.01"
                    value={formData.budgetedCtcMinInr}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="budgetedCtcMaxInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budgeted CTC (Max) ₹
                  </label>
                  <Input
                    id="budgetedCtcMaxInr"
                    name="budgetedCtcMaxInr"
                    type="number"
                    step="0.01"
                    value={formData.budgetedCtcMaxInr}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{requisition.department?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {requisition.location ? `${requisition.location.name} - ${requisition.location.city}, ${requisition.location.state}` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {requisition.employmentType.replace('_', ' ').toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {requisition.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Budgeted CTC</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {requisition.budgetedCtcMinInr && requisition.budgetedCtcMaxInr
                      ? `₹${Number(requisition.budgetedCtcMinInr).toLocaleString('en-IN')} - ₹${Number(requisition.budgetedCtcMaxInr).toLocaleString('en-IN')}`
                      : requisition.budgetedCtcMinInr
                      ? `₹${Number(requisition.budgetedCtcMinInr).toLocaleString('en-IN')}+`
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(requisition.createdAt), 'PPp')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Candidates ({requisition.candidateJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {requisition.candidateJobs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No candidates assigned yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Name</TableHead>
                      <TableHead className="dark:text-gray-300">Email</TableHead>
                      <TableHead className="dark:text-gray-300">Phone</TableHead>
                      <TableHead className="dark:text-gray-300">Stage</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisition.candidateJobs.map((cj) => (
                      <TableRow key={cj.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium dark:text-gray-200">{cj.candidate.fullName}</TableCell>
                        <TableCell className="dark:text-gray-200">{cj.candidate.email}</TableCell>
                        <TableCell className="dark:text-gray-200">{cj.candidate.phone}</TableCell>
                        <TableCell className="dark:text-gray-200">{cj.stage}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {cj.candidate.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Offers ({requisition.offers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {requisition.offers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No offers made yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Candidate</TableHead>
                      <TableHead className="dark:text-gray-300">Offered CTC</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Employee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisition.offers.map((offer) => (
                      <TableRow key={offer.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium dark:text-gray-200">{offer.candidate.fullName}</TableCell>
                        <TableCell className="dark:text-gray-200">₹{Number(offer.offeredCtcInr).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {offer.offerStatus}
                          </span>
                        </TableCell>
                        <TableCell className="dark:text-gray-200">
                          {offer.employee
                            ? `${offer.employee.employeeCode} - ${offer.employee.firstName} ${offer.employee.lastName}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
