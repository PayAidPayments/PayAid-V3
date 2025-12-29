/**
 * Business Context Builder for AI Agents
 * Fetches tenant-specific business data based on agent data scopes
 */

import { prisma } from '@/lib/db/prisma'

export async function getBusinessContext(
  tenantId: string, 
  userMessage?: string,
  dataScopes: string[] = ['all']
): Promise<string> {
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

    let context = `=== BUSINESS DATA ===
IMPORTANT: Use ONLY this data to answer questions. Do NOT give generic responses.

YOUR BUSINESS (${tenant?.name || 'Business'}):
${tenant ? `
- Business Name: ${tenant.name}
- Address: ${tenant.address || 'N/A'}, ${tenant.city || 'N/A'}, ${tenant.state || 'N/A'} ${tenant.postalCode || ''}
- Contact: ${tenant.phone || 'N/A'} | ${tenant.email || 'N/A'}
- Website: ${tenant.website || 'N/A'}
- GSTIN: ${tenant.gstin || 'N/A'}
` : '- Business information not available'}

`

    // Finance-related data
    if (dataScopes.includes('all') || dataScopes.includes('invoices') || dataScopes.includes('payments')) {
      const invoicesCount = await prisma.invoice.count({ where: { tenantId } })
      const pendingInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['sent', 'draft'] },
          paidAt: null,
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

    // Sales-related data
    if (dataScopes.includes('all') || dataScopes.includes('leads') || dataScopes.includes('deals')) {
      const contactsCount = await prisma.contact.count({ where: { tenantId } })
      const dealsCount = await prisma.deal.count({ where: { tenantId } })
      const activeDeals = await prisma.deal.findMany({
        where: { tenantId, stage: { not: 'lost' } },
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

      context += `SALES DATA:
- Total Contacts: ${contactsCount}
- Total Deals: ${dealsCount}
- Active Deals: ${activeDeals.length}
${activeDeals.length > 0 ? `
Top Active Deals:
${activeDeals.slice(0, 5).map(d => `  - ${d.name}: ₹${d.value.toLocaleString('en-IN')} (${d.stage}, ${d.probability}% prob) - ${d.contact?.name || 'N/A'}`).join('\n')}
` : ''}
`
    }

    // Marketing-related data
    if (dataScopes.includes('all') || dataScopes.includes('campaigns') || dataScopes.includes('sequences')) {
      // Add marketing data queries here
      context += `MARKETING DATA:
- Marketing data available
`
    }

    // HR-related data
    if (dataScopes.includes('all') || dataScopes.includes('employees') || dataScopes.includes('payroll')) {
      const employeesCount = await prisma.employee.count({ where: { tenantId } })
      context += `HR DATA:
- Total Employees: ${employeesCount}
`
    }

    // Products/Inventory
    if (dataScopes.includes('all') || dataScopes.includes('products')) {
      const productsCount = await prisma.product.count({ where: { tenantId } })
      context += `PRODUCTS:
- Total Products: ${productsCount}
`
    }

    // Orders
    if (dataScopes.includes('all') || dataScopes.includes('orders')) {
      const ordersCount = await prisma.order.count({ where: { tenantId } })
      const recentOrders = await prisma.order.findMany({
        where: { tenantId },
        select: { total: true },
        take: 30,
        orderBy: { createdAt: 'desc' },
      })
      const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total, 0)
      context += `ORDERS:
- Total Orders: ${ordersCount}
- Revenue (Last 30 Days): ₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
`
    }

    // Tasks
    if (dataScopes.includes('all') || dataScopes.includes('tasks')) {
      const tasksCount = await prisma.task.count({ where: { tenantId } })
      const pendingTasks = await prisma.task.findMany({
        where: { tenantId, status: { not: 'completed' } },
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

