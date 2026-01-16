'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useContact, useUpdateContact, useDeleteContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { LeadAllocationDialog } from '@/components/LeadAllocationDialog'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { NurtureSequenceApplier } from '@/components/NurtureSequenceApplier'
import { StageBadge } from '@/components/crm/StageBadge'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoading } from '@/components/ui/loading'

export default function ContactDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: contact, isLoading } = useContact(id)
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const [showAllocationDialog, setShowAllocationDialog] = useState(false)
  const [showNurtureDialog, setShowNurtureDialog] = useState(false)
  const [sequences, setSequences] = useState<any[]>([])

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      try {
        await deleteContact.mutateAsync(id)
        router.push(`/crm/${tenantId}/Contacts`)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete contact')
      }
    }
  }

  // Get normalized stage (handle both stage and legacy type field)
  const contactStage = contact?.stage || (contact?.type === 'lead' ? 'prospect' : contact?.type === 'customer' ? 'customer' : 'contact')

  useEffect(() => {
    if (contactStage === 'prospect' || contact?.type === 'lead') {
      fetch(`/api/leads/${id}/sequences`)
        .then((res) => res.json())
        .then((data) => setSequences(data.sequences || []))
        .catch(console.error)
    }
  }, [contactStage, contact?.type, id])

  if (isLoading) {
    return <PageLoading message="Loading contact..." fullScreen={false} />
  }

  if (!contact) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Contact not found</p>
        <Link href={`/crm/${tenantId}/Contacts`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Contacts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{contact.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{contact.company || 'No company'}</p>
        </div>
        <div className="flex gap-2">
          {contact.type === 'lead' && (
            <>
              <Button
                onClick={() => setShowAllocationDialog(true)}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              >
                {contact.assignedTo ? '🔄 Reassign Lead' : '👤 Assign Lead'}
              </Button>
              <Button
                onClick={() => setShowNurtureDialog(true)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900"
              >
                📧 Nurture Sequence
              </Button>
            </>
          )}
          {(contact.type === 'customer' || contact.type === 'lead') && (
            <Link href={`/finance/${tenantId}/Invoices/new?customerId=${id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                🧾 Create Invoice
              </Button>
            </Link>
          )}
          <Link href={`/crm/${tenantId}/Contacts`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
          <Link href={`/crm/${tenantId}/Contacts/${id}/Edit`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Edit</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteContact.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{contact.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{contact.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stage</div>
                  <StageBadge stage={contactStage} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    contact.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {contact.status}
                  </span>
                </div>
                {(contactStage === 'prospect' || contact.type === 'lead') && contact.leadScore !== undefined && contact.leadScore !== null && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Lead Score</div>
                    <LeadScoringBadge score={contact.leadScore} />
                  </div>
                )}
              </div>

              {contact.address && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {contact.address}
                    {contact.city && `, ${contact.city}`}
                    {contact.state && `, ${contact.state}`}
                    {contact.postalCode && ` ${contact.postalCode}`}
                    {contact.country && `, ${contact.country}`}
                  </div>
                </div>
              )}

              {contact.notes && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{contact.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {contact.deals && contact.deals.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Deals</CardTitle>
                <CardDescription className="dark:text-gray-400">{contact.deals.length} active deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contact.deals.map((deal: any) => (
                    <Link
                      key={deal.id}
                      href={`/crm/${tenantId}/Deals/${deal.id}`}
                      className="block p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{deal.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ₹{deal.value.toLocaleString('en-IN')} • {deal.probability}% probability
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                          {deal.stage}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {contact.type === 'lead' && sequences.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Active Nurture Sequences</CardTitle>
                <CardDescription className="dark:text-gray-400">Automated email sequences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sequences.map((sequence) => (
                    <div
                      key={sequence.id}
                      className="border-l-2 border-purple-500 dark:border-purple-400 pl-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{sequence.template.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Progress: {sequence.completedSteps}/{sequence.totalSteps} emails ({sequence.progress}%)
                          </div>
                          <div className="mt-2">
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 dark:bg-purple-400 transition-all"
                                style={{ width: `${sequence.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            sequence.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : sequence.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {sequence.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {contact.interactions && contact.interactions.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Recent Interactions</CardTitle>
                <CardDescription className="dark:text-gray-400">Communication history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contact.interactions.map((interaction: any) => (
                    <div key={interaction.id} className="border-l-2 border-blue-500 dark:border-blue-400 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium capitalize text-gray-900 dark:text-gray-100">{interaction.type}</div>
                          {interaction.subject && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{interaction.subject}</div>
                          )}
                          {interaction.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{interaction.notes}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(interaction.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/crm/${tenantId}/Deals/New?contactId=${id}`}>
                <Button className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" variant="outline">Create Deal</Button>
              </Link>
              <Link href={`/finance/${tenantId}/Invoices/new?customerId=${id}`}>
                <Button className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" variant="outline">Create Invoice</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(contactStage === 'prospect' || contact.type === 'lead') && contact.assignedTo && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Assigned To</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {contact.assignedTo.name || contact.assignedTo.user?.name || 'Unknown'}
                  </div>
                  {contact.assignedTo.specialization && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Specialization: {contact.assignedTo.specialization}
                    </div>
                  )}
                </div>
              )}
              <div>
                <div className="text-gray-500 dark:text-gray-400">Created</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {contact.createdAt ? format(new Date(contact.createdAt), 'MMM dd, yyyy') : '-'}
                </div>
              </div>
              {contact.lastContactedAt && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Last Contacted</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(contact.lastContactedAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
              {contact.source && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Source</div>
                  <div className="font-medium capitalize text-gray-900 dark:text-gray-100">{contact.source}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAllocationDialog && contact.type === 'lead' && (
        <LeadAllocationDialog
          contactId={id}
          contactName={contact.name}
          currentRep={contact.assignedTo ? {
            id: contact.assignedTo.id,
            name: contact.assignedTo.name || contact.assignedTo.user?.name || 'Unknown'
          } : null}
          onAssign={(repId) => {
            queryClient.invalidateQueries({ queryKey: ['contacts', id] })
            setShowAllocationDialog(false)
          }}
          onClose={() => setShowAllocationDialog(false)}
        />
      )}

      {showNurtureDialog && (contactStage === 'prospect' || contact.type === 'lead') && (
        <NurtureSequenceApplier
          contactId={id}
          contactName={contact.name}
          onEnroll={() => {
            queryClient.invalidateQueries({ queryKey: ['contacts', id] })
            fetch(`/api/leads/${id}/sequences`)
              .then((res) => res.json())
              .then((data) => setSequences(data.sequences || []))
              .catch(console.error)
          }}
          onClose={() => setShowNurtureDialog(false)}
        />
      )}
    </div>
  )
}
