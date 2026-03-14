'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewProspectPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const router = useRouter()
  const createContact = useCreateContact()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'active' as 'active' | 'inactive' | 'lost',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    notes: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const contact = await createContact.mutateAsync({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        type: 'lead',
        stage: 'prospect',
        status: formData.status,
        source: formData.source || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country,
        notes: formData.notes || undefined,
      })
      router.push(`/crm/${tenantId}/Contacts/${contact.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prospect')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Prospect</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Add a new prospect with their details</p>
        </div>
        <Link href={`/crm/${tenantId}/Leads`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Prospect details</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter name, contact info, and any notes. You can promote them to Contact or Customer later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  placeholder="priya@company.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source
                </label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  placeholder="e.g. Website, Referral, Event"
                />
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
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  disabled={createContact.isPending}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  State
                </label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Postal code
                </label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                </label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  disabled={createContact.isPending}
                  placeholder="Any notes about this prospect..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/crm/${tenantId}/Leads`}>
                <Button type="button" variant="outline" disabled={createContact.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createContact.isPending} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                {createContact.isPending ? 'Creating...' : 'Create prospect'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
