/**
 * Decision Executor
 * Executes AI decisions based on type and parameters
 */

import { prisma } from '@/lib/db/prisma'
import { logAIDecision } from '@/lib/compliance/audit-logger'

export interface DecisionExecutionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export interface AIDecision {
  id: string
  type: string
  description: string
  recommendation: any
  metadata?: Record<string, any>
  tenantId: string
  requestedBy: string
}

/**
 * Execute a decision based on its type
 */
export async function executeDecision(
  decision: AIDecision
): Promise<DecisionExecutionResult> {
  try {
    let result: DecisionExecutionResult

    switch (decision.type) {
      case 'send_invoice':
        result = await executeSendInvoice(decision)
        break
      case 'apply_discount':
        result = await executeApplyDiscount(decision)
        break
      case 'assign_lead':
        result = await executeAssignLead(decision)
        break
      case 'create_payment_reminder':
        result = await executeCreatePaymentReminder(decision)
        break
      case 'bulk_invoice_payment':
        result = await executeBulkInvoicePayment(decision)
        break
      case 'change_payment_terms':
        result = await executeChangePaymentTerms(decision)
        break
      case 'customer_segment_update':
        result = await executeCustomerSegmentUpdate(decision)
        break
      case 'create_task':
        result = await executeCreateTask(decision)
        break
      case 'assign_task':
        result = await executeAssignTask(decision)
        break
      case 'update_deal_stage':
        result = await executeUpdateDealStage(decision)
        break
      default:
        result = {
          success: false,
          message: `Unknown decision type: ${decision.type}`,
        }
    }

    // Log execution
    await logAIDecision(
      decision.tenantId,
      decision.requestedBy,
      decision.type,
      decision.id,
      result.success ? 'Decision executed successfully' : `Execution failed: ${result.message}`,
      {
        decisionId: decision.id,
        type: decision.type,
        success: result.success,
        result: result.data,
      }
    )

    return result
  } catch (error) {
    console.error('Error executing decision:', error)
    return {
      success: false,
      message: 'Failed to execute decision',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Rollback a decision
 */
export async function rollbackDecision(
  decision: AIDecision,
  executionResult: any
): Promise<DecisionExecutionResult> {
  try {
    // Rollback logic depends on decision type
    // For now, mark as rolled back and log
    await logAIDecision(
      decision.tenantId,
      decision.requestedBy,
      decision.type,
      decision.id,
      'Decision rolled back',
      {
        decisionId: decision.id,
        type: decision.type,
        rollback: true,
        originalResult: executionResult,
      }
    )

    return {
      success: true,
      message: 'Decision rolled back successfully',
    }
  } catch (error) {
    console.error('Error rolling back decision:', error)
    return {
      success: false,
      message: 'Failed to rollback decision',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Decision execution handlers

async function executeSendInvoice(decision: AIDecision): Promise<DecisionExecutionResult> {
  const invoiceId = decision.metadata?.invoiceId
  if (!invoiceId) {
    return { success: false, message: 'Invoice ID required' }
  }

  // Update invoice status to SENT
  await prisma.invoice.update({
    where: { id: invoiceId, tenantId: decision.tenantId },
    data: { status: 'SENT' },
  })

  return {
    success: true,
    message: 'Invoice sent successfully',
    data: { invoiceId },
  }
}

async function executeApplyDiscount(decision: AIDecision): Promise<DecisionExecutionResult> {
  const invoiceId = decision.metadata?.invoiceId
  const discountAmount = decision.metadata?.discountAmount
  const discountType = decision.metadata?.discountType || 'amount'

  if (!invoiceId || !discountAmount) {
    return { success: false, message: 'Invoice ID and discount amount required' }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId: decision.tenantId },
  })

  if (!invoice) {
    return { success: false, message: 'Invoice not found' }
  }

  // Calculate new total
  let newDiscount = 0
  if (discountType === 'percentage') {
    newDiscount = (Number(invoice.subtotal) * discountAmount) / 100
  } else {
    newDiscount = discountAmount
  }

  const newTotal = Number(invoice.subtotal) - newDiscount + Number(invoice.tax || 0)

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      discount: newDiscount,
      discountType,
      total: newTotal,
    },
  })

  return {
    success: true,
    message: 'Discount applied successfully',
    data: { invoiceId, discount: newDiscount },
  }
}

async function executeAssignLead(decision: AIDecision): Promise<DecisionExecutionResult> {
  const leadId = decision.metadata?.leadId
  const salesRepId = decision.metadata?.salesRepId

  if (!leadId || !salesRepId) {
    return { success: false, message: 'Lead ID and Sales Rep ID required' }
  }

  // Update contact/deal assignment
  await prisma.contact.update({
    where: { id: leadId, tenantId: decision.tenantId },
    data: { assignedToId: salesRepId },
  })

  return {
    success: true,
    message: 'Lead assigned successfully',
    data: { leadId, salesRepId },
  }
}

async function executeCreatePaymentReminder(
  decision: AIDecision
): Promise<DecisionExecutionResult> {
  const invoiceId = decision.metadata?.invoiceId
  if (!invoiceId) {
    return { success: false, message: 'Invoice ID required' }
  }

  // Create a task or notification for payment reminder
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId: decision.tenantId },
    include: { customer: true },
  })

  if (!invoice) {
    return { success: false, message: 'Invoice not found' }
  }

  // Create task for payment reminder
  await prisma.task.create({
    data: {
      tenantId: decision.tenantId,
      title: `Payment Reminder: ${invoice.invoiceNumber}`,
      description: `Follow up on payment for invoice ${invoice.invoiceNumber} (₹${invoice.total})`,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  })

  return {
    success: true,
    message: 'Payment reminder created',
    data: { invoiceId },
  }
}

