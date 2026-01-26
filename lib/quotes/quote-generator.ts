/**
 * Quote Generator Service
 * Generates quotes from deals with line items
 */

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export interface QuoteLineItem {
  productId?: string
  productName: string
  description?: string
  quantity: number
  unitPrice: number
  discount?: number
}

export class QuoteGeneratorService {
  /**
   * Generate quote from deal
   */
  static async generateQuoteFromDeal(
    tenantId: string,
    dealId: string,
    lineItems: QuoteLineItem[],
    options?: {
      taxRate?: number
      discount?: number
      validUntil?: Date
    }
  ) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      include: {
        contact: true,
      },
    })

    if (!deal) {
      throw new Error('Deal not found')
    }

    // Calculate totals
    let subtotal = 0
    for (const item of lineItems) {
      const itemTotal = item.quantity * item.unitPrice
      const itemDiscount = item.discount || 0
      subtotal += itemTotal - itemDiscount
    }

    const discount = options?.discount || 0
    const subtotalAfterDiscount = subtotal - discount

    const taxRate = options?.taxRate || 0
    const tax = subtotalAfterDiscount * (taxRate / 100)
    const total = subtotalAfterDiscount + tax

    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber(tenantId)

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        tenantId,
        dealId,
        contactId: deal.contactId,
        quoteNumber,
        status: 'draft',
        subtotal,
        tax,
        discount,
        total,
        validUntil: options?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        lineItems: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice - (item.discount || 0),
          })),
        },
      },
      include: {
        lineItems: true,
        deal: true,
        contact: true,
      },
    })

    return quote
  }

  /**
   * Generate unique quote number
   */
  private static async generateQuoteNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `QT-${year}-`

    // Get last quote number for this year
    const lastQuote = await prisma.quote.findFirst({
      where: {
        tenantId,
        quoteNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { quoteNumber: 'desc' },
    })

    let sequence = 1
    if (lastQuote) {
      const lastSequence = parseInt(lastQuote.quoteNumber.replace(prefix, ''))
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1
      }
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`
  }

  /**
   * Update quote status
   */
  static async updateQuoteStatus(
    tenantId: string,
    quoteId: string,
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'rejected',
    metadata?: {
      acceptedAt?: Date
      rejectedAt?: Date
      rejectionReason?: string
    }
  ) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    })

    if (!quote) {
      throw new Error('Quote not found')
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: {
        status,
        ...(status === 'accepted' && { acceptedAt: metadata?.acceptedAt || new Date() }),
        ...(status === 'rejected' && {
          rejectedAt: metadata?.rejectedAt || new Date(),
          rejectionReason: metadata?.rejectionReason,
        }),
      },
      include: {
        lineItems: true,
        deal: true,
        contact: true,
      },
    })
  }

  /**
   * Get quote by ID
   */
  static async getQuote(tenantId: string, quoteId: string) {
    return prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: {
        lineItems: true,
        deal: true,
        contact: true,
      },
    })
  }

  /**
   * List quotes
   */
  static async listQuotes(
    tenantId: string,
    filters?: {
      dealId?: string
      contactId?: string
      status?: string
    }
  ) {
    return prisma.quote.findMany({
      where: {
        tenantId,
        ...(filters?.dealId && { dealId: filters.dealId }),
        ...(filters?.contactId && { contactId: filters.contactId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        lineItems: true,
        deal: true,
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Delete quote
   */
  static async deleteQuote(tenantId: string, quoteId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    })

    if (!quote) {
      throw new Error('Quote not found')
    }

    return prisma.quote.delete({
      where: { id: quoteId },
    })
  }
}
