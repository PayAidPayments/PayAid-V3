'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewContractPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contractType: 'SERVICE' as 'SERVICE' | 'SALES' | 'PURCHASE' | 'EMPLOYMENT' | 'NDA' | 'OTHER',
    partyName: '',
    partyEmail: '',
    partyPhone: '',
    partyAddress: '',
    startDate: '',
    endDate: '',
    value: '',
    currency: 'INR',
    tags: [] as string[],
    notes: '',
  })
  const [error, setError] = useState('')

  const createContract = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contract')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/contracts/${data.contract.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title || !formData.partyName) {
      setError('Title and party name are required')
      return
    }

    createContract.mutate({
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contracts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Contract</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new contract or agreement
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>Basic information about the contract</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contract title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Contract description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contract Type *</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="SERVICE">Service</option>
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="EMPLOYMENT">Employment</option>
                <option value="NDA">NDA</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Party Information</CardTitle>
            <CardDescription>Details about the other party</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Party Name *</label>
              <Input
                name="partyName"
                value={formData.partyName}
                onChange={handleChange}
                placeholder="Company or person name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                name="partyEmail"
                type="email"
                value={formData.partyEmail}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                name="partyPhone"
                value={formData.partyPhone}
                onChange={handleChange}
                placeholder="+91 1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                name="partyAddress"
                value={formData.partyAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder="Full address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
            <CardDescription>Dates, value, and other terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  name="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Additional notes"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={createContract.isPending}>
            {createContract.isPending ? 'Creating...' : 'Create Contract'}
          </Button>
          <Link href="/dashboard/contracts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

