/**
 * LangChain Integration Setup
 * FREE implementation using existing Ollama/Groq providers
 * Provides agent orchestration, tool composition, and chain management
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

/**
 * Get LangChain LLM instance based on available providers
 */
export async function getLangChainLLM(): Promise<BaseChatModel> {
  // Try Groq first (fastest)
  if (process.env.GROQ_API_KEY) {
    try {
      const { ChatGroq } = await import('@langchain/groq')
      return new ChatGroq({
        model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
      })
    } catch (error) {
      console.warn('[LangChain] Groq setup failed, trying Ollama:', error)
    }
  }

  // Fallback to Ollama (local, free)
  if (process.env.OLLAMA_BASE_URL) {
    try {
      const { ChatOllama } = await import('@langchain/ollama')
      return new ChatOllama({
        model: process.env.OLLAMA_MODEL || 'mistral:7b',
        baseUrl: process.env.OLLAMA_BASE_URL,
        temperature: 0.7,
      })
    } catch (error) {
      console.warn('[LangChain] Ollama setup failed, trying OpenAI:', error)
    }
  }

  // Last resort: OpenAI (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { ChatOpenAI } = await import('@langchain/openai')
      return new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY,
      })
    } catch (error) {
      console.warn('[LangChain] OpenAI setup failed:', error)
    }
  }

  throw new Error('No LLM provider available for LangChain')
}

/**
 * Business Intelligence Tools for LangChain Agents
 */
