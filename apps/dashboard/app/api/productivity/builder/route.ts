/**
 * PayAid Document Builder – generate docs from templates + CRM/Finance data.
 * Built-in: uses pdf-lib to generate invoice/proposal PDF when DOCUMENT_BUILDER_URL is not set.
 * Optional: wire to ONLYOFFICE Document Builder when DOCUMENT_BUILDER_URL is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyProductivityProxyToken } from '@/lib/productivity/verify-proxy-token'
import { prisma } from '@/lib/db/prisma'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId = body.tenantId as string
    const templateId = body.templateId as string
    const contactId = body.contactId as string | undefined
    const invoiceId = body.invoiceId as string | undefined

    if (!tenantId || !templateId) {
      return NextResponse.json({ error: 'tenantId and templateId required' }, { status: 400 })
    }

    verifyProductivityProxyToken(request, tenantId)

    const builderUrl = process.env.DOCUMENT_BUILDER_URL

    // Fetch contact/invoice for both built-in and external builder
    let contact: { name: string; email: string | null; company: string | null } | null = null
    let invoice: {
      invoiceNumber: string
      total: number
      customerName: string | null
      subtotal: number
      tax: number
    } | null = null

    if (contactId) {
      const c = await prisma.contact.findFirst({
        where: { id: contactId, tenantId },
        select: { name: true, email: true, company: true },
      })
      contact = c
    }
    if (invoiceId) {
      const inv = await prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: {
          invoiceNumber: true,
          total: true,
          customerName: true,
          subtotal: true,
          tax: true,
        },
      })
      invoice = inv
    }

    if (builderUrl) {
      const buildEndpoint = builderUrl.replace(/\/$/, '') + '/build'
      const res = await fetch(buildEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          tenantId,
          contactId: contactId || undefined,
          invoiceId: invoiceId || undefined,
          data: { contact, invoice },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json({
          message: data.message || data.error || 'External builder failed',
          fileId: null,
          downloadUrl: null,
        })
      }
      return NextResponse.json({
        message: data.message ?? 'Document generated.',
        fileId: data.fileId ?? null,
        downloadUrl: data.downloadUrl ?? null,
        pdfBase64: data.pdfBase64 ?? null,
        filename: data.filename ?? null,
      })
    }

    // Built-in: generate PDF with pdf-lib
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const page = doc.addPage([595, 842])
    const { width, height } = page.getSize()
    let y = height - 50

    const drawText = (text: string, size: number, useBold = false) => {
      const f = useBold ? bold : font
      page.drawText(text, { x: 50, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
      y -= size + 4
    }

    if (templateId === 'invoice' && invoice) {
      drawText('INVOICE', 24, true)
      y -= 10
      drawText(`Invoice #: ${invoice.invoiceNumber}`, 12)
      drawText(`Customer: ${invoice.customerName || '—'}`, 12)
      drawText(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, 12)
      drawText(`Tax: ₹${invoice.tax.toFixed(2)}`, 12)
      drawText(`Total: ₹${invoice.total.toFixed(2)}`, 14, true)
    } else if ((templateId === 'proposal' || templateId === 'offer-letter') && contact) {
      drawText(templateId === 'proposal' ? 'PROPOSAL' : 'OFFER LETTER', 24, true)
      y -= 10
      drawText(`To: ${contact.name}`, 12)
      if (contact.company) drawText(`Company: ${contact.company}`, 12)
      if (contact.email) drawText(`Email: ${contact.email}`, 12)
      drawText('', 12)
      drawText('We are pleased to present this document for your consideration.', 11)
    } else {
      drawText(templateId.toUpperCase().replace(/-/g, ' '), 20, true)
      y -= 10
      if (contact) {
        drawText(`Contact: ${contact.name}`, 12)
        if (contact.company) drawText(`Company: ${contact.company}`, 12)
      }
      if (invoice) {
        drawText(`Invoice: ${invoice.invoiceNumber} – ₹${invoice.total.toFixed(2)}`, 12)
      }
    }

    const pdfBytes = await doc.save()
    const base64 = Buffer.from(pdfBytes).toString('base64')

    return NextResponse.json({
      message: 'Document generated.',
      fileId: null,
      downloadUrl: null,
      pdfBase64: base64,
      filename: `PayAid-${templateId}-${Date.now()}.pdf`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
