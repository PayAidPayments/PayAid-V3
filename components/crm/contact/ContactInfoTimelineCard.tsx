'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Briefcase, User, Building2, DollarSign } from 'lucide-react'
import { StageBadge } from '@/components/crm/StageBadge'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { ContactTimeline } from './ContactTimeline'

interface ContactInfoTimelineCardProps {
  contact: any
  tenantId: string
  contactId: string
}

export const ContactInfoTimelineCard: React.FC<ContactInfoTimelineCardProps> = ({ 
  contact, 
  tenantId,
  contactId 
}) => {
  const contactStage = contact?.stage || (contact?.type === 'lead' ? 'prospect' : contact?.type === 'customer' ? 'customer' : 'contact')
  
  // Calculate deals summary
  const deals = contact?.deals || []
  const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost')
  const totalPipelineValue = activeDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-6">
      {/* Contact Info Block */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3">Contact Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Email</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {contact.email}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Phone</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {contact.phone}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          {contact.address && (
            <div className="col-span-2">
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Address</div>
              <div className="text-slate-800 dark:text-gray-200">
                {contact.address}
                {contact.city && `, ${contact.city}`}
                {contact.state && `, ${contact.state}`}
                {contact.postalCode && ` ${contact.postalCode}`}
                {contact.country && `, ${contact.country}`}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Company</div>
            <div className="text-slate-800 dark:text-gray-200 flex items-center gap-1">
              {contact.company ? (
                <>
                  <Building2 className="w-3 h-3" />
                  {contact.company}
                </>
              ) : (
                <span className="text-slate-400 dark:text-gray-500">-</span>
              )}
            </div>
          </div>
          {contact.assignedTo && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Assigned To</div>
              <div className="text-slate-800 dark:text-gray-200 flex items-center gap-1">
                <User className="w-3 h-3" />
                {contact.assignedTo.name || contact.assignedTo.user?.name || 'Unassigned'}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Created</div>
            <div className="text-slate-800 dark:text-gray-200">
              {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}
            </div>
          </div>
          {contact.source && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Source</div>
              <div className="text-slate-800 dark:text-gray-200 capitalize">{contact.source}</div>
            </div>
          )}
        </div>
      </div>

      {/* Deals Summary */}
      {deals.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Deals</h2>
            {deals.length > 2 && (
              <Link 
                href={`/crm/${tenantId}/Deals?contactId=${contactId}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all deals
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {activeDeals.slice(0, 2).map((deal: any) => (
              <Link
                key={deal.id}
                href={`/crm/${tenantId}/Deals/${deal.id}`}
                className="block p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-gray-100">{deal.name}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                      ₹{deal.value?.toLocaleString('en-IN') || '0'} • {deal.probability || 0}% probability
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                    {deal.stage}
                  </span>
                </div>
              </Link>
            ))}
            {activeDeals.length === 0 && deals.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-gray-400">
                {deals.length} deal{deals.length !== 1 ? 's' : ''} (all closed)
              </div>
            )}
          </div>
          {totalPipelineValue > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Pipeline Value</span>
                <span className="font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ₹{totalPipelineValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
        <ContactTimeline 
          contactId={contactId} 
          tenantId={tenantId}
          tasks={contact.tasks || []}
          notes={contact.notes || undefined}
        />
      </div>
    </section>
  )
}
