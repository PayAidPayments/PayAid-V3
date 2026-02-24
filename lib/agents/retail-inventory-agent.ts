/**
 * Phase 1A — Agent #1: Retail Inventory Agent
 * TRIGGER: Low stock (product quantity <= reorderLevel or inventory location below threshold)
 * STEPS: Analyze sales (last 30d), Shiprocket rate (if configured), reorder list + WhatsApp message, create PO.
 * OUTPUT: Reorder suggestion in INR (₹). India SMB only. Optionally creates PurchaseOrder.
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getLowestRateInr } from '@/lib/integrations/shiprocket'

const INDIAN_CURRENCY = '₹'
const SHIPROCKET_PLACEHOLDER_COST = 89 // ₹ when Shiprocket not configured
const DEFAULT_PIN = '110001'

export interface ReorderItem {
  productId: string
  productName: string
  sku: string
  currentQty: number
  reorderLevel: number
  suggestedQty: number
  unitPriceInr: number
  totalInr: number
}

export interface RetailInventoryAgentResult {
  tenantId: string
  reorderItems: ReorderItem[]
  totalInr: number
  shiprocketDeliveryInr: number
  summaryMessage: string
  whatsappSupplierMessage: string
  triggeredAt: string
  purchaseOrderId?: string
  purchaseOrderNumber?: string
}

/**
 * Get sold quantities per product in the last 30 days (from orders).
 */
