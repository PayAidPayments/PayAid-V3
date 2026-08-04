'use client'

import { useParams } from 'next/navigation'
import { Headset, Ticket, MessageSquare, Inbox } from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function SupportHomePage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const config = getModuleConfig('support')!

  const kpis: DashboardKpi[] = [
    {
      label: 'Open tickets',
      value: '—',
      empty: true,
      emptyLabel: 'Open Tickets',
      tone: 'purple',
      icon: <Ticket className="w-5 h-5" />,
      href: `/support/${tenantId}/Tickets`,
    },
    {
      label: 'Unibox',
      value: '—',
      empty: true,
      emptyLabel: 'Check inbox',
      tone: 'info',
      icon: <Inbox className="w-5 h-5" />,
      href: `/support/${tenantId}/Unibox`,
    },
    {
      label: 'Live chat',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
      tone: 'success',
      icon: <MessageSquare className="w-5 h-5" />,
      href: `/support/${tenantId}/Chat`,
    },
    {
      label: 'SLA risk',
      value: '—',
      empty: true,
      emptyLabel: 'Not tracked yet',
      tone: 'warning',
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'Tickets',
      href: `/support/${tenantId}/Tickets`,
      icon: <Ticket className="w-4 h-4" />,
    },
    {
      label: 'Unibox',
      href: `/support/${tenantId}/Unibox`,
      icon: <Inbox className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Chat',
      href: `/support/${tenantId}/Chat`,
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId="support"
      title="Support"
      moduleIcon={<config.icon className="w-7 h-7" />}
      kpis={kpis}
      insight={{
        text: 'Support home is on the shared dashboard shell. Ticket KPIs will light up as Unibox and Tickets accumulate live volume.',
        status: 'unavailable',
        href: `/support/${tenantId}/Tickets`,
        hrefLabel: 'Open tickets',
      }}
      actions={actions}
      secondaryTitle="Start here"
      secondaryDescription="Primary support workspaces"
      secondary={
        <DashboardEmptyState
          icon={<Headset />}
          title="No ticket metrics yet"
          description="Jump into Tickets or Unibox to handle customer conversations. KPI cards stay reserved until live counts are wired."
          actionLabel="Open tickets"
          actionHref={`/support/${tenantId}/Tickets`}
        />
      }
    />
  )
}