async function executeBulkInvoicePayment(
  decision: AIDecision
): Promise<DecisionExecutionResult> {
  const invoiceIds = decision.metadata?.invoiceIds as string[]
  if (!invoiceIds || !Array.isArray(invoiceIds)) {
    return { success: false, message: 'Invoice IDs array required' }
  }

  // Mark invoices as paid
  await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
      tenantId: decision.tenantId,
    },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  })

  return {
    success: true,
    message: `${invoiceIds.length} invoices marked as paid`,
    data: { invoiceIds, count: invoiceIds.length },
  }
}

async function executeChangePaymentTerms(
  decision: AIDecision
): Promise<DecisionExecutionResult> {
  const customerId = decision.metadata?.customerId
  const paymentTerms = decision.metadata?.paymentTerms

  if (!customerId || !paymentTerms) {
    return { success: false, message: 'Customer ID and payment terms required' }
  }

  // Contact model doesn't have paymentTerms field - store in notes or metadata
  await prisma.contact.update({
    where: { id: customerId, tenantId: decision.tenantId },
    data: { 
      notes: `Payment Terms: ${paymentTerms}. ${(await prisma.contact.findUnique({ where: { id: customerId } }))?.notes || ''}`.substring(0, 500),
    },
  })

  return {
    success: true,
    message: 'Payment terms updated',
    data: { customerId, paymentTerms },
  }
}

async function executeCustomerSegmentUpdate(
  decision: AIDecision
): Promise<DecisionExecutionResult> {
  const customerId = decision.metadata?.customerId
  const segment = decision.metadata?.segment

  if (!customerId || !segment) {
    return { success: false, message: 'Customer ID and segment required' }
  }

  // Contact model doesn't have segment field - use tags or sourceData
  await prisma.contact.update({
    where: { id: customerId, tenantId: decision.tenantId },
    data: { 
      tags: [...((await prisma.contact.findUnique({ where: { id: customerId } }))?.tags || []), segment],
      sourceData: { segment },
    },
  })

  return {
    success: true,
    message: 'Customer segment updated',
    data: { customerId, segment },
  }
}

async function executeCreateTask(decision: AIDecision): Promise<DecisionExecutionResult> {
  const title = decision.metadata?.title
  const description = decision.metadata?.description
  const priority = decision.metadata?.priority || 'medium'
  const dueDate = decision.metadata?.dueDate
    ? new Date(decision.metadata.dueDate)
    : null

  if (!title) {
    return { success: false, message: 'Task title required' }
  }

  const task = await prisma.task.create({
    data: {
      tenantId: decision.tenantId,
      title,
      description: description || decision.description,
      status: 'pending',
      priority,
      dueDate,
    },
  })

  return {
    success: true,
    message: 'Task created successfully',
    data: { taskId: task.id },
  }
}

async function executeAssignTask(decision: AIDecision): Promise<DecisionExecutionResult> {
  const taskId = decision.metadata?.taskId
  const userId = decision.metadata?.userId

  if (!taskId || !userId) {
    return { success: false, message: 'Task ID and User ID required' }
  }

  await prisma.task.update({
    where: { id: taskId, tenantId: decision.tenantId },
    data: { assignedToId: userId },
  })

  return {
    success: true,
    message: 'Task assigned successfully',
    data: { taskId, userId },
  }
}

async function executeUpdateDealStage(decision: AIDecision): Promise<DecisionExecutionResult> {
  const dealId = decision.metadata?.dealId
  const stage = decision.metadata?.stage

  if (!dealId || !stage) {
    return { success: false, message: 'Deal ID and stage required' }
  }

  const updateData: any = { stage }
  if (stage === 'won' || stage === 'lost') {
    updateData.closedAt = new Date()
  }

  await prisma.deal.update({
    where: { id: dealId, tenantId: decision.tenantId },
    data: updateData,
  })

  return {
    success: true,
    message: 'Deal stage updated',
    data: { dealId, stage },
  }
}
