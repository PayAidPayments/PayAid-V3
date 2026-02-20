import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { seedSalesAndBillingModule } from '@/prisma/seeds/demo/seed-sales-billing'
import { DEMO_DATE_RANGE } from '@/prisma/seeds/demo/date-utils'
import { randomDateInRange } from '@/prisma/seeds/demo/date-utils'

export const maxDuration = 120

/**
 * GET /api/finance/ensure-demo-data
 * Seed finance demo data for the current tenant (orders, invoices, vendors, purchase orders).
 * No existing data is deleted. Callable by any user with finance module access.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const quick = request.nextUrl.searchParams.get('quick') === 'true'

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Ensure at least 5 contacts
    let contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, address: true, city: true, postalCode: true },
      take: 200,
    })
    if (contacts.length < 5) {
      const names = ['Alpha Corp', 'Beta Ltd', 'Gamma Inc', 'Delta Co', 'Epsilon LLC']
      for (let i = contacts.length; i < 5; i++) {
        const c = await prisma.contact.create({
          data: {
            tenantId,
            name: names[i],
            email: `contact${i + 1}@example.com`,
            phone: `+91-98765${String(i).padStart(5, '0')}`,
            type: 'customer',
            tags: [],
          },
        })
        contacts.push({ id: c.id, address: c.address, city: c.city, postalCode: c.postalCode } as any)
      }
    }

    // Ensure at least 5 products
    let products = await prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, salePrice: true },
      take: 50,
    })
    if (products.length < 5) {
      const names = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
      for (let i = products.length; i < 5; i++) {
        const price = 1000 + i * 500
        const p = await prisma.product.create({
          data: {
            tenantId,
            name: names[i],
            sku: `SKU-${Date.now()}-${i}`,
            costPrice: price * 0.6,
            salePrice: price,
            images: [],
            categories: [],
          },
        })
        products.push({ id: p.id, name: p.name, salePrice: p.salePrice })
      }
    }

    // Orders + invoices (Mar 2025 – Feb 2026). Use quick=true for fewer records (~1 min).
    const salesResult = await seedSalesAndBillingModule(
      tenantId,
      contacts,
      products,
      DEMO_DATE_RANGE,
      prisma,
      quick ? { maxOrders: 40, maxInvoices: 35 } : undefined
    )

    // Ensure at least one vendor and create purchase orders
    let vendors = await prisma.vendor.findMany({
      where: { tenantId },
      select: { id: true },
      take: 5,
    })
    if (vendors.length === 0) {
      const v = await prisma.vendor.create({
        data: {
          tenantId,
          name: 'Demo Supplier Ltd',
          companyName: 'Demo Supplier Ltd',
          email: 'vendor@demo.com',
          phone: '+91-9876543210',
          address: '123 Industrial Area',
          city: 'Bangalore',
          country: 'India',
          status: 'ACTIVE',
        },
      })
      vendors = [v]
    }

    const existingPOs = await prisma.purchaseOrder.count({ where: { tenantId } })
    let purchaseOrdersCreated = 0
    if (existingPOs < 20 && products.length > 0) {
      const statuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RECEIVED']
      const toCreate = Math.min(25, 25 - existingPOs)
      for (let i = 0; i < toCreate; i++) {
        try {
          const vendor = vendors[i % vendors.length]
          const poNumber = `PO-${String(existingPOs + i + 1).padStart(5, '0')}`
          const orderDate = randomDateInRange(DEMO_DATE_RANGE)
          const numItems = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1))
          let subtotal = 0
          const itemRows: { productId: string | null; productName: string; quantity: number; unitPrice: number; taxRate: number; taxAmount: number; total: number }[] = []
          for (let j = 0; j < numItems; j++) {
            const product = products[j % products.length]
            const price = Number(product.salePrice) || 1000
            const qty = Math.floor(Math.random() * 10) + 1
            const lineTotal = price * qty
            const taxRate = 18
            const taxAmount = lineTotal * (taxRate / 100)
            const total = lineTotal + taxAmount
            subtotal += lineTotal
            itemRows.push({
              productId: product.id,
              productName: product.name,
              quantity: qty,
              unitPrice: price,
              taxRate,
              taxAmount,
              total,
            })
          }
          const tax = subtotal * 0.18
          const total = subtotal + tax
          const po = await prisma.purchaseOrder.create({
            data: {
              tenantId,
              poNumber,
              vendorId: vendor.id,
              status: statuses[Math.floor(Math.random() * statuses.length)],
              orderDate,
              expectedDeliveryDate: new Date(orderDate.getTime() + 14 * 24 * 60 * 60 * 1000),
              subtotal,
              tax,
              discount: 0,
              total,
            },
          })
          for (const item of itemRows) {
            await prisma.purchaseOrderItem.create({
              data: {
                poId: po.id,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                taxAmount: item.taxAmount,
                total: item.total,
              },
            })
          }
          purchaseOrdersCreated++
        } catch (err: any) {
          console.warn('[FINANCE_ENSURE_DEMO] PO create skip:', err?.message || err)
        }
      }
    }

    // Ensure some GST reports exist (for dashboard "GST Reports" count)
    let gstReportsCreated = 0
    const existingGstReports = await prisma.report.count({
      where: { tenantId, type: 'gst' },
    })
    if (existingGstReports < 5) {
      const reportUser = await prisma.user.findFirst({
        where: { tenantId },
        select: { id: true },
      })
      if (reportUser) {
        const gstReportNames = [
          { name: 'GSTR-1 Mar 2025', description: 'Outward supplies' },
          { name: 'GSTR-3B Mar 2025', description: 'Summary return' },
          { name: 'GSTR-1 Apr 2025', description: 'Outward supplies' },
          { name: 'GSTR-3B Apr 2025', description: 'Summary return' },
          { name: 'GSTR-1 May 2025', description: 'Outward supplies' },
        ]
        for (let i = 0; i < gstReportNames.length && existingGstReports + gstReportsCreated < 5; i++) {
          try {
            await prisma.report.create({
              data: {
                tenantId,
                name: gstReportNames[i].name,
                description: gstReportNames[i].description,
                type: 'gst',
                config: { period: 'monthly', formType: i % 2 === 0 ? 'GSTR-1' : 'GSTR-3B' },
                createdById: reportUser.id,
                isActive: true,
              },
            })
            gstReportsCreated++
          } catch (err: any) {
            console.warn('[FINANCE_ENSURE_DEMO] GST report skip:', err?.message || err)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Finance demo data added (orders, invoices, purchase orders, GST reports). No existing data was deleted.',
      tenantId,
      tenantName: tenant.name,
      orders: salesResult.orders,
      invoices: salesResult.invoices,
      purchaseOrders: purchaseOrdersCreated,
      gstReports: gstReportsCreated,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('[FINANCE_ENSURE_DEMO] Error:', error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed finance data',
        message: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}
