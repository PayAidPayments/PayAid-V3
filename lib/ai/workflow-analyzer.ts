/**
 * Workflow Bottleneck Analyzer
 * Analyzes workflows and identifies bottlenecks
 * FREE implementation using rule-based analysis + AI insights
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

export interface Bottleneck {
  type: 'task' | 'invoice' | 'deal' | 'process' | 'resource'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  suggestion: string
  affectedCount: number
}

export interface WorkflowAnalysis {
  bottlenecks: Bottleneck[]
  recommendations: string[]
  efficiencyScore: number // 0-100
  summary: string
}

/**
 * Analyze task workflow for bottlenecks
 */
async function analyzeTaskBottlenecks(tenantId: string): Promise<Bottleneck[]> {
  const bottlenecks: Bottleneck[] = []

  // Get task statistics
  const [totalTasks, pendingTasks, overdueTasks, highPriorityTasks] = await Promise.all([
    prisma.task.count({ where: { tenantId } }),
    prisma.task.count({
      where: { tenantId, status: { in: ['pending', 'in_progress'] } },
    }),
    prisma.task.count({
      where: {
        tenantId,
        status: { in: ['pending', 'in_progress'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.count({
      where: { tenantId, priority: 'high', status: { not: 'completed' } },
    }),
  ])

  // Bottleneck: Too many pending tasks
  if (pendingTasks > totalTasks * 0.5 && totalTasks > 10) {
    bottlenecks.push({
      type: 'task',
      severity: 'high',
      description: `${pendingTasks} pending tasks (${Math.round((pendingTasks / totalTasks) * 100)}% of total)`,
      impact: 'Tasks are piling up, indicating workflow inefficiency',
      suggestion: 'Consider automating routine tasks or redistributing workload',
      affectedCount: pendingTasks,
    })
  }

  // Bottleneck: Overdue tasks
  if (overdueTasks > 0) {
    bottlenecks.push({
      type: 'task',
      severity: overdueTasks > 5 ? 'critical' : 'high',
      description: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`,
      impact: 'Deadlines are being missed, affecting customer satisfaction',
      suggestion: 'Review task assignment and deadline management process',
      affectedCount: overdueTasks,
    })
  }

  // Bottleneck: Too many high-priority tasks
  if (highPriorityTasks > 10) {
    bottlenecks.push({
      type: 'task',
      severity: 'medium',
      description: `${highPriorityTasks} high-priority tasks`,
      impact: 'Too many urgent tasks may indicate poor prioritization',
      suggestion: 'Review task prioritization and focus on most critical items',
      affectedCount: highPriorityTasks,
    })
  }

  return bottlenecks
}

/**
 * Analyze invoice workflow for bottlenecks
 */
async function analyzeInvoiceBottlenecks(tenantId: string): Promise<Bottleneck[]> {
  const bottlenecks: Bottleneck[] = []

  const [totalInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
    prisma.invoice.count({ where: { tenantId } }),
    prisma.invoice.count({
      where: { tenantId, status: 'sent', paidAt: null },
    }),
    prisma.invoice.count({
      where: {
        tenantId,
        status: 'sent',
        paidAt: null,
        dueDate: { lt: new Date() },
      },
    }),
  ])

  // Calculate average days pending
  const pendingInvoiceData = await prisma.invoice.findMany({
    where: { tenantId, status: 'sent', paidAt: null },
    select: { createdAt: true, dueDate: true },
  })

  const avgDaysPending =
    pendingInvoiceData.length > 0
      ? pendingInvoiceData.reduce((sum, inv) => {
          const days = Math.floor(
            (Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / pendingInvoiceData.length
      : 0

  // Bottleneck: Too many pending invoices
  if (pendingInvoices > totalInvoices * 0.3 && totalInvoices > 5) {
    bottlenecks.push({
      type: 'invoice',
      severity: 'high',
      description: `${pendingInvoices} pending invoices (${Math.round((pendingInvoices / totalInvoices) * 100)}% of total)`,
      impact: 'Cash flow may be affected by delayed payments',
      suggestion: 'Set up automated payment reminders and follow-up workflows',
      affectedCount: pendingInvoices,
    })
  }

  // Bottleneck: Overdue invoices
  if (overdueInvoices > 0) {
    bottlenecks.push({
      type: 'invoice',
      severity: overdueInvoices > 5 ? 'critical' : 'high',
      description: `${overdueInvoices} overdue invoice${overdueInvoices > 1 ? 's' : ''}`,
      impact: 'Immediate cash flow impact and potential customer relationship issues',
      suggestion: 'Implement immediate follow-up process for overdue invoices',
      affectedCount: overdueInvoices,
    })
  }

  // Bottleneck: Slow payment collection
  if (avgDaysPending > 30) {
    bottlenecks.push({
      type: 'invoice',
      severity: 'medium',
      description: `Average ${Math.round(avgDaysPending)} days to collect payment`,
      impact: 'Slow payment collection affects cash flow',
      suggestion: 'Review payment terms and collection process efficiency',
      affectedCount: pendingInvoices,
    })
  }

  return bottlenecks
}

/**
 * Analyze deal pipeline for bottlenecks
 */
async function analyzeDealBottlenecks(tenantId: string): Promise<Bottleneck[]> {
  const bottlenecks: Bottleneck[] = []

  const [totalDeals, activeDeals, stuckDeals] = await Promise.all([
    prisma.deal.count({ where: { tenantId } }),
    prisma.deal.count({
      where: { tenantId, stage: { notIn: ['won', 'lost'] } },
    }),
    prisma.deal.count({
      where: {
        tenantId,
        stage: { notIn: ['won', 'lost'] },
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // No update in 30 days
      },
    }),
  ])

  // Bottleneck: Stuck deals
  if (stuckDeals > 0) {
    bottlenecks.push({
      type: 'deal',
      severity: stuckDeals > 5 ? 'high' : 'medium',
      description: `${stuckDeals} deal${stuckDeals > 1 ? 's' : ''} stuck in pipeline (no update in 30+ days)`,
      impact: 'Deals are not progressing, affecting revenue forecast',
      suggestion: 'Review stuck deals and identify blockers, consider re-engagement campaigns',
      affectedCount: stuckDeals,
    })
  }

  // Bottleneck: Too many active deals (may indicate lack of focus)
  if (activeDeals > 50) {
    bottlenecks.push({
      type: 'deal',
      severity: 'medium',
      description: `${activeDeals} active deals in pipeline`,
      impact: 'Too many deals may lead to lack of focus and slower closure',
      suggestion: 'Prioritize high-value deals and focus resources on most promising opportunities',
      affectedCount: activeDeals,
    })
  }

  return bottlenecks
}

/**
 * Generate AI-powered workflow recommendations
 */
async function generateWorkflowRecommendations(
  bottlenecks: Bottleneck[],
  tenantId: string
): Promise<string[]> {
  if (bottlenecks.length === 0) {
    return ['Your workflows are running smoothly! Keep up the good work.']
  }

  const prompt = `Based on these workflow bottlenecks, provide 5 specific, actionable recommendations:

Bottlenecks:
${bottlenecks.map((b, i) => `${i + 1}. ${b.description} - ${b.impact}`).join('\n')}

Provide recommendations that are:
- Specific and actionable
- Focused on resolving the bottlenecks
- Practical for a small/medium business
- Prioritized by impact

Return as a JSON array of strings: ["Recommendation 1", "Recommendation 2", ...]`

  const systemPrompt = `You are a business process optimization expert. Provide actionable workflow recommendations.`

  try {
    let response = ''
    try {
      const groq = getGroqClient()
      response = await groq.generateCompletion(prompt, systemPrompt)
    } catch {
      const ollama = getOllamaClient()
      response = await ollama.generateCompletion(prompt, systemPrompt)
    }

    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const recommendations = JSON.parse(cleanedResponse) as string[]
    return Array.isArray(recommendations) ? recommendations : []
  } catch (error) {
    console.error('[WORKFLOW_ANALYZER] Error generating recommendations:', error)
    // Fallback to rule-based recommendations
    return bottlenecks.map((b) => b.suggestion)
  }
}

/**
 * Calculate workflow efficiency score
 */
function calculateEfficiencyScore(bottlenecks: Bottleneck[]): number {
  if (bottlenecks.length === 0) return 100

  let score = 100
  for (const bottleneck of bottlenecks) {
    switch (bottleneck.severity) {
      case 'critical':
        score -= 20
        break
      case 'high':
        score -= 10
        break
      case 'medium':
        score -= 5
        break
      case 'low':
        score -= 2
        break
    }
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Analyze all workflows for bottlenecks
 */
export async function analyzeWorkflows(tenantId: string): Promise<WorkflowAnalysis> {
  // Analyze different workflow types in parallel
  const [taskBottlenecks, invoiceBottlenecks, dealBottlenecks] = await Promise.all([
    analyzeTaskBottlenecks(tenantId),
    analyzeInvoiceBottlenecks(tenantId),
    analyzeDealBottlenecks(tenantId),
  ])

  // Combine all bottlenecks
  const allBottlenecks = [
    ...taskBottlenecks,
    ...invoiceBottlenecks,
    ...dealBottlenecks,
  ].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  // Generate recommendations
  const recommendations = await generateWorkflowRecommendations(allBottlenecks, tenantId)

  // Calculate efficiency score
  const efficiencyScore = calculateEfficiencyScore(allBottlenecks)

  // Generate summary
  const summary = `Found ${allBottlenecks.length} bottleneck${allBottlenecks.length > 1 ? 's' : ''} across workflows. Efficiency score: ${efficiencyScore}/100.`

  return {
    bottlenecks: allBottlenecks,
    recommendations,
    efficiencyScore,
    summary,
  }
}
