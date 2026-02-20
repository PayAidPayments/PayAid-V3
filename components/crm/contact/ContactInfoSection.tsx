'use client'

import React from 'react'
import Link from 'next/link'
import { StageBadge } from '@/components/crm/StageBadge'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { format } from 'date-fns'
import { Briefcase, User, Building2, DollarSign } from 'lucide-react'

interface ContactInfoSectionProps {
  contact: any
  tenantId: string
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({ contact, tenantId }) => {
  const contactStage = contact?.stage || (contact?.type === 'lead' ? 'prospect' : contact?.type === 'customer' ? 'customer' : 'contact')
  
  // Calculate deals summary
  const deals = contact?.deals || []
  const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost')
  const totalPipelineValue = activeDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const wonDealsValue = deals.filter((d: any) => d.stage === 'won').reduce((sum: number, d: any) => sum + (d.value || 0), 0)

  return (
    <div className="space-y-5">
      {/* Contact Profile */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Contact Profile
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Email</div>
            <div className="text-slate-700 dark:text-gray-300">
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
            <div className="text-slate-700 dark:text-gray-300">
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
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Address</div>
              <div className="text-slate-700 dark:text-gray-300">
                {contact.address}
                {contact.city && `, ${contact.city}`}
                {contact.state && `, ${contact.state}`}
                {contact.postalCode && ` ${contact.postalCode}`}
                {contact.country && `, ${contact.country}`}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Stage</div>
              <StageBadge stage={contactStage} />
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Status</div>
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                contact.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {contact.status || 'active'}
              </span>
            </div>
          </div>
          {(contactStage === 'prospect' || contact.type === 'lead') && contact.leadScore !== undefined && contact.leadScore !== null && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Lead Score</div>
              <LeadScoringBadge score={contact.leadScore} />
            </div>
          )}
        </div>
      </div>

      {/* Account & Owner */}
      <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Account & Owner
        </h2>
        <div className="space-y-3 text-sm">
          {contact.company && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Company</div>
              <div className="text-slate-700 dark:text-gray-300 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {contact.company}
              </div>
            </div>
          )}
          {contact.assignedTo && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Assigned To</div>
              <div className="text-slate-700 dark:text-gray-300 flex items-center gap-1">
                <User className="w-3 h-3" />
                {contact.assignedTo.name || contact.assignedTo.user?.name || 'Unassigned'}
              </div>
              {contact.assignedTo.specialization && (
                <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 ml-4">
                  {contact.assignedTo.specialization}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deals & Value */}
      {deals.length > 0 && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Deals & Value
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Active Deals</div>
              <div className="text-slate-700 dark:text-gray-300 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {activeDeals.length} deal{activeDeals.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Pipeline Value</div>
              <div className="text-slate-700 dark:text-gray-300 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ₹{totalPipelineValue.toLocaleString('en-IN')}
              </div>
            </div>
            {wonDealsValue > 0 && (
              <div>
                <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Won Value</div>
                <div className="text-slate-700 dark:text-gray-300 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ₹{wonDealsValue.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Details
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Created</div>
            <div className="text-slate-700 dark:text-gray-300">
              {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}
            </div>
          </div>
          {contact.lastContactedAt && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Last Contacted</div>
              <div className="text-slate-700 dark:text-gray-300">
                {format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}
              </div>
            </div>
          )}
          {contact.source && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Source</div>
              <div className="text-slate-700 dark:text-gray-300 capitalize">{contact.source}</div>
            </div>
          )}
          {contact.industry && (
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-gray-400 mb-1">Industry</div>
              <div className="text-slate-700 dark:text-gray-300">{contact.industry}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
