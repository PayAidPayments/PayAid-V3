import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const bodySchema = z.object({
  quantity_to_order: z.number().positive('quantity_to_order must be positive'),
  /** Optional: if provided, a DRAFT PurchaseOrder is created for this vendor */
  vendor_id: z.string().optional(),
  supplier_note: z.string().max(500).optional(),
})

type Params = { params: { id: string } }

/**
 * POST /api/v1/inventory/reorder-triggers/[id]/approve
 *
 * Approves a reorder trigger for an InventoryLocation entry.
 * - Always emits an AuditLog with entityType: 'reorder_request'.
 * - If vendor_id is supplied, creates a DRAFT PurchaseOrder with one line item.
 *
 * Returns: { reorder_id, trigger_id, product_id, product_name, quantity_approved,
 *            po_draft: { po_id, po_number } | null, approved_at }
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const validated = bodySchema.parse(body)

    // Verify trigger belongs to this tenant
    const trigger = await prisma.inventoryLocation.findFirst({
      where: { id: params.id, tenantId, reorderLevel: { not: null } },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        location: { select: { id: true, name: true } },
      },
    })

    if (!trigger) {
      return NextResponse.json({ error: 'Reorder trigger not found' }, { status: 404 })
    }

    const approvedAt = new Date()
    const reorderId = `reo_${Date.now()}`
    let poDraft: { po_id: string; po_number: string } | null = null

    // Optionally create a DRAFT PurchaseOrder
    if (validated.vendor_id) {
      // Verify the vendor belongs to this tenant
      const vendor = await prisma.vendor.findFirst({
        where: { id: validated.vendor_id, tenantId },
        select: { id: true },
      })
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found or does not belong to this tenant' }, { status: 404 })
      }

      const poNumber = `PO-REORDER-${Date.now()}`
      const unitPrice = trigger.product.costPrice
      const lineTotal = unitPrice * validated.quantity_to_order

      const po = await prisma.purchaseOrder.create({
        data: {
          tenantId,
          poNumber,
          vendorId: validated.vendor_id,
          status: 'DRAFT',
          subtotal: lineTotal,
          tax: 0,
          total: lineTotal,
          notes: validated.supplier_note ?? `Reorder for ${trigger.product.name} — trigger id: ${params.id}`,
          items: {
            create: {
              productId: trigger.productId,
              productName: trigger.product.name,
              quantity: validated.quantity_to_order,
              unitPrice,
              taxRate: 0,
              taxAmount: 0,
              total: lineTotal,
            },
          },
        },
        select: { id: true, poNumber: true },
      })
      poDraft = { po_id: po.id, po_number: po.poNumber }
    }

    // Emit audit log (non-fatal)
    prisma.auditLog
      .create({
        data: {
          tenantId,
          entityType: 'reorder_request',
          entityId: params.id,
          changedBy: userId ?? 'system',
          changeSummary: 'reorder_approved',
          afterSnapshot: {
            trigger_id: params.id,
            product_id: trigger.productId,
            product_name: trigger.product.name,
            sku: trigger.product.sku,
            location_id: trigger.locationId,
            location_name: trigger.location?.name ?? null,
            quantity_approved: validated.quantity_to_order,
            quantity_on_hand: trigger.quantity,
            reorder_level: trigger.reorderLevel,
            vendor_id: validated.vendor_id ?? null,
            supplier_note: validated.supplier_note ?? null,
            po_number: poDraft?.po_number ?? null,
            approved_at: approvedAt.toISOString(),
          } as object,
        },
      })
      .catch(() => {})

    return NextResponse.json(
      {
        reorder_id: reorderId,
        trigger_id: params.id,
        product_id: trigger.productId,
        product_name: trigger.product.name,
        sku: trigger.product.sku,
        quantity_approved: validated.quantity_to_order,
        reorder_level: trigger.reorderLevel,
        quantity_on_hand: trigger.quantity,
        po_draft: poDraft,
        supplier_note: validated.supplier_note ?? null,
        status: 'approved',
        approved_at: approvedAt.toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[inventory/reorder-triggers/approve] error:', error)
    return NextResponse.json({ error: 'Failed to approve reorder trigger' }, { status: 500 })
  }
}
