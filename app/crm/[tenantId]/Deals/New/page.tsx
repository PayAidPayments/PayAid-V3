'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useContacts } from '@/lib/hooks/use-api'
import { useCreateDeal } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewDealPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillContactId = searchParams.get('contactId')
  const { data: contactsData } = useContacts()
  const createDeal = useCreateDeal()
  
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    probability: '50',
    stage: 'lead' as 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost',
    contactId: prefillContactId || '',
    // Allow creating Deal without Contact - auto-create Contact if needed
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactCompany: '',
    useNewContact: false, // Toggle between existing Contact or new Contact
    expectedCloseDate: '',
  })
  const [error, setError] = useState('')

  const contacts = contactsData?.contacts || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Deal name is required')
      return
    }

    if (!formData.contactId) {
      setError('Please select a contact')
      return
    }

    const value = parseFloat(formData.value)
    if (isNaN(value) || value <= 0) {
      setError('Deal value must be greater than 0')
      return
    }

    const probability = parseFloat(formData.probability)
    if (isNaN(probability) || probability < 0 || probability > 100) {
      setError('Probability must be between 0 and 100')
      return
    }

    try {
      const dealData: any = {
        name: formData.name.trim(),
        value: value,
        probability: probability,
        stage: formData.stage,
      }

      // If using existing contact
      if (formData.contactId && !formData.useNewContact) {
        dealData.contactId = formData.contactId
      } 
      // If creating new contact
      else if (formData.useNewContact && formData.contactName.trim()) {
        dealData.contactName = formData.contactName.trim()
        if (formData.contactEmail.trim()) dealData.contactEmail = formData.contactEmail.trim()
        if (formData.contactPhone.trim()) dealData.contactPhone = formData.contactPhone.trim()
        if (formData.contactCompany.trim()) dealData.contactCompany = formData.contactCompany.trim()
      }

      if (formData.expectedCloseDate && formData.expectedCloseDate.trim() !== '') {
        dealData.expectedCloseDate = formData.expectedCloseDate
      }

      const deal = await createDeal.mutateAsync(dealData)
      router.push(`/crm/${tenantId}/Deals/${deal.id}`)
    } catch (err: any) {
      let errorMessage = 'Failed to create deal'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      if (err?.response?.data?.details) {
        const details = err.response.data.details
        if (Array.isArray(details)) {
          const detailMessages = details.map((d: any) => {
            const field = d.path?.join('.') || 'field'
            return `${field}: ${d.message || 'Invalid value'}`
          }).join('. ')
          errorMessage = `${errorMessage}. ${detailMessages}`
        }
      }
      
      setError(errorMessage)
      console.error('Deal creation error:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Deal</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new deal in your pipeline</p>
        </div>
        <Link href={`/crm/${tenantId}/Deals`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Deal Information</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the deal details below</CardDescription>
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
                  Deal Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={createDeal.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, useNewContact: false })}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        !formData.useNewContact
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Existing Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, useNewContact: true, contactId: '' })}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        formData.useNewContact
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Create New Contact
                    </button>
                  </div>
                </div>

                {!formData.useNewContact ? (
                  <select
                    id="contactId"
                    name="contactId"
                    value={formData.contactId}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                    required={!formData.useNewContact}
                    disabled={createDeal.isPending}
                  >
                    <option value="">Select a contact</option>
                    {contacts.map((contact: any) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} {contact.company ? `(${contact.company})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Enter contact details. A new Contact will be created automatically as a Prospect.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="contactName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Contact Name *
                        </label>
                        <Input
                          id="contactName"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          required={formData.useNewContact}
                          disabled={createDeal.isPending}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Email
                        </label>
                        <Input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          disabled={createDeal.isPending}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Phone
                        </label>
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          disabled={createDeal.isPending}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          placeholder="+91 1234567890"
                        />
                      </div>
                      <div>
                        <label htmlFor="contactCompany" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Company
                        </label>
                        <Input
                          id="contactCompany"
                          name="contactCompany"
                          value={formData.contactCompany}
                          onChange={handleChange}
                          disabled={createDeal.isPending}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          placeholder="Company Name"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="value" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deal Value (₹) *
                </label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={handleChange}
                  required
                  disabled={createDeal.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="probability" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Probability (%) *
                </label>
                <Input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                  required
                  disabled={createDeal.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="stage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stage *
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  required
                  disabled={createDeal.isPending}
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="expectedCloseDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expected Close Date
                </label>
                <Input
                  id="expectedCloseDate"
                  name="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={handleChange}
                  disabled={createDeal.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/crm/${tenantId}/Deals`}>
                <Button type="button" variant="outline" disabled={createDeal.isPending} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createDeal.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createDeal.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
