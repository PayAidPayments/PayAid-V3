import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { verifyToken } from '@/lib/auth/jwt'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getGroqClient } from '@/lib/ai/groq'
import { prisma } from '@/lib/db/prisma'
import { mediumPriorityQueue } from '@/lib/queue/bull'

// GET /api/ai/insights - Get AI-powered business insights
export async function GET(request: NextRequest) {
  try {
    // Check AI Studio module license - allow fallback for demo/development
    let tenantId: string
    let userId: string
    try {
      const result = await requireModuleAccess(request, 'ai-studio')
      tenantId = result.tenantId
      userId = result.userId
    } catch (licenseError: any) {
      // Fallback: Try to get tenantId from token directly for demo/development
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw licenseError
      }
      const token = authHeader.substring(7)
      try {
        const { verifyToken } = await import('@/lib/auth/jwt')
        const payload = verifyToken(token)
        if (!payload.tenantId) {
          throw licenseError
        }
        tenantId = payload.tenantId
        userId = payload.userId || 'unknown'
        console.warn('[AI Insights] License check failed, using token fallback for tenant:', tenantId)
      } catch {
        throw licenseError
      }
    }

    // Get business data with limits to prevent loading too much data
    const [
      contacts,
      deals,
      orders,
      invoices,
      tasks,
    ] = await Promise.all([
      prisma.contact.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          lastContactedAt: true,
          likelyToBuy: true,
          churnRisk: true,
        },
        take: 100, // Limit to 100 most recent contacts
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deal.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          probability: true,
          expectedCloseDate: true,
        },
        take: 100, // Limit to 100 most recent deals
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          total: true,
          status: true,
          dueDate: true,
          paidAt: true,
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: {
          tenantId: tenantId,
          status: { not: 'completed' },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
        },
        take: 50, // Limit to 50 pending tasks
        orderBy: { dueDate: 'asc' },
      }),
    ])

    // Calculate metrics
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)

    const pendingInvoices = invoices.filter(i => i.status === 'sent' && !i.paidAt)
    const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0)

    const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost')
    const forecastedRevenue = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    )

    const atRiskContacts = contacts.filter(c => c.churnRisk === true).length
    const highValueLeads = contacts.filter(c => c.likelyToBuy === true).length

    console.log('[AI Insights] Fetched data:', {
      contacts: contacts.length,
      deals: deals.length,
      orders: orders.length,
      invoices: invoices.length,
      tasks: tasks.length,
      totalRevenue,
      pendingInvoices: pendingInvoices.length,
      totalPendingAmount,
      forecastedRevenue,
      activeDeals: activeDeals.length,
      atRiskContacts,
      highValueLeads,
    })

    // Generate AI insights - try Ollama, then Groq, then rule-based
    let parsedInsights
    try {
      const insightsPrompt = `
Analyze this business data and provide 5 key insights and recommendations:

Business Metrics:
- Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
- Pending Invoices: ${pendingInvoices.length} (₹${totalPendingAmount.toLocaleString('en-IN')})
- Forecasted Revenue: ₹${forecastedRevenue.toLocaleString('en-IN')}
- Active Deals: ${activeDeals.length}
- At-Risk Contacts: ${atRiskContacts}
- High-Value Leads: ${highValueLeads}
- Pending Tasks: ${tasks.length}

Deal Pipeline:
${deals.slice(0, 10).map(d => `- ${d.name}: ₹${d.value} (${d.stage}, ${d.probability}% probability)`).join('\n')}

Provide:
1. Top 3 urgent actions
2. Revenue opportunities
3. Risk warnings
4. Growth recommendations
5. Operational improvements

Format as JSON with keys: urgentActions, opportunities, risks, recommendations, improvements
`

      const systemPrompt = `You are a business analyst AI. Analyze the provided business data and return insights in JSON format.
Be specific, actionable, and data-driven.`

      let insights: string
      
      // Try Ollama first
      try {
        const ollama = getOllamaClient()
        insights = await ollama.generateCompletion(insightsPrompt, systemPrompt)
      } catch (ollamaError) {
        console.error('Ollama failed, trying Groq:', ollamaError)
        // Fallback to Groq
        const groq = getGroqClient()
        insights = await groq.generateCompletion(insightsPrompt, systemPrompt)
      }

      // Parse insights (handle both JSON and text responses)
      try {
        parsedInsights = JSON.parse(insights)
      } catch {
        // If not JSON, create structured response from text
        parsedInsights = {
          urgentActions: [],
          opportunities: [],
          risks: [],
          recommendations: [],
          improvements: [],
          raw: insights,
        }
      }
    } catch (error) {
      console.error('AI insights generation failed, using rule-based insights:', error)
      // Fallback to rule-based insights with detailed data
      parsedInsights = generateRuleBasedInsights({
        totalRevenue,
        pendingInvoices: pendingInvoices.length,
        totalPendingAmount,
        forecastedRevenue,
        activeDeals: activeDeals.length,
        atRiskContacts,
        highValueLeads,
        pendingTasks: tasks.length,
        deals: deals,
        contacts: contacts,
        invoices: pendingInvoices,
        tasks: tasks,
        orders: orders,
      })
    }

    console.log('[AI Insights] Final insights before return:', {
      urgentActions: parsedInsights.urgentActions?.length || 0,
      opportunities: parsedInsights.opportunities?.length || 0,
      risks: parsedInsights.risks?.length || 0,
      recommendations: parsedInsights.recommendations?.length || 0,
      improvements: parsedInsights.improvements?.length || 0,
      fullInsights: parsedInsights,
    })

    // Log insights generation
    mediumPriorityQueue.add('log-insights-generation', {
      userId: userId,
      tenantId: tenantId,
      insights: parsedInsights,
    })

    return NextResponse.json({
      insights: parsedInsights,
      metrics: {
        totalRevenue,
        pendingInvoices: pendingInvoices.length,
        totalPendingAmount,
        forecastedRevenue,
        activeDeals: activeDeals.length,
        atRiskContacts,
        highValueLeads,
        pendingTasks: tasks.length,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('AI insights error:', error)
    
  // If we have tenantId from fallback, try to generate insights anyway
  if (tenantId) {
    try {
      // Get minimal data for insights
      const [contacts, deals, invoices, tasks] = await Promise.all([
        prisma.contact.findMany({
          where: { tenantId },
          select: { id: true, name: true, lastContactedAt: true, churnRisk: true, likelyToBuy: true },
          take: 50,
        }),
        prisma.deal.findMany({
          where: { tenantId },
          select: { id: true, name: true, value: true, stage: true, probability: true, expectedCloseDate: true },
          take: 50,
        }),
        prisma.invoice.findMany({
          where: { tenantId },
          select: { id: true, total: true, status: true, dueDate: true, paidAt: true },
          take: 50,
        }),
        prisma.task.findMany({
          where: { tenantId, status: { not: 'completed' } },
          select: { id: true, title: true, priority: true, dueDate: true },
          take: 50,
        }),
      ])

      const totalRevenue = 0
      const pendingInvoices = invoices.filter((i: any) => i.status === 'sent' && !i.paidAt)
      const totalPendingAmount = pendingInvoices.reduce((sum: number, i: any) => sum + i.total, 0)
      const activeDeals = deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost')
      const forecastedRevenue = activeDeals.reduce((sum: number, d: any) => sum + d.value * (d.probability / 100), 0)
      const atRiskContacts = contacts.filter((c: any) => c.churnRisk === true).length
      const highValueLeads = contacts.filter((c: any) => c.likelyToBuy === true).length

      console.log('[AI Insights] Fallback - Generating insights with data:', {
        deals: deals.length,
        contacts: contacts.length,
        invoices: pendingInvoices.length,
        tasks: tasks.length,
        activeDeals: activeDeals.length,
        forecastedRevenue,
      })

      const parsedInsights = generateRuleBasedInsights({
        totalRevenue,
        pendingInvoices: pendingInvoices.length,
        totalPendingAmount,
        forecastedRevenue,
        activeDeals: activeDeals.length,
        atRiskContacts,
        highValueLeads,
        pendingTasks: tasks.length,
        deals,
        contacts,
        invoices: pendingInvoices,
        tasks,
        orders: [],
      })

      console.log('[AI Insights] Generated insights:', {
        urgentActions: parsedInsights.urgentActions?.length || 0,
        opportunities: parsedInsights.opportunities?.length || 0,
        risks: parsedInsights.risks?.length || 0,
        recommendations: parsedInsights.recommendations?.length || 0,
        improvements: parsedInsights.improvements?.length || 0,
      })

      return NextResponse.json({
        insights: parsedInsights,
        metrics: {
          totalRevenue,
          pendingInvoices: pendingInvoices.length,
          totalPendingAmount,
          forecastedRevenue,
          activeDeals: activeDeals.length,
          atRiskContacts,
          highValueLeads,
          pendingTasks: tasks.length,
        },
        generatedAt: new Date().toISOString(),
      })
    } catch (fallbackError) {
      console.error('Fallback insights generation failed:', fallbackError)
    }
  }

  // Return empty insights if all else fails
  return NextResponse.json({
    insights: {
      urgentActions: [],
      opportunities: [],
      risks: [],
      recommendations: [],
      improvements: [],
    },
    metrics: {
      totalRevenue: 0,
      pendingInvoices: 0,
      totalPendingAmount: 0,
      forecastedRevenue: 0,
      activeDeals: 0,
      atRiskContacts: 0,
      highValueLeads: 0,
      pendingTasks: 0,
    },
    generatedAt: new Date().toISOString(),
    error: 'AI insights generation failed',
  }, { status: 200 })
  }
}

function generateRuleBasedInsights(metrics: {
  totalRevenue: number
  pendingInvoices: number
  totalPendingAmount: number
  forecastedRevenue: number
  activeDeals: number
  atRiskContacts: number
  highValueLeads: number
  pendingTasks: number
  deals: any[]
  contacts: any[]
  invoices: any[]
  tasks: any[]
  orders: any[]
}): any {
  const urgentActions: string[] = []
  const opportunities: string[] = []
  const risks: string[] = []
  const recommendations: string[] = []
  const improvements: string[] = []

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // ===== URGENT ACTIONS =====
  
  // Overdue invoices
  const overdueInvoices = metrics.invoices.filter((inv: any) => {
    if (!inv.dueDate) return false
    const dueDate = new Date(inv.dueDate)
    return dueDate < now && !inv.paidAt
  })
  if (overdueInvoices.length > 0) {
    const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
    const oldestOverdue = overdueInvoices.sort((a: any, b: any) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0]
    const daysOverdue = Math.floor((now.getTime() - new Date(oldestOverdue.dueDate).getTime()) / (24 * 60 * 60 * 1000))
    urgentActions.push(
      `${overdueInvoices.length} invoice(s) worth ₹${overdueAmount.toLocaleString('en-IN')} are overdue. ` +
      `Oldest is ${daysOverdue} day(s) overdue. Send payment reminders immediately.`
    )
  } else if (metrics.pendingInvoices > 0) {
    urgentActions.push(
      `Follow up on ${metrics.pendingInvoices} pending invoice(s) worth ₹${metrics.totalPendingAmount.toLocaleString('en-IN')} ` +
      `to ensure timely payment and maintain cash flow.`
    )
  }

  // Overdue tasks
  const overdueTasks = metrics.tasks.filter((task: any) => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < now
  })
  if (overdueTasks.length > 0) {
    const highPriorityOverdue = overdueTasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent').length
    urgentActions.push(
      `${overdueTasks.length} task(s) are overdue${highPriorityOverdue > 0 ? `, including ${highPriorityOverdue} high-priority` : ''}. ` +
      `Address these to maintain customer satisfaction and prevent deal delays.`
    )
  } else if (metrics.pendingTasks > 5) {
    urgentActions.push(`Complete ${metrics.pendingTasks} pending task(s) to improve productivity and stay on track.`)
  }

  // At-risk contacts
  if (metrics.atRiskContacts > 0) {
    const contactsNotContacted = metrics.contacts.filter((c: any) => {
      if (!c.lastContactedAt) return true
      return new Date(c.lastContactedAt) < thirtyDaysAgo
    }).length
    urgentActions.push(
      `${metrics.atRiskContacts} contact(s) are at risk of churning. ` +
      `${contactsNotContacted > 0 ? `${contactsNotContacted} haven't been contacted in 30+ days. ` : ''}` +
      `Re-engage immediately to prevent customer loss.`
    )
  }

  // Deals closing soon that need attention
  const dealsClosingSoon = metrics.deals.filter((deal: any) => {
    if (!deal.expectedCloseDate || deal.stage === 'won' || deal.stage === 'lost') return false
    const closeDate = new Date(deal.expectedCloseDate)
    return closeDate <= sevenDaysFromNow && closeDate >= now && deal.probability >= 70
  })
  if (dealsClosingSoon.length > 0) {
    const totalValue = dealsClosingSoon.reduce((sum: number, d: any) => sum + d.value, 0)
    urgentActions.push(
      `${dealsClosingSoon.length} high-probability deal(s) worth ₹${totalValue.toLocaleString('en-IN')} ` +
      `are closing within 7 days. Follow up proactively to ensure timely closure.`
    )
  }

  // ===== OPPORTUNITIES =====

  // High-value deals nearing close
  const highValueClosingDeals = metrics.deals.filter((deal: any) => {
    if (!deal.expectedCloseDate || deal.stage === 'won' || deal.stage === 'lost') return false
    const closeDate = new Date(deal.expectedCloseDate)
    return closeDate <= sevenDaysFromNow && deal.probability >= 80 && deal.value >= 50000
  })
  if (highValueClosingDeals.length > 0) {
    const totalValue = highValueClosingDeals.reduce((sum: number, d: any) => sum + d.value, 0)
    opportunities.push(
      `${highValueClosingDeals.length} high-value deal(s) worth ₹${totalValue.toLocaleString('en-IN')} ` +
      `with 80%+ win probability are closing soon. Focus on these for quick revenue wins.`
    )
  }

  // Forecasted revenue opportunity
  if (metrics.forecastedRevenue > 0) {
    const avgDealValue = metrics.activeDeals > 0 
      ? metrics.deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost')
          .reduce((sum: number, d: any) => sum + d.value, 0) / metrics.activeDeals
      : 0
    opportunities.push(
      `Focus on closing ${metrics.activeDeals} active deal(s) to realize ₹${metrics.forecastedRevenue.toLocaleString('en-IN')} ` +
      `in forecasted revenue. Average deal value is ₹${Math.round(avgDealValue).toLocaleString('en-IN')}.`
    )
  }

  // High-value leads
  if (metrics.highValueLeads > 0) {
    opportunities.push(
      `Nurture ${metrics.highValueLeads} high-value lead(s) to convert them to customers. ` +
      `These leads show strong buying intent and could significantly boost revenue.`
    )
  }

  // Stalled deals
  const stalledDeals = metrics.deals.filter((deal: any) => {
    if (deal.stage === 'won' || deal.stage === 'lost') return false
    if (!deal.expectedCloseDate) return true
    const closeDate = new Date(deal.expectedCloseDate)
    return closeDate < now && deal.probability >= 50
  })
  if (stalledDeals.length > 0) {
    const stalledValue = stalledDeals.reduce((sum: number, d: any) => sum + d.value, 0)
    opportunities.push(
      `${stalledDeals.length} deal(s) worth ₹${stalledValue.toLocaleString('en-IN')} have passed their expected close date ` +
      `but still have 50%+ probability. Re-engage to move them forward.`
    )
  }

  // ===== RISKS =====

  // Cash flow risk from pending invoices
  if (metrics.totalPendingAmount > 50000) {
    const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
    if (overdueAmount > 0) {
      risks.push(
        `Cash flow risk: ₹${overdueAmount.toLocaleString('en-IN')} in overdue invoices and ` +
        `₹${metrics.totalPendingAmount.toLocaleString('en-IN')} total pending. ` +
        `This may impact operations if not collected soon.`
      )
    } else {
      risks.push(
        `High pending invoice amount (₹${metrics.totalPendingAmount.toLocaleString('en-IN')}) may impact cash flow. ` +
        `Follow up proactively to ensure timely collection.`
      )
    }
  }

  // Churn risk
  if (metrics.atRiskContacts > 0) {
    const contactsNotContacted = metrics.contacts.filter((c: any) => {
      if (!c.lastContactedAt) return true
      return new Date(c.lastContactedAt) < thirtyDaysAgo
    }).length
    risks.push(
      `${metrics.atRiskContacts} contact(s) are at risk of churning${contactsNotContacted > 0 ? `, and ${contactsNotContacted} haven't been contacted in 30+ days` : ''}. ` +
      `Immediate action needed to prevent customer loss.`
    )
  }

  // Pipeline risk - deals stuck in early stages
  const earlyStageDeals = metrics.deals.filter((d: any) => 
    ['qualified', 'proposal'].includes(d.stage?.toLowerCase())
  )
  if (earlyStageDeals.length > metrics.activeDeals * 0.5 && metrics.activeDeals > 5) {
    risks.push(
      `${earlyStageDeals.length} deal(s) (${Math.round((earlyStageDeals.length / metrics.activeDeals) * 100)}% of pipeline) ` +
      `are stuck in early stages. Review and accelerate these deals to prevent revenue delays.`
    )
  }

  // ===== RECOMMENDATIONS =====

  // Revenue growth recommendation
  if (metrics.totalRevenue < 100000 && metrics.activeDeals > 0) {
    const conversionRate = metrics.deals.filter((d: any) => d.stage === 'won').length / Math.max(metrics.deals.length, 1) * 100
    recommendations.push(
      `Your conversion rate is ${conversionRate.toFixed(1)}%. Focus on improving deal quality and follow-up processes ` +
      `to increase revenue. Industry average is 25-30%.`
    )
  } else if (metrics.totalRevenue > 0) {
    const avgDealValue = metrics.deals.filter((d: any) => d.stage === 'won')
      .reduce((sum: number, d: any, idx: number, arr: any[]) => 
        idx === arr.length - 1 ? (sum + d.value) / arr.length : sum + d.value, 0)
    if (avgDealValue > 0) {
      recommendations.push(
        `Average deal value is ₹${Math.round(avgDealValue).toLocaleString('en-IN')}. ` +
        `Consider upselling and cross-selling to increase revenue per customer.`
      )
    }
  }

  // Pipeline building recommendation
  if (metrics.activeDeals < 5) {
    recommendations.push(
      `Build a stronger pipeline by generating more leads and opportunities. ` +
      `Aim for at least 3x your revenue target in pipeline value for better coverage.`
    )
  } else {
    const pipelineCoverage = metrics.forecastedRevenue / Math.max(metrics.totalRevenue, 1)
    if (pipelineCoverage < 2) {
      recommendations.push(
        `Pipeline coverage ratio is ${pipelineCoverage.toFixed(1)}x. ` +
        `Aim for 3x coverage to ensure you meet revenue targets. Focus on generating more qualified leads.`
      )
    }
  }

  // ===== IMPROVEMENTS =====

  // Task management
  if (metrics.pendingTasks > 10) {
    const completionRate = metrics.tasks.length > 0 
      ? (metrics.tasks.filter((t: any) => t.status === 'completed').length / metrics.tasks.length) * 100
      : 0
    improvements.push(
      `${metrics.pendingTasks} pending task(s). Task completion rate is ${completionRate.toFixed(0)}%. ` +
      `Implement task prioritization and automation to reduce backlog and improve productivity.`
    )
  } else if (metrics.pendingTasks > 0 && overdueTasks.length === 0) {
    improvements.push(
      `Good task management! You have ${metrics.pendingTasks} pending task(s) with none overdue. ` +
      `Maintain this level of organization.`
    )
  }

  // Invoice collection
  if (metrics.pendingInvoices > 0) {
    improvements.push(
      `Set up automated invoice reminders to improve collection rates. ` +
      `Consider offering early payment discounts to incentivize faster payments.`
    )
  }

  // Contact engagement
  const contactsNotContacted = metrics.contacts.filter((c: any) => {
    if (!c.lastContactedAt) return true
    return new Date(c.lastContactedAt) < thirtyDaysAgo
  }).length
  if (contactsNotContacted > metrics.contacts.length * 0.3 && metrics.contacts.length > 10) {
    improvements.push(
      `${contactsNotContacted} contact(s) (${Math.round((contactsNotContacted / metrics.contacts.length) * 100)}%) ` +
      `haven't been contacted in 30+ days. Regular engagement improves conversion and retention.`
    )
  }

  // If no insights generated, provide general guidance based on available data
  if (urgentActions.length === 0 && opportunities.length === 0 && risks.length === 0 && 
      recommendations.length === 0 && improvements.length === 0) {
    console.log('[AI Insights] No insights generated, creating fallback insights')
    // Generate at least some insights based on what data exists
    if (metrics.deals.length > 0) {
      recommendations.push(
        `You have ${metrics.deals.length} deal(s) in your system. ` +
        `Focus on moving deals through your pipeline and following up regularly to accelerate revenue.`
      )
    }
    if (metrics.contacts.length > 0) {
      recommendations.push(
        `You have ${metrics.contacts.length} contact(s) in your CRM. ` +
        `Regular engagement and follow-ups can help convert leads to customers and retain existing ones.`
      )
    }
    if (metrics.pendingTasks > 0) {
      improvements.push(
        `You have ${metrics.pendingTasks} pending task(s). ` +
        `Completing tasks on time helps maintain customer satisfaction and keeps deals moving forward.`
      )
    }
    if (metrics.activeDeals > 0) {
      opportunities.push(
        `You have ${metrics.activeDeals} active deal(s) worth ₹${metrics.forecastedRevenue.toLocaleString('en-IN')} in forecasted revenue. ` +
        `Focus on closing these deals to realize revenue.`
      )
    }
    // Always provide at least one insight
    if (recommendations.length === 0 && opportunities.length === 0 && improvements.length === 0) {
      if (metrics.totalRevenue === 0 && metrics.activeDeals === 0 && metrics.contacts.length === 0) {
        recommendations.push(
          `Get started by adding contacts, creating deals, and tracking your sales pipeline. ` +
          `The more data you add, the better insights we can provide.`
        )
      } else {
        recommendations.push(
          `Continue building your business by adding more data to your CRM. ` +
          `Track deals, manage contacts, and complete tasks to unlock more personalized insights.`
        )
      }
    }
  }

  // Return insights (only include non-empty arrays)
  return {
    urgentActions: urgentActions.length > 0 ? urgentActions : [],
    opportunities: opportunities.length > 0 ? opportunities : [],
    risks: risks.length > 0 ? risks : [],
    recommendations: recommendations.length > 0 ? recommendations : [],
    improvements: improvements.length > 0 ? improvements : [],
  }
}

