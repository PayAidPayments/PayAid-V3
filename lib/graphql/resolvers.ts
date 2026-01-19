/**
 * GraphQL Resolvers
 * 
 * Resolvers for GraphQL queries and mutations
 * Integrates with existing Prisma clients and caching
 */

import { prisma as prismaWrite } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { multiLayerCache } from '@/lib/cache/multi-layer'

// Helper to get tenant from context
function getTenantId(context: any): string {
  if (!context?.tenantId) {
    throw new Error('Unauthorized: tenantId required')
  }
  return context.tenantId
}

export const resolvers = {
  Query: {
    // Contact queries
    async contacts(_: any, args: { tenantId: string; limit?: number; offset?: number; status?: string }) {
      const tenantId = args.tenantId
      const cacheKey = `graphql:contacts:${tenantId}:${args.limit || 100}:${args.offset || 0}:${args.status || 'all'}`

      // Try cache first
      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const where: any = { tenantId }
      if (args.status) {
        where.status = args.status
      }

      const contacts = await prismaRead.contact.findMany({
        where,
        take: args.limit || 100,
        skip: args.offset || 0,
        orderBy: { createdAt: 'desc' },
      })

      // Cache for 5 minutes
      await multiLayerCache.set(cacheKey, contacts, 300)

      return contacts
    },

    async contact(_: any, args: { id: string; tenantId: string }) {
      const cacheKey = `graphql:contact:${args.id}:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const contact = await prismaRead.contact.findFirst({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      if (!contact) {
        throw new Error('Contact not found')
      }

      await multiLayerCache.set(cacheKey, contact, 300)
      return contact
    },

    // Deal queries
    async deals(_: any, args: { tenantId: string; limit?: number; offset?: number; stage?: string }) {
      const cacheKey = `graphql:deals:${args.tenantId}:${args.limit || 100}:${args.offset || 0}:${args.stage || 'all'}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const where: any = { tenantId: args.tenantId }
      if (args.stage) {
        where.stage = args.stage
      }

      const deals = await prismaRead.deal.findMany({
        where,
        take: args.limit || 100,
        skip: args.offset || 0,
        orderBy: { createdAt: 'desc' },
      })

      await multiLayerCache.set(cacheKey, deals, 300)
      return deals
    },

    async deal(_: any, args: { id: string; tenantId: string }) {
      const cacheKey = `graphql:deal:${args.id}:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const deal = await prismaRead.deal.findFirst({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      if (!deal) {
        throw new Error('Deal not found')
      }

      await multiLayerCache.set(cacheKey, deal, 300)
      return deal
    },

    // Task queries
    async tasks(_: any, args: { tenantId: string; limit?: number; offset?: number; status?: string }) {
      const cacheKey = `graphql:tasks:${args.tenantId}:${args.limit || 100}:${args.offset || 0}:${args.status || 'all'}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const where: any = { tenantId: args.tenantId }
      if (args.status) {
        where.status = args.status
      }

      const tasks = await prismaRead.task.findMany({
        where,
        take: args.limit || 100,
        skip: args.offset || 0,
        orderBy: { createdAt: 'desc' },
      })

      await multiLayerCache.set(cacheKey, tasks, 300)
      return tasks
    },

    async task(_: any, args: { id: string; tenantId: string }) {
      const cacheKey = `graphql:task:${args.id}:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const task = await prismaRead.task.findFirst({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      if (!task) {
        throw new Error('Task not found')
      }

      await multiLayerCache.set(cacheKey, task, 300)
      return task
    },

    // Invoice queries
    async invoices(_: any, args: { tenantId: string; limit?: number; offset?: number; status?: string }) {
      const cacheKey = `graphql:invoices:${args.tenantId}:${args.limit || 100}:${args.offset || 0}:${args.status || 'all'}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const where: any = { tenantId: args.tenantId }
      if (args.status) {
        where.status = args.status
      }

      const invoices = await prismaRead.invoice.findMany({
        where,
        take: args.limit || 100,
        skip: args.offset || 0,
        orderBy: { createdAt: 'desc' },
      })

      await multiLayerCache.set(cacheKey, invoices, 300)
      return invoices
    },

    async invoice(_: any, args: { id: string; tenantId: string }) {
      const cacheKey = `graphql:invoice:${args.id}:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const invoice = await prismaRead.invoice.findFirst({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      await multiLayerCache.set(cacheKey, invoice, 300)
      return invoice
    },

    // Order queries
    async orders(_: any, args: { tenantId: string; limit?: number; offset?: number; status?: string }) {
      const cacheKey = `graphql:orders:${args.tenantId}:${args.limit || 100}:${args.offset || 0}:${args.status || 'all'}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const where: any = { tenantId: args.tenantId }
      if (args.status) {
        where.status = args.status
      }

      const orders = await prismaRead.order.findMany({
        where,
        take: args.limit || 100,
        skip: args.offset || 0,
        orderBy: { createdAt: 'desc' },
      })

      await multiLayerCache.set(cacheKey, orders, 300)
      return orders
    },

    async order(_: any, args: { id: string; tenantId: string }) {
      const cacheKey = `graphql:order:${args.id}:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const order = await prismaRead.order.findFirst({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      await multiLayerCache.set(cacheKey, order, 300)
      return order
    },

    // Dashboard query (complex query)
    async dashboard(_: any, args: { tenantId: string }) {
      const cacheKey = `graphql:dashboard:${args.tenantId}`

      const cached = await multiLayerCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const [contacts, deals, tasks, invoices, orders] = await Promise.all([
        prismaRead.contact.findMany({
          where: { tenantId: args.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prismaRead.deal.findMany({
          where: { tenantId: args.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prismaRead.task.findMany({
          where: { tenantId: args.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prismaRead.invoice.findMany({
          where: { tenantId: args.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prismaRead.order.findMany({
          where: { tenantId: args.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const dashboard = {
        contacts: {
          total: await prismaRead.contact.count({ where: { tenantId: args.tenantId } }),
          byStatus: [],
          recent: contacts,
        },
        deals: {
          total: await prismaRead.deal.count({ where: { tenantId: args.tenantId } }),
          totalValue: 0,
          byStage: [],
          recent: deals,
        },
        tasks: {
          total: await prismaRead.task.count({ where: { tenantId: args.tenantId } }),
          byStatus: [],
          overdue: await prismaRead.task.count({
            where: {
              tenantId: args.tenantId,
              dueDate: { lt: new Date() },
              status: { not: 'completed' },
            },
          }),
          recent: tasks,
        },
        invoices: {
          total: await prismaRead.invoice.count({ where: { tenantId: args.tenantId } }),
          totalAmount: 0,
          byStatus: [],
          overdue: await prismaRead.invoice.count({
            where: {
              tenantId: args.tenantId,
              dueDate: { lt: new Date() },
              status: { not: 'paid' },
            },
          }),
          recent: invoices,
        },
        orders: {
          total: await prismaRead.order.count({ where: { tenantId: args.tenantId } }),
          totalValue: 0,
          byStatus: [],
          recent: orders,
        },
      }

      await multiLayerCache.set(cacheKey, dashboard, 60) // Cache for 1 minute
      return dashboard
    },
  },

  Mutation: {
    async createContact(_: any, args: { tenantId: string; input: any }) {
      const contact = await prismaWrite.contact.create({
        data: {
          ...args.input,
          tenantId: args.tenantId,
        },
      })

      // Invalidate cache
      await multiLayerCache.deletePattern(`graphql:contacts:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return contact
    },

    async updateContact(_: any, args: { id: string; tenantId: string; input: any }) {
      const contact = await prismaWrite.contact.update({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
        data: args.input,
      })

      // Invalidate cache
      await multiLayerCache.delete(`graphql:contact:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:contacts:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return contact
    },

    async deleteContact(_: any, args: { id: string; tenantId: string }) {
      await prismaWrite.contact.delete({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      // Invalidate cache
      await multiLayerCache.delete(`graphql:contact:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:contacts:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return true
    },

    async createDeal(_: any, args: { tenantId: string; input: any }) {
      const deal = await prismaWrite.deal.create({
        data: {
          ...args.input,
          tenantId: args.tenantId,
        },
      })

      await multiLayerCache.deletePattern(`graphql:deals:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return deal
    },

    async updateDeal(_: any, args: { id: string; tenantId: string; input: any }) {
      const deal = await prismaWrite.deal.update({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
        data: args.input,
      })

      await multiLayerCache.delete(`graphql:deal:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:deals:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return deal
    },

    async deleteDeal(_: any, args: { id: string; tenantId: string }) {
      await prismaWrite.deal.delete({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      await multiLayerCache.delete(`graphql:deal:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:deals:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return true
    },

    async createTask(_: any, args: { tenantId: string; input: any }) {
      const task = await prismaWrite.task.create({
        data: {
          ...args.input,
          tenantId: args.tenantId,
        },
      })

      await multiLayerCache.deletePattern(`graphql:tasks:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return task
    },

    async updateTask(_: any, args: { id: string; tenantId: string; input: any }) {
      const task = await prismaWrite.task.update({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
        data: args.input,
      })

      await multiLayerCache.delete(`graphql:task:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:tasks:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return task
    },

    async deleteTask(_: any, args: { id: string; tenantId: string }) {
      await prismaWrite.task.delete({
        where: {
          id: args.id,
          tenantId: args.tenantId,
        },
      })

      await multiLayerCache.delete(`graphql:task:${args.id}:${args.tenantId}`)
      await multiLayerCache.deletePattern(`graphql:tasks:${args.tenantId}:*`)
      await multiLayerCache.deletePattern(`graphql:dashboard:${args.tenantId}`)

      return true
    },
  },

  // Field resolvers for relationships
  Contact: {
    async deals(parent: any) {
      return prismaRead.deal.findMany({
        where: { contactId: parent.id, tenantId: parent.tenantId },
      })
    },
    async invoices(parent: any) {
      return prismaRead.invoice.findMany({
        where: { customerId: parent.id, tenantId: parent.tenantId },
      })
    },
    async orders(parent: any) {
      return prismaRead.order.findMany({
        where: { customerId: parent.id, tenantId: parent.tenantId },
      })
    },
    async tasks(parent: any) {
      return prismaRead.task.findMany({
        where: { contactId: parent.id, tenantId: parent.tenantId },
      })
    },
  },

  Deal: {
    async contact(parent: any) {
      if (!parent.contactId) return null
      return prismaRead.contact.findFirst({
        where: { id: parent.contactId, tenantId: parent.tenantId },
      })
    },
    async tasks(parent: any) {
      // Note: Task model doesn't have dealId, only contactId
      // If tasks need to be linked to deals, use contactId from the deal's contact
      if (!parent.contactId) {
        return []
      }
      return prismaRead.task.findMany({
        where: { contactId: parent.contactId, tenantId: parent.tenantId },
      })
    },
  },

  Task: {
    async contact(parent: any) {
      if (!parent.contactId) return null
      return prismaRead.contact.findFirst({
        where: { id: parent.contactId, tenantId: parent.tenantId },
      })
    },
    async deal(parent: any) {
      if (!parent.dealId) return null
      return prismaRead.deal.findFirst({
        where: { id: parent.dealId, tenantId: parent.tenantId },
      })
    },
  },

  Invoice: {
    async contact(parent: any) {
      if (!parent.customerId) return null
      return prismaRead.contact.findFirst({
        where: { id: parent.customerId, tenantId: parent.tenantId },
      })
    },
  },

  Order: {
    async contact(parent: any) {
      if (!parent.customerId) return null
      return prismaRead.contact.findFirst({
        where: { id: parent.customerId, tenantId: parent.tenantId },
      })
    },
  },
}
