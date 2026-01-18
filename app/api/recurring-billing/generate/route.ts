import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

// POST /api/recurring-billing/generate - Generate invoices from recurring templates
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const { invoiceId, generateForDate } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Get the recurring invoice template
    const template = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        notes: { contains: 'RECURRING_INVOICE_TEMPLATE', mode: 'insensitive' },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Recurring invoice template not found' },
        { status: 404 }
      )
    }

    const targetDate = generateForDate ? new Date(generateForDate) : new Date()
    // Extract frequency from notes
    const frequencyMatch = template.notes?.match(/FREQUENCY:(\w+)/)
    const frequency = frequencyMatch ? frequencyMatch[1] : 'monthly'
    
    const lastGenerated = template.updatedAt || template.createdAt
    const shouldGenerate = shouldGenerateInvoice(lastGenerated, targetDate, frequency)

    if (!shouldGenerate) {
      const frequencyMatch = template.notes?.match(/FREQUENCY:(\w+)/)
      const frequency = frequencyMatch ? frequencyMatch[1] : 'monthly'
      
      return NextResponse.json({
        message: 'Invoice not due for generation yet',
        nextGenerationDate: getNextGenerationDate(lastGenerated, frequency),
      })
    }

    // Generate new invoice from template
    const count = await prisma.invoice.count({ where: { tenantId } })
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`

    const newInvoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: template.customerId,
        customerName: template.customerName,
        customerEmail: template.customerEmail,
        customerAddress: template.customerAddress,
        customerCity: template.customerCity,
        customerState: template.customerState,
        customerPostalCode: template.customerPostalCode,
        customerGSTIN: template.customerGSTIN,
        subtotal: template.subtotal,
        tax: template.tax,
        total: template.total,
        gstRate: template.gstRate,
        items: template.items ?? Prisma.JsonNull,
        status: 'draft',
        notes: template.notes,
        terms: template.termsAndConditions,
      },
    })

    // Update template's updatedAt to track last generation
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        updatedAt: targetDate,
      },
    })

    return NextResponse.json({
      invoice: newInvoice,
      message: 'Invoice generated successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Generate recurring invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recurring invoice' },
      { status: 500 }
    )
  }
}

function shouldGenerateInvoice(lastDate: Date, currentDate: Date, frequency: string): boolean {
  const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  switch (frequency.toLowerCase()) {
    case 'daily':
      return daysDiff >= 1
    case 'weekly':
      return daysDiff >= 7
    case 'monthly':
      return daysDiff >= 30
    case 'quarterly':
      return daysDiff >= 90
    case 'yearly':
      return daysDiff >= 365
    default:
      return daysDiff >= 30 // Default to monthly
  }
}

function getNextGenerationDate(lastDate: Date, frequency: string): Date {
  const next = new Date(lastDate)

  switch (frequency.toLowerCase()) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      next.setMonth(next.getMonth() + 1)
  }

  return next
}

