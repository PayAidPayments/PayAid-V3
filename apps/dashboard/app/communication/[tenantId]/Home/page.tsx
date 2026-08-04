'use client'

import { useParams } from 'next/navigation'
import { MessageSquare, Mail, Phone, Users } from 'lucide-react'
import { ProductivityToolHome } from '@/components/modules/dashboard/ProductivityToolHome'

export default function CommunicationDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <ProductivityToolHome
      moduleId="communication"
      title="Communication"
      tenantId={tenantId}
      kpis={[
        {
          label: 'Messages',
          value: '—',
          empty: true,
          emptyLabel: 'Not tracked yet',
          tone: 'purple',
          icon: <MessageSquare className="w-5 h-5" />,
        },
        {
          label: 'Emails',
          value: '—',
          empty: true,
          emptyLabel: 'Connect inbox',
          tone: 'info',
          icon: <Mail className="w-5 h-5" />,
        },
        {
          label: 'Calls',
          value: '—',
          empty: true,
          emptyLabel: 'Coming soon',
          tone: 'success',
          icon: <Phone className="w-5 h-5" />,
        },
        {
          label: 'Team',
          value: '—',
          empty: true,
          emptyLabel: 'Coming soon',
          tone: 'gold',
          icon: <Users className="w-5 h-5" />,
        },
      ]}
      insightText="Communication hub is on the uniform shell. Channel depth (email/WhatsApp/SMS) continues to roll out via Marketing and Support."
      actions={[
        {
          label: 'Open marketing email',
          href: `/marketing/${tenantId}/Email`,
          icon: <Mail className="w-4 h-4" />,
        },
        {
          label: 'Support unibox',
          href: `/support/${tenantId}/Unibox`,
          variant: 'secondary',
        },
        {
          label: 'CRM activities',
          href: `/crm/${tenantId}/Activities`,
          variant: 'secondary',
        },
      ]}
      emptyIcon={<MessageSquare />}
      emptyTitle="Team communication coming soon"
      emptyDescription="Use Marketing Email/WhatsApp and Support Unibox for live channels today. This home stays aligned with the platform layout."
      emptyActionLabel="Open Support Unibox"
      emptyActionHref={`/support/${tenantId}/Unibox`}
    />
  )
}
