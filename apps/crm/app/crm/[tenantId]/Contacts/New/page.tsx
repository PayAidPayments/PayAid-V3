'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewContactPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const createContact = useCreateContact()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'lead' as 'customer' | 'lead' | 'vendor' | 'employee', // Keep for backward compat
    stage: 'prospect' as 'prospect' | 'contact' | 'customer', // New simplified stage
    status: 'active' as 'active' | 'inactive' | 'lost',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    tags: [] as string[],
    notes: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const contact = await createContact.mutateAsync(formData)
      router.push(`/crm/${tenantId}/Contacts/${contact.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Contact</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Add a new contact to your CRM</p>
        </div>
        <Link href={`/crm/${tenantId}/Contacts`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Contact Information</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the contact details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={createContact.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
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
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="stage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stage *
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                    (Where are they in the sales process?)
                  </span>
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  required
                  disabled={createContact.isPending}
                >
                  <option value="prospect">Prospect - Just discovered, minimal info</option>
                  <option value="contact">Contact - Actively engaging</option>
                  <option value="customer">Customer - Has purchased</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.stage === 'prospect' && 'Use for: Website forms, business cards, referrals, imported lists'}
                  {formData.stage === 'contact' && 'Use for: After first call/email, meeting scheduled, they responded'}
                  {formData.stage === 'customer' && 'Use for: Deal won, invoice created, payment received'}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  required
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
                  Postal Code
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
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/crm/${tenantId}/Contacts`}>
                <Button type="button" variant="outline" disabled={createContact.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createContact.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createContact.isPending ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
