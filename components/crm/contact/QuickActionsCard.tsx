'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, FileText, Mail, MessageSquare, Phone, CheckCircle } from 'lucide-react'

interface QuickActionsCardProps {
  tenantId: string
  contactId: string
  contact: any
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ 
  tenantId, 
  contactId, 
  contact 
}) => {
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
        <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <CheckCircle className="w-3 h-3 mr-2" />
          Create Task
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <Mail className="w-3 h-3 mr-2" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <MessageSquare className="w-3 h-3 mr-2" />
          Send WhatsApp
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <Phone className="w-3 h-3 mr-2" />
          Log Call
        </Button>
        {(contact.type === 'customer' || contact.type === 'lead') && (
          <Link href={`/finance/${tenantId}/Invoices/new?customerId=${contactId}`}>
            <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <FileText className="w-3 h-3 mr-2" />
              Create Invoice
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
