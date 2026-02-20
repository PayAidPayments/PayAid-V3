'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useContact, useUpdateContact, useDeleteContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { LeadAllocationDialog } from '@/components/LeadAllocationDialog'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { NurtureSequenceApplier } from '@/components/NurtureSequenceApplier'
import { StageBadge } from '@/components/crm/StageBadge'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoading } from '@/components/ui/loading'
import { ContactInfoTimelineCard } from '@/components/crm/contact/ContactInfoTimelineCard'
import { QuickActionsCard } from '@/components/crm/contact/QuickActionsCard'
import { AIFitScoreCard } from '@/components/crm/contact/AIFitScoreCard'
import { AIAssistCard } from '@/components/crm/contact/AIAssistCard'
import { 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  CheckCircle, 
  FileText,
  Briefcase,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react'

export default function ContactDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: contact, isLoading, refetch } = useContact(id)
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
  const isProspect = contactStage === 'prospect' || contact?.type === 'lead'

  useEffect(() => {
    if (isProspect) {
      fetch(`/api/leads/${id}/sequences`)
        .then((res) => res.json())
        .then((data) => setSequences(data.sequences || []))
        .catch(console.error)
    }
  }, [isProspect, id])

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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Header Band */}
        <header className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm px-5 py-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{contact.name}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{contact.company || 'No company'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StageBadge stage={contactStage} />
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                contact.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {contact.status || 'active'}
              </span>
              {isProspect && contact.leadScore !== undefined && contact.leadScore !== null && (
                <LeadScoringBadge score={contact.leadScore} />
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 ml-4">
            {isProspect && (
              <>
                <Button
                  onClick={() => setShowAllocationDialog(true)}
                  size="sm"
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {contact.assignedTo ? 'Reassign' : 'Assign'}
                </Button>
                <Button
                  onClick={() => setShowNurtureDialog(true)}
                  size="sm"
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Nurture
                </Button>
              </>
            )}
            <Link href={`/crm/${tenantId}/Deals/new?contactId=${id}`}>
              <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Briefcase className="w-3 h-3 mr-1" />
                Create Deal
              </Button>
            </Link>
            {(contact.type === 'customer' || contact.type === 'lead') && (
              <Link href={`/finance/${tenantId}/Invoices/new?customerId=${id}`}>
                <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <FileText className="w-3 h-3 mr-1" />
                  Create Invoice
                </Button>
              </Link>
            )}
            <Link href={`/crm/${tenantId}/Contacts/${id}/Edit`}>
              <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </header>

        {/* Body Band - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)] gap-5">
          {/* Left Column: Info + Timeline */}
          <ContactInfoTimelineCard 
            contact={contact} 
            tenantId={tenantId}
            contactId={id}
          />

          {/* Right Column: AI & Actions */}
          <section className="space-y-4">
            <QuickActionsCard tenantId={tenantId} contactId={id} contact={contact} />
            {isProspect && (
              <AIFitScoreCard contact={contact} tenantId={tenantId} />
            )}
            <AIAssistCard contact={contact} tenantId={tenantId} onEnriched={() => refetch()} />
          </section>
        </div>
      </div>

      {/* Dialogs */}
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

      {showNurtureDialog && isProspect && (
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
