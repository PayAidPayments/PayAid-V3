/**
 * Workflow Trigger Hooks
 * Automatically trigger workflows on CRM events
 */

import { triggerWorkflowByEvent } from './workflow-engine'

/**
 * Trigger workflows when contact is created
 */
export async function onContactCreated(
  contactId: string,
  tenantId: string,
  contactData: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'contact.created',
    {
      contactId,
      contact: contactData,
      source: contactData.source,
    },
    tenantId
  )
}

/**
 * Trigger workflows when contact is updated
 */
export async function onContactUpdated(
  contactId: string,
  tenantId: string,
  changes: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'contact.updated',
    {
      contactId,
      changes,
    },
    tenantId
  )
}

/**
 * Trigger workflows when deal is created
 */
export async function onDealCreated(
  dealId: string,
  tenantId: string,
  dealData: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'deal.created',
    {
      dealId,
      deal: dealData,
      contactId: dealData.contactId,
      value: dealData.value,
    },
    tenantId
  )
}

/**
 * Trigger workflows when deal is updated
 */
export async function onDealUpdated(
  dealId: string,
  tenantId: string,
  changes: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'deal.updated',
    {
      dealId,
      changes,
      stage: changes.stage,
      value: changes.value,
    },
    tenantId
  )
}

/**
 * Trigger workflows when email is opened
 */
export async function onEmailOpened(
  contactId: string,
  tenantId: string,
  emailData: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'email.opened',
    {
      contactId,
      email: emailData,
      openCount: emailData.openCount || 1,
    },
    tenantId
  )
}

/**
 * Trigger workflows when email is clicked
 */
export async function onEmailClicked(
  contactId: string,
  tenantId: string,
  emailData: Record<string, any>
): Promise<void> {
  await triggerWorkflowByEvent(
    'email.clicked',
    {
      contactId,
      email: emailData,
    },
    tenantId
  )
}
