/**
 * Multi-Agent Orchestration (Squads)
 * FREE implementation - code logic only, no paid services
 * 
 * Routes calls to appropriate agents within a squad based on conditions
 * Supports call transfers and conversation history preservation
 */

import { prisma } from '@/lib/db/prisma'

export interface RoutingContext {
  phone?: string
  customerId?: string
  customerName?: string
  language?: string
  timeOfDay?: string
  dayOfWeek?: string
  metadata?: Record<string, any>
}

export interface RoutingCondition {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'in' | 'notIn'
  value: any
}

export class SquadRouter {
  /**
   * Route a call to the appropriate agent in a squad
   * @param squadId - Squad ID
   * @param context - Call context (phone, customer, language, etc.)
   * @returns Agent ID to route to
   */
  async routeCall(squadId: string, context: RoutingContext): Promise<string> {
    const squad = await prisma.voiceAgentSquad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            agent: true,
          },
          orderBy: {
            priority: 'desc', // Higher priority first
          },
        },
      },
    })

    if (!squad) {
      throw new Error(`Squad ${squadId} not found`)
    }

    if (!squad.members || squad.members.length === 0) {
      throw new Error(`Squad ${squadId} has no members`)
    }

    // Evaluate routing rules
    for (const member of squad.members) {
      // Check if agent is active
      if (member.agent.status !== 'active') {
        continue
      }

      // Evaluate conditions if any
      if (member.conditions) {
        const conditions = (member.conditions as unknown as RoutingCondition[]) || []
        if (this.evaluateConditions(conditions, context)) {
          console.log(`[SquadRouter] Routing to agent ${member.agentId} based on conditions`)
          return member.agentId
        }
      } else {
        // No conditions - use as default (first member without conditions)
        console.log(`[SquadRouter] Routing to default agent ${member.agentId}`)
        return member.agentId
      }
    }

    // Fallback: return first active agent
    const firstActive = squad.members.find(m => m.agent.status === 'active')
    if (firstActive) {
      console.log(`[SquadRouter] Fallback routing to agent ${firstActive.agentId}`)
      return firstActive.agentId
    }

    throw new Error(`No active agents found in squad ${squadId}`)
  }

  /**
   * Transfer a call to a different agent
   * Preserves conversation history
   */
  async transferCall(
    callId: string,
    toAgentId: string,
    context?: RoutingContext
  ): Promise<void> {
    const call = await prisma.voiceAgentCall.findUnique({
      where: { id: callId },
      include: {
        metadata: true,
      },
    })

    if (!call) {
      throw new Error(`Call ${callId} not found`)
    }

    // Verify target agent exists and is active
    const targetAgent = await prisma.voiceAgent.findUnique({
      where: { id: toAgentId },
    })

    if (!targetAgent || targetAgent.status !== 'active') {
      throw new Error(`Target agent ${toAgentId} not found or not active`)
    }

    // Update call with new agent
    await prisma.voiceAgentCall.update({
      where: { id: callId },
      data: {
        agentId: toAgentId,
        // Store transfer metadata
        metadata: call.metadata
          ? {
              update: {
                actionsExecuted: {
                  ...(call.metadata.actionsExecuted as any || {}),
                  transfers: [
                    ...((call.metadata.actionsExecuted as any)?.transfers || []),
                    {
                      fromAgentId: call.agentId,
                      toAgentId,
                      transferredAt: new Date().toISOString(),
                      context,
                    },
                  ],
                },
              },
            }
          : undefined,
      },
    })

    console.log(`[SquadRouter] Call ${callId} transferred from ${call.agentId} to ${toAgentId}`)
  }

  /**
   * Evaluate routing conditions
   */
  private evaluateConditions(
    conditions: RoutingCondition[],
    context: RoutingContext
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true // No conditions = always match
    }

    // All conditions must be true (AND logic)
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(context, condition.field)
      
      if (!this.evaluateCondition(condition, fieldValue)) {
        return false
      }
    }

    return true
  }

  /**
   * Get field value from context
   */
  private getFieldValue(context: RoutingContext, field: string): any {
    // Direct fields
    if (field === 'phone') return context.phone
    if (field === 'customerId') return context.customerId
    if (field === 'customerName') return context.customerName
    if (field === 'language') return context.language
    if (field === 'timeOfDay') return context.timeOfDay || this.getTimeOfDay()
    if (field === 'dayOfWeek') return context.dayOfWeek || this.getDayOfWeek()

    // Metadata fields (dot notation: metadata.fieldName)
    if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '')
      return context.metadata?.[metadataField]
    }

    return undefined
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RoutingCondition, fieldValue: any): boolean {
    if (fieldValue === undefined || fieldValue === null) {
      return false
    }

    const { operator, value } = condition

    switch (operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(value).toLowerCase()

      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())

      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())

      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())

      case 'greaterThan':
        return Number(fieldValue) > Number(value)

      case 'lessThan':
        return Number(fieldValue) < Number(value)

      case 'in':
        const inArray = Array.isArray(value) ? value : [value]
        return inArray.some(v => String(fieldValue).toLowerCase() === String(v).toLowerCase())

      case 'notIn':
        const notInArray = Array.isArray(value) ? value : [value]
        return !notInArray.some(v => String(fieldValue).toLowerCase() === String(v).toLowerCase())

      default:
        console.warn(`[SquadRouter] Unknown operator: ${operator}`)
        return false
    }
  }

  /**
   * Get time of day (morning, afternoon, evening, night)
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  /**
   * Get day of week (monday, tuesday, etc.)
   */
  private getDayOfWeek(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }

  /**
   * Get squad by ID
   */
  async getSquad(squadId: string) {
    return await prisma.voiceAgentSquad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            agent: true,
          },
        },
      },
    })
  }

  /**
   * Get all squads for a tenant
   */
  async getSquads(tenantId: string) {
    return await prisma.voiceAgentSquad.findMany({
      where: { tenantId },
      include: {
        members: {
          include: {
            agent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

// Singleton instance
let squadRouterInstance: SquadRouter | null = null

/**
 * Get Squad Router singleton
 */
export function getSquadRouter(): SquadRouter {
  if (!squadRouterInstance) {
    squadRouterInstance = new SquadRouter()
  }
  return squadRouterInstance
}
