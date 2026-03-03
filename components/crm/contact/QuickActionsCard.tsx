'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, FileText, Mail, MessageSquare, Phone, CheckCircle, FileCode } from 'lucide-react'
import { TemplatePickerModal } from './TemplatePickerModal'

interface QuickActionsCardProps {
  tenantId: string
  contactId: string
  contact: any
  dealId?: string | null
}

function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '').replace(/^91/, '') || phone.replace(/\D/g, '')
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  tenantId,
  contactId,
  contact,
  dealId = null,
}) => {
  const [templateModal, setTemplateModal] = useState<'email' | 'whatsapp' | null>(null)
  const hasEmail = !!contact?.email?.trim()
  const hasPhone = !!contact?.phone?.trim()
  const waNumber = formatWhatsAppPhone(contact?.phone)
  const waUrl = waNumber ? `https://wa.me/${waNumber.startsWith('91') ? waNumber : '91' + waNumber}` : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
      <div className="space-y-2">
        <Link href={`/crm/${tenantId}/Deals/new?contactId=${contactId}`}>
          <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Briefcase className="w-3 h-3 mr-2" />
            Create Deal
          </Button>
        </Link>
        <Link href={`/crm/${tenantId}/Tasks/new?contactId=${contactId}`}>
          <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <CheckCircle className="w-3 h-3 mr-2" />
            Create Task
          </Button>
        </Link>
        {hasEmail ? (
          <a href={`mailto:${contact.email}`}>
            <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <Mail className="w-3 h-3 mr-2" />
              Send Email
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 opacity-60" disabled title="Add email to contact">
            <Mail className="w-3 h-3 mr-2" />
            Send Email
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setTemplateModal('email')}
          title="Pick a template with {{contact.name}}, {{deal.value}}"
        >
          <FileCode className="w-3 h-3 mr-2" />
          Email with template
        </Button>
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <MessageSquare className="w-3 h-3 mr-2" />
              Send WhatsApp
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 opacity-60" disabled title="Add phone to contact">
            <MessageSquare className="w-3 h-3 mr-2" />
            Send WhatsApp
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setTemplateModal('whatsapp')}
          title="Pick a template with {{contact.name}}, {{deal.value}}"
        >
          <FileCode className="w-3 h-3 mr-2" />
          WhatsApp with template
        </Button>
        <Link href={`/crm/${tenantId}/Dialer?contactId=${contactId}`}>
          <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Phone className="w-3 h-3 mr-2" />
            Log Call
          </Button>
        </Link>
        {(contact?.type === 'customer' || contact?.type === 'lead') && (
          <Link href={`/finance/${tenantId}/Invoices/new?customerId=${contactId}`}>
            <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <FileText className="w-3 h-3 mr-2" />
              Create Invoice
            </Button>
          </Link>
        )}
      </div>

      {templateModal && (
        <TemplatePickerModal
          channel={templateModal}
          onClose={() => setTemplateModal(null)}
          contact={{ id: contactId, name: contact?.name, email: contact?.email, phone: contact?.phone }}
          tenantId={tenantId}
          dealId={dealId}
          hasEmail={hasEmail}
          hasPhone={hasPhone}
        />
      )}
    </div>
  )
}
