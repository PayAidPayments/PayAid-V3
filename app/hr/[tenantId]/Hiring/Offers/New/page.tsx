'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Candidate {
  id: string
  fullName: string
  email: string
}

interface JobRequisition {
  id: string
  title: string
}

export default function NewOfferPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
  const [formData, setFormData] = useState({
    candidateId: '',
    requisitionId: '',
    offeredCtcInr: '',
    acceptedCtcInr: '',
    joiningDate: '',
    offerStatus: 'SENT' as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
    offerLetterUrl: '',
  })
  const [error, setError] = useState('')

  const { data: candidatesData } = useQuery<{ candidates: Candidate[] }>({
    queryKey: ['candidates'],
    queryFn: async () => {
      const response = await fetch('/api/hr/candidates?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch candidates')
      return response.json()
    },
  })

  const { data: requisitionsData } = useQuery<{ requisitions: JobRequisition[] }>({
    queryKey: ['job-requisitions'],
    queryFn: async () => {
      const response = await fetch('/api/hr/job-requisitions?limit=1000&status=APPROVED')
      if (!response.ok) throw new Error('Failed to fetch job requisitions')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          offeredCtcInr: parseFloat(data.offeredCtcInr),
          acceptedCtcInr: data.acceptedCtcInr ? parseFloat(data.acceptedCtcInr) : undefined,
          joiningDate: new Date(data.joiningDate).toISOString(),
          offerLetterUrl: data.offerLetterUrl || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create offer')
      }
      return response.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Hiring/Candidates`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Offer</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new job offer</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Candidates`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Offer Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the job offer information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="candidateId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Candidate <span className="text-red-500">*</span>
                </label>
                <select
                  id="candidateId"
                  name="candidateId"
                  value={formData.candidateId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Candidate</option>
                  {candidatesData?.candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.fullName} ({candidate.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="requisitionId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Requisition <span className="text-red-500">*</span>
                </label>
                <select
                  id="requisitionId"
                  name="requisitionId"
                  value={formData.requisitionId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Job Requisition</option>
                  {requisitionsData?.requisitions.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="offeredCtcInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Offered CTC ₹ <span className="text-red-500">*</span>
                </label>
                <Input
                  id="offeredCtcInr"
                  name="offeredCtcInr"
                  type="number"
                  step="0.01"
                  value={formData.offeredCtcInr}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 700000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="acceptedCtcInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accepted CTC ₹
                </label>
                <Input
                  id="acceptedCtcInr"
                  name="acceptedCtcInr"
                  type="number"
                  step="0.01"
                  value={formData.acceptedCtcInr}
                  onChange={handleChange}
                  placeholder="e.g., 700000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="joiningDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="joiningDate"
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="offerStatus" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Offer Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="offerStatus"
                  name="offerStatus"
                  value={formData.offerStatus}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="offerLetterUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Offer Letter URL
                </label>
                <Input
                  id="offerLetterUrl"
                  name="offerLetterUrl"
                  type="url"
                  value={formData.offerLetterUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/hr/${tenantId}/Hiring/Candidates`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createMutation.isPending ? 'Creating...' : 'Create Offer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
