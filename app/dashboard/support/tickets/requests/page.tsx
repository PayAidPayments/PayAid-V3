'use client'

import { P4SupportTicketRequestsPanel } from '@/components/support/P4SupportTicketRequestsPanel'

/**
 * Thin Support tickets operator surface.
 * Authorized after hub probe found demo-data on `/api/support/tickets`.
 */
export default function SupportTicketRequestsPage() {
  return <P4SupportTicketRequestsPanel />
}
