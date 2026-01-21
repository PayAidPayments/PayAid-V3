'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/currency'
import type { Contact } from '@/types/base-modules'

interface ContactListProps {
  organizationId: string
}

export function ContactList({ organizationId }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchContacts()
  }, [organizationId, page])

  async function fetchContacts() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/crm/contacts?organizationId=${organizationId}&page=${page}&pageSize=${pageSize}`
      )
      const data = await response.json()
      
      if (data.success) {
        setContacts(data.data.contacts)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteContact(contactId: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchContacts()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  if (loading) {
    return <div className="p-4">Loading contacts...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <Button onClick={() => {/* Open create modal */}}>Add Contact</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-4">
                  {contact.firstName} {contact.lastName}
                </td>
                <td className="p-4">{contact.email}</td>
                <td className="p-4">{contact.phone}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                    {contact.contactType}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    contact.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {contact.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteContact(contact.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
