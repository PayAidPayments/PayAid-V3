/**
 * Natural Language Commands
 * Parse and execute natural language commands for AI co-worker
 */

import 'server-only'

export interface NLCommand {
  intent: 'create' | 'update' | 'query' | 'delete' | 'schedule' | 'notify'
  entity: 'contact' | 'deal' | 'invoice' | 'task' | 'workflow'
  parameters: Record<string, unknown>
  confidence: number
}

/**
 * Parse natural language command
 */
export function parseNLCommand(input: string): NLCommand | null {
  const lower = input.toLowerCase()

  // Create contact
  if (lower.match(/create|add|new.*contact|customer|lead/)) {
    const nameMatch = input.match(/(?:named|called|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    const emailMatch = input.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    const phoneMatch = input.match(/(\+?\d{10,})/)

    return {
      intent: 'create',
      entity: 'contact',
      parameters: {
        name: nameMatch?.[1] || '',
        email: emailMatch?.[1] || '',
        phone: phoneMatch?.[1] || '',
      },
      confidence: 0.8,
    }
  }

  // Create deal
  if (lower.match(/create|add.*deal|opportunity/)) {
    const valueMatch = input.match(/₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/)
    const nameMatch = input.match(/(?:deal|opportunity).*?(?:named|called|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)

    return {
      intent: 'create',
      entity: 'deal',
      parameters: {
        name: nameMatch?.[1] || 'New Deal',
        value: valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : 0,
      },
      confidence: 0.75,
    }
  }

  // Schedule task
  if (lower.match(/schedule|remind|task.*(?:tomorrow|next week|in \d+ days)/)) {
    const daysMatch = input.match(/in (\d+) days?/)
    const taskMatch = input.match(/(?:to|about|regarding)\s+(.+?)(?:tomorrow|next|in|$)/i)

    return {
      intent: 'schedule',
      entity: 'task',
      parameters: {
        title: taskMatch?.[1]?.trim() || 'Follow up',
        dueInDays: daysMatch ? parseInt(daysMatch[1]) : 1,
      },
      confidence: 0.7,
    }
  }

  // Query
  if (lower.match(/show|list|get|find|what.*(?:contacts|deals|invoices)/)) {
    const entityMatch = input.match(/(contacts?|deals?|invoices?)/i)

    return {
      intent: 'query',
      entity: (entityMatch?.[1]?.toLowerCase().replace(/s$/, '') || 'contact') as any,
      parameters: {},
      confidence: 0.9,
    }
  }

  return null
}

/**
 * Execute natural language command
 */
export async function executeNLCommand(
  tenantId: string,
  userId: string,
  command: NLCommand
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const { prisma } = await import('@/lib/db/prisma')

  try {
    switch (command.intent) {
      case 'create':
        if (command.entity === 'contact') {
          const contact = await prisma.contact.create({
            data: {
              tenantId,
              name: command.parameters.name as string,
              email: command.parameters.email as string,
              phone: command.parameters.phone as string,
              type: 'lead',
            },
          })
          return { success: true, result: contact }
        } else if (command.entity === 'deal') {
          const deal = await prisma.deal.create({
            data: {
              tenantId,
              name: command.parameters.name as string,
              value: command.parameters.value as number,
              stage: 'prospecting',
            },
          })
          return { success: true, result: deal }
        }
        break

      case 'schedule':
        if (command.entity === 'task') {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + (command.parameters.dueInDays as number))
          const task = await prisma.task.create({
            data: {
              tenantId,
              title: command.parameters.title as string,
              dueDate,
              assignedToId: userId,
            },
          })
          return { success: true, result: task }
        }
        break

      case 'query':
        if (command.entity === 'contact') {
          const contacts = await prisma.contact.findMany({
            where: { tenantId },
            take: 10,
          })
          return { success: true, result: contacts }
        } else if (command.entity === 'deal') {
          const deals = await prisma.deal.findMany({
            where: { tenantId },
            take: 10,
          })
          return { success: true, result: deals }
        }
        break
    }

    return { success: false, error: 'Command not implemented' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Execution failed',
    }
  }
}