export function createBusinessTools(tenantId: string) {
  return [
    new DynamicStructuredTool({
      name: 'get_customer_segments',
      description: 'Get customer segments (VIP, Regular, Occasional, Inactive) with counts',
      schema: z.object({
        limit: z.number().optional().describe('Number of segments to return'),
      }),
      func: async ({ limit = 10 }) => {
        try {
          const customers = await prisma.contact.findMany({
            where: { tenantId, type: { in: ['CUSTOMER', 'CLIENT'] } },
            include: {
              orders: { select: { total: true } },
            },
            take: 100,
          })

          const totalRevenue = customers.reduce(
            (sum, c) => sum + c.orders.reduce((s, o) => s + o.total, 0),
            0
          )
          const avgRevenue = totalRevenue / customers.length || 0

          const segments = {
            vip: customers.filter((c) => {
              const revenue = c.orders.reduce((s, o) => s + o.total, 0)
              return revenue >= avgRevenue * 2
            }).length,
            regular: customers.filter((c) => {
              const revenue = c.orders.reduce((s, o) => s + o.total, 0)
              return revenue >= avgRevenue && revenue < avgRevenue * 2
            }).length,
            occasional: customers.filter((c) => {
              const revenue = c.orders.reduce((s, o) => s + o.total, 0)
              return revenue < avgRevenue && revenue > 0
            }).length,
            inactive: customers.filter((c) => c.orders.length === 0).length,
          }

          return JSON.stringify(segments, null, 2)
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'get_pending_invoices',
      description: 'Get pending/unpaid invoices with amounts and due dates',
      schema: z.object({
        limit: z.number().optional().describe('Maximum number of invoices to return'),
      }),
      func: async ({ limit = 10 }) => {
        try {
          const invoices = await prisma.invoice.findMany({
            where: {
              tenantId,
              status: 'sent',
              paidAt: null,
            },
            include: { customer: { select: { name: true } } },
            take: limit,
            orderBy: { dueDate: 'asc' },
          })

          const summary = invoices.map((inv) => ({
            invoiceNumber: inv.invoiceNumber,
            customer: inv.customer?.name || 'N/A',
            amount: inv.total,
            dueDate: inv.dueDate?.toISOString().split('T')[0] || 'N/A',
            daysOverdue: inv.dueDate
              ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0,
          }))

          return JSON.stringify(summary, null, 2)
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'get_active_deals',
      description: 'Get active deals in pipeline with values and probabilities',
      schema: z.object({
        limit: z.number().optional().describe('Maximum number of deals to return'),
      }),
      func: async ({ limit = 10 }) => {
        try {
          const deals = await prisma.deal.findMany({
            where: {
              tenantId,
              stage: { not: 'lost' },
            },
            include: { contact: { select: { name: true } } },
            take: limit,
            orderBy: { value: 'desc' },
          })

          const summary = deals.map((deal) => ({
            name: deal.name,
            contact: deal.contact?.name || 'N/A',
            value: deal.value,
            stage: deal.stage,
            probability: deal.probability,
            expectedCloseDate: deal.expectedCloseDate?.toISOString().split('T')[0] || 'N/A',
          }))

          return JSON.stringify(summary, null, 2)
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'get_churn_risk_customers',
      description: 'Get customers at risk of churning (no activity in 60+ days)',
      schema: z.object({
        limit: z.number().optional().describe('Maximum number of customers to return'),
      }),
      func: async ({ limit = 10 }) => {
        try {
          const customers = await prisma.contact.findMany({
            where: { tenantId, type: { in: ['CUSTOMER', 'CLIENT'] } },
            include: {
              orders: {
                select: { createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
            take: 100,
          })

          const now = new Date()
          const atRisk = customers
            .filter((c) => {
              if (c.orders.length === 0) return true
              const lastOrder = c.orders[0]
              const daysSince = Math.floor(
                (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              )
              return daysSince > 60
            })
            .slice(0, limit)
            .map((c) => ({
              name: c.name,
              email: c.email,
              lastOrderDate: c.orders[0]?.createdAt.toISOString().split('T')[0] || 'Never',
              daysSinceLastOrder:
                c.orders[0]
                  ? Math.floor(
                      (now.getTime() - new Date(c.orders[0].createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null,
            }))

          return JSON.stringify(atRisk, null, 2)
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'get_revenue_summary',
      description: 'Get revenue summary for a date range',
      schema: z.object({
        days: z.number().optional().describe('Number of days to look back (default: 30)'),
      }),
      func: async ({ days = 30 }) => {
        try {
          const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          const orders = await prisma.order.findMany({
            where: {
              tenantId,
              createdAt: { gte: startDate },
              status: { in: ['confirmed', 'shipped', 'delivered'] },
            },
            select: { total: true, createdAt: true },
          })

          const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
          const orderCount = orders.length
          const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

          return JSON.stringify(
            {
              totalRevenue,
              orderCount,
              avgOrderValue,
              period: `${days} days`,
            },
            null,
            2
          )
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    }),
  ]
}

/**
 * Create LangChain agent with business tools
 * Note: This function requires langchain/agents which may not be available in all environments
 */
export async function createBusinessAgent(tenantId: string, agentPrompt?: string) {
  const llm = await getLangChainLLM()
  const tools = createBusinessTools(tenantId)

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', agentPrompt || `You are an AI business assistant helping with business intelligence queries.
You have access to tools that can fetch customer data, invoices, deals, and revenue information.
Use these tools to answer user questions accurately with real data.
Always format currency as ₹ with commas (e.g., ₹1,00,000).`],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ])

  // Dynamically import agents at runtime - this avoids build-time errors
  // The import is wrapped in a function to ensure it's only evaluated when called
  const getAgents = async () => {
    try {
      // Try importing from langchain package (optional - may not be installed)
      // @ts-expect-error - langchain/agents may not have types or may not be installed
      return await import('langchain/agents')
    } catch (error) {
      // If that fails, try alternative import paths or throw a helpful error
      throw new Error(
        'LangChain agents module not available. ' +
        'This feature requires the langchain package with agents support. ' +
        'Please install: npm install langchain'
      )
    }
  }
  
  const langchainAgents = await getAgents()
  const AgentExecutor = langchainAgents.AgentExecutor
  const createOpenAIFunctionsAgent = langchainAgents.createOpenAIFunctionsAgent
  
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  })

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: process.env.NODE_ENV === 'development',
    maxIterations: 5,
  })

  return agentExecutor
}

/**
 * Execute query using LangChain agent
 */
export async function executeLangChainQuery(
  query: string,
  tenantId: string,
  agentPrompt?: string
): Promise<string> {
  try {
    const agent = await createBusinessAgent(tenantId, agentPrompt)
    const result = await agent.invoke({
      input: query,
    })

    return result.output || 'No response generated'
  } catch (error) {
    console.error('[LangChain] Error executing query:', error)
    throw error
  }
}