async function getSalesLast30d(tenantId: string): Promise<Map<string, number>> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        tenantId,
        createdAt: { gte: since },
        status: { notIn: ['cancelled'] },
      },
      productId: { not: null },
    },
    select: { productId: true, quantity: true },
  })

  const sold = new Map<string, number>()
  for (const item of items) {
    if (item.productId) {
      sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return sold
}

/**
 * Run Retail Inventory Agent for a tenant. Finds low-stock products, suggests reorder, generates message.
 */
export async function runRetailInventoryAgent(tenantId: string): Promise<RetailInventoryAgentResult> {
  const sales30d = await getSalesLast30d(tenantId)

  // Products at or below reorder level (use Product.quantity or sum of InventoryLocation.quantity)
  const products = await prisma.product.findMany({
    where: { tenantId },
    include: {
      inventoryLocations: true,
    },
  })

  const lowStock: Array<{
    product: (typeof products)[0]
    currentQty: number
    reorderLevel: number
    sold30d: number
  }> = []

  for (const product of products) {
    const totalInLocations = product.inventoryLocations.reduce((s, loc) => s + loc.quantity, 0)
    const currentQty = product.inventoryLocations.length > 0 ? totalInLocations : product.quantity
    const reorderLevel = product.inventoryLocations[0]?.reorderLevel ?? product.reorderLevel ?? 10
    if (currentQty <= reorderLevel) {
      lowStock.push({
        product,
        currentQty,
        reorderLevel,
        sold30d: sales30d.get(product.id) ?? 0,
      })
    }
  }

  const reorderItems: ReorderItem[] = []
  for (const { product, currentQty, reorderLevel, sold30d } of lowStock) {
    const suggestedQty = Math.max(reorderLevel - currentQty + 1, Math.ceil(sold30d / 4) || 10)
    const unitPriceInr = product.costPrice
    const totalInr = Math.round(suggestedQty * unitPriceInr * 100) / 100
    reorderItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentQty,
      reorderLevel,
      suggestedQty,
      unitPriceInr,
      totalInr,
    })
  }

  const totalInr = reorderItems.reduce((s, i) => s + i.totalInr, 0)

  // Shiprocket rate: use real API if configured, else placeholder
  let shiprocketDeliveryInr = reorderItems.length > 0 ? SHIPROCKET_PLACEHOLDER_COST : 0
  if (reorderItems.length > 0 && (process.env.SHIPROCKET_TOKEN || (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD))) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { postalCode: true } })
      const pickup = (tenant?.postalCode || DEFAULT_PIN).replace(/\D/g, '').slice(0, 6) || DEFAULT_PIN
      const weightKg = Math.max(0.5, reorderItems.length * 0.5)
      const rate = await getLowestRateInr(pickup, DEFAULT_PIN, weightKg)
      if (rate != null) shiprocketDeliveryInr = rate
    } catch (e) {
      console.warn('Shiprocket rate fallback to placeholder:', e)
    }
  }

  let summaryMessage: string
  let whatsappSupplierMessage: string
  let purchaseOrderId: string | undefined
  let purchaseOrderNumber: string | undefined

  if (reorderItems.length === 0) {
    summaryMessage = 'No low-stock items. No reorder needed.'
    whatsappSupplierMessage = ''
  } else {
    const lines = reorderItems.map(
      (i) => `${i.productName} (${i.sku}): ${i.suggestedQty} units @ ${INDIAN_CURRENCY}${i.unitPriceInr} = ${INDIAN_CURRENCY}${i.totalInr.toLocaleString('en-IN')}`
    )
    summaryMessage = `Reorder ${reorderItems.length} item(s). Total: ${INDIAN_CURRENCY}${totalInr.toLocaleString('en-IN')}. Shiprocket delivery: ${INDIAN_CURRENCY}${shiprocketDeliveryInr}.`
    whatsappSupplierMessage = `Hi, please reorder:\n${lines.join('\n')}\nTotal: ${INDIAN_CURRENCY}${totalInr.toLocaleString('en-IN')}. Delivery: Shiprocket ${INDIAN_CURRENCY}${shiprocketDeliveryInr}.`
  }

  // Optional: use Groq to refine message for supplier (friendlier, India SMB tone)
  if (reorderItems.length > 0 && process.env.GROQ_API_KEY) {
    try {
      const groq = getGroqClient()
      const prompt = `Rewrite this reorder message for an Indian SMB supplier (WhatsApp). Keep it short, professional, and in Indian English. Keep numbers and currency (₹) exactly as is. Return only the message, no preamble.\n\n${whatsappSupplierMessage}`
      const refined = await groq.generateCompletion(prompt, 'You are a concise business assistant for Indian SMBs. Output only the message text.')
      if (refined && refined.trim().length > 0) {
        whatsappSupplierMessage = refined.trim()
      }
    } catch (e) {
      console.warn('Retail agent Groq refine message failed:', e)
    }
  }

  // Create Purchase Order (step 4)
  if (reorderItems.length > 0) {
    try {
      let vendor = await prisma.vendor.findFirst({
        where: { tenantId, name: 'Reorder Supplier (Agent)' },
      })
      if (!vendor) {
        vendor = await prisma.vendor.create({
          data: {
            tenantId,
            name: 'Reorder Supplier (Agent)',
            companyName: 'Reorder Supplier',
            country: 'India',
            status: 'ACTIVE',
          },
        })
      }
      const poNum = `PO-${Date.now()}`
      const subtotal = totalInr
      const tax = 0
      const discount = 0
      const total = subtotal + tax - discount
      const po = await prisma.purchaseOrder.create({
        data: {
          tenantId,
          poNumber: poNum,
          vendorId: vendor.id,
          subtotal,
          tax,
          discount,
          total,
          status: 'DRAFT',
          notes: `Auto-generated by Retail Inventory Agent. Shiprocket delivery: ${INDIAN_CURRENCY}${shiprocketDeliveryInr}.`,
        },
      })
      for (const item of reorderItems) {
        await prisma.purchaseOrderItem.create({
          data: {
            poId: po.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.suggestedQty,
            unitPrice: item.unitPriceInr,
            taxRate: 0,
            taxAmount: 0,
            total: item.totalInr,
          },
        })
      }
      purchaseOrderId = po.id
      purchaseOrderNumber = po.poNumber
    } catch (e) {
      console.warn('Retail agent PO create failed:', e)
    }
  }

  return {
    tenantId,
    reorderItems,
    totalInr,
    shiprocketDeliveryInr,
    summaryMessage,
    whatsappSupplierMessage,
    triggeredAt: new Date().toISOString(),
    purchaseOrderId,
    purchaseOrderNumber,
  }
}
