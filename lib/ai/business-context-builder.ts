/**
 * Business Context Builder for AI Agents
 * Fetches tenant-specific business data based on agent data scopes
 */

import { prisma } from '@/lib/db/prisma'

export interface BusinessContextOptions {
  /** Scope to a single module: 'crm' | 'finance' | 'hr'. Omit or 'all' for full context. */
  module?: string
  /** Limit data to last N days (e.g. 7, 30, 90). Omit for no date filter. */
  timeRangeDays?: number
}

/** True if this section should be included given context module and agent data scopes */
function includeSection(
  contextModule: string | undefined,
  section: 'crm' | 'finance' | 'hr',
  dataScopes: string[]
): boolean {
  if (contextModule && contextModule !== 'all') {
    if (contextModule !== section) return false
  }
  if (section === 'finance') return dataScopes.includes('all') || dataScopes.includes('invoices') || dataScopes.includes('payments') || dataScopes.includes('orders')
  if (section === 'crm') return dataScopes.includes('all') || dataScopes.includes('leads') || dataScopes.includes('deals') || dataScopes.includes('contacts')
  if (section === 'hr') return dataScopes.includes('all') || dataScopes.includes('employees') || dataScopes.includes('payroll')
  return true
}

export async function getBusinessContext(
  tenantId: string,
  userMessage?: string,
  dataScopes: string[] = ['all'],
  options: BusinessContextOptions = {}
): Promise<string> {
  const { module: contextModule, timeRangeDays } = options
  const since = timeRangeDays
    ? (() => {
        const d = new Date()
        d.setDate(d.getDate() - timeRangeDays)
        return d
      })()
    : undefined

  try {
    // IMPORTANT: All queries MUST filter by tenantId for tenant isolation

    // Get tenant business information
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
      },
    })

    const scopeNote = contextModule && contextModule !== 'all' ? `\nCONTEXT: Data scoped to ${contextModule.toUpperCase()} only.\n` : ''
    const timeNote = timeRangeDays ? `\nTIME RANGE: Last ${timeRangeDays} days.\n` : ''
    let context = `=== BUSINESS DATA ===
IMPORTANT: Use ONLY this data to answer questions. Do NOT give generic responses.
${scopeNote}${timeNote}

YOUR BUSINESS (${tenant?.name || 'Business'}):
${tenant ? `
- Business Name: ${tenant.name}
- Address: ${tenant.address || 'N/A'}, ${tenant.city || 'N/A'}, ${tenant.state || 'N/A'} ${tenant.postalCode || ''}
- Contact: ${tenant.phone || 'N/A'} | ${tenant.email || 'N/A'}
- Website: ${tenant.website || 'N/A'}
- GSTIN: ${tenant.gstin || 'N/A'}
` : '- Business information not available'}

`

    // Finance-related data (when scope includes finance or all)
    const includeFinance = includeSection(contextModule, 'finance', dataScopes)
    if (includeFinance) {
      const invoiceWhere: any = { tenantId }
      if (since) invoiceWhere.createdAt = { gte: since }
      const invoicesCount = await prisma.invoice.count({ where: invoiceWhere })
      const pendingInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['sent', 'draft'] },
          paidAt: null,
          ...(since && { createdAt: { gte: since } }),
        },
        select: {
          invoiceNumber: true,
          total: true,
          dueDate: true,
          customer: { select: { name: true } },
        },
        take: 10,
        orderBy: { dueDate: 'asc' },
      })
      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0)

      context += `FINANCIAL DATA:
- Total Invoices: ${invoicesCount}
- Pending Invoices: ${pendingInvoices.length}
- Pending Amount: ₹${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
${pendingInvoices.length > 0 ? `
Recent Pending Invoices:
${pendingInvoices.slice(0, 5).map(i => `  - ${i.invoiceNumber}: ₹${i.total.toLocaleString('en-IN')} (Due: ${i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-IN') : 'N/A'}) - ${i.customer?.name || 'N/A'}`).join('\n')}
` : ''}
`
    }

    // Sales-related data (when scope includes crm or all)
    const includeCrm = includeSection(contextModule, 'crm', dataScopes)
    if (includeCrm) {
      const contactWhere: any = { tenantId }
      const dealWhere: any = { tenantId }
      if (since) {
        contactWhere.createdAt = { gte: since }
        dealWhere.updatedAt = { gte: since }
      }
      const contactsCount = await prisma.contact.count({ where: contactWhere })
      const dealsCount = await prisma.deal.count({ where: dealWhere })
      const activeDeals = await prisma.deal.findMany({
        where: { ...dealWhere, stage: { not: 'lost' } },
        select: {
          name: true,
          value: true,
          stage: true,
          probability: true,
          contact: { select: { name: true } },
        },
        take: 10,
        orderBy: { value: 'desc' },
      })

      // Predictive Insights: Churn Risk and Growth Opportunities
      const customers = await prisma.contact.findMany({
        where: { tenantId, type: { in: ['CUSTOMER', 'CLIENT'] } },
        include: {
          orders: {
            select: { total: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        take: 100,
      })

      // Calculate churn risk
      const now = new Date()
      const atRiskCustomers = customers.filter((c) => {
        if (c.orders.length === 0) return true
        const lastOrder = c.orders[0]
        const daysSinceLastOrder = Math.floor(
          (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceLastOrder > 60 // At risk if no order in 60+ days
      })

      // Calculate growth opportunities (high-value leads)
      const highValueLeads = await prisma.contact.findMany({
        where: {
          tenantId,
          type: 'LEAD',
          likelyToBuy: true,
        },
        take: 5,
      })

      context += `SALES DATA:
- Total Contacts: ${contactsCount}
- Total Deals: ${dealsCount}
- Active Deals: ${activeDeals.length}
${activeDeals.length > 0 ? `
Top Active Deals:
${activeDeals.slice(0, 5).map(d => `  - ${d.name}: ₹${d.value.toLocaleString('en-IN')} (${d.stage}, ${d.probability}% prob) - ${d.contact?.name || 'N/A'}`).join('\n')}
` : ''}

PREDICTIVE INSIGHTS:
- Churn Risk: ${atRiskCustomers.length} customer${atRiskCustomers.length > 1 ? 's' : ''} at risk of churning (no activity in 60+ days)
- Growth Opportunities: ${highValueLeads.length} high-value lead${highValueLeads.length > 1 ? 's' : ''} ready to convert
${atRiskCustomers.length > 0 ? `
⚠️ ACTION NEEDED: ${atRiskCustomers.length} customer${atRiskCustomers.length > 1 ? 's' : ''} need immediate re-engagement to prevent churn
` : ''}
${highValueLeads.length > 0 ? `
💡 OPPORTUNITY: ${highValueLeads.length} high-value lead${highValueLeads.length > 1 ? 's' : ''} should be prioritized for conversion
` : ''}
`
    }

    // Marketing-related data (only when not scoped to single module)
    if (!contextModule || contextModule === 'all') {
      if (dataScopes.includes('all') || dataScopes.includes('campaigns') || dataScopes.includes('sequences')) {
        context += `MARKETING DATA:
- Marketing data available
`
      }
    }

    // HR-related data (when scope includes hr or all)
    const includeHr = includeSection(contextModule, 'hr', dataScopes)
    if (includeHr) {
      const employeeWhere: any = { tenantId }
      if (since) employeeWhere.createdAt = { gte: since }
      const employeesCount = await prisma.employee.count({ where: employeeWhere })
      context += `HR DATA:
- Total Employees: ${employeesCount}
`
    }

    // Products/Inventory (only when not scoped)
    if (!contextModule || contextModule === 'all') {
      if (dataScopes.includes('all') || dataScopes.includes('products')) {
        const productsCount = await prisma.product.count({ where: { tenantId } })
        context += `PRODUCTS:
- Total Products: ${productsCount}
`
      }
    }

    // Orders (finance scope or all)
    if (includeFinance || !contextModule || contextModule === 'all') {
      const orderWhere: any = { tenantId }
      if (since) orderWhere.createdAt = { gte: since }
      const ordersCount = await prisma.order.count({ where: orderWhere })
      const recentOrders = await prisma.order.findMany({
        where: orderWhere,
        select: { total: true },
        take: 30,
        orderBy: { createdAt: 'desc' },
      })
      const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total, 0)
      const periodLabel = timeRangeDays ? `Last ${timeRangeDays} days` : 'Last 30 Days'
      context += `ORDERS:
- Total Orders: ${ordersCount}
- Revenue (${periodLabel}): ₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
`
    }

    // Tasks (all or crm)
    if (includeCrm || (!contextModule || contextModule === 'all') && (dataScopes.includes('all') || dataScopes.includes('tasks'))) {
      const tasksCount = await prisma.task.count({ where: { tenantId } })
      const pendingTasks = await prisma.task.findMany({
        where: {
          tenantId,
          status: { not: 'completed' },
          ...(since && { dueDate: { gte: since } }),
        },
        select: { title: true, priority: true, dueDate: true },
        take: 10,
        orderBy: { dueDate: 'asc' },
      })
      context += `TASKS:
- Total Tasks: ${tasksCount}
- Pending Tasks: ${pendingTasks.length}
${pendingTasks.length > 0 ? `
Upcoming Tasks:
${pendingTasks.slice(0, 5).map(t => `  - ${t.title} (${t.priority}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : 'N/A'})`).join('\n')}
` : ''}
`
    }

    return context
  } catch (error) {
    console.error('[BUSINESS_CONTEXT] Error:', error)
    return 'Business context unavailable. Please try again.'
  }
}

