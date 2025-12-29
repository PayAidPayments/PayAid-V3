/**
 * Receipt PDF Generation for Retail Transactions
 * Uses PDFKit to generate thermal printer-compatible receipts
 */

import PDFDocument from 'pdfkit'

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ReceiptData {
  transactionNumber: string
  transactionDate: Date
  businessName: string
  businessAddress?: string
  businessCity?: string
  businessState?: string
  businessPostalCode?: string
  businessGSTIN?: string
  businessPhone?: string
  customerName: string
  customerPhone?: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
}

/**
 * Format currency in Indian Rupees
 */
function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Generate receipt PDF buffer
 * Optimized for thermal printers (80mm width)
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Thermal printer width: 80mm = ~226 points (at 72 DPI)
      const doc = new PDFDocument({ 
        margin: 20, 
        size: [226, 'auto'], // 80mm width, auto height
        autoFirstPage: true,
      })
      const buffers: Buffer[] = []
      
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)
      
      // Header
      doc.fontSize(14).font('Helvetica-Bold')
      doc.text(data.businessName, { align: 'center' })
      doc.moveDown(0.3)
      
      // Business details
      if (data.businessAddress) {
        doc.fontSize(8).font('Helvetica')
        doc.text(data.businessAddress, { align: 'center' })
      }
      if (data.businessCity || data.businessState) {
        const cityState = `${data.businessCity || ''}${data.businessCity && data.businessState ? ', ' : ''}${data.businessState || ''} ${data.businessPostalCode || ''}`.trim()
        if (cityState) {
          doc.text(cityState, { align: 'center' })
        }
      }
      if (data.businessPhone) {
        doc.text(`Phone: ${data.businessPhone}`, { align: 'center' })
      }
      if (data.businessGSTIN) {
        doc.font('Helvetica-Bold')
        doc.text(`GSTIN: ${data.businessGSTIN}`, { align: 'center' })
        doc.font('Helvetica')
      }
      
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('RECEIPT', { align: 'center' })
      doc.moveDown(0.3)
      
      // Transaction details
      doc.fontSize(8).font('Helvetica')
      doc.text(`Transaction #: ${data.transactionNumber}`, { align: 'left' })
      doc.text(`Date: ${data.transactionDate.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'left' })
      
      if (data.customerName && data.customerName !== 'Walk-in Customer') {
        doc.text(`Customer: ${data.customerName}`, { align: 'left' })
        if (data.customerPhone) {
          doc.text(`Phone: ${data.customerPhone}`, { align: 'left' })
        }
      }
      
      doc.moveDown(0.3)
      doc.text('─'.repeat(30), { align: 'center' })
      doc.moveDown(0.3)
      
      // Items table
      doc.fontSize(8).font('Helvetica-Bold')
      doc.text('Items', { align: 'left' })
      doc.moveDown(0.2)
      
      doc.font('Helvetica')
      data.items.forEach((item) => {
        // Item name (may wrap)
        const itemText = doc.heightOfString(item.name, { width: 100 })
        doc.text(item.name, { width: 100, continued: false })
        
        // Quantity and price on same line
        const qtyPrice = `${item.quantity} x ${formatINR(item.unitPrice)}`
        doc.text(qtyPrice, { align: 'right', width: 100 })
        
        // Subtotal
        doc.text(formatINR(item.subtotal), { align: 'right' })
        doc.moveDown(0.1)
      })
      
      doc.moveDown(0.2)
      doc.text('─'.repeat(30), { align: 'center' })
      doc.moveDown(0.2)
      
      // Totals
      doc.fontSize(8).font('Helvetica')
      doc.text(`Subtotal:`, { continued: true, width: 150 })
      doc.text(formatINR(data.subtotal), { align: 'right' })
      
      if (data.discount > 0) {
        doc.text(`Discount:`, { continued: true, width: 150 })
        doc.text(`-${formatINR(data.discount)}`, { align: 'right' })
      }
      
      if (data.tax > 0) {
        doc.text(`Tax (GST):`, { continued: true, width: 150 })
        doc.text(formatINR(data.tax), { align: 'right' })
      }
      
      doc.moveDown(0.2)
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text(`Total:`, { continued: true, width: 150 })
      doc.text(formatINR(data.total), { align: 'right' })
      
      doc.moveDown(0.3)
      doc.fontSize(8).font('Helvetica')
      doc.text('─'.repeat(30), { align: 'center' })
      doc.moveDown(0.3)
      
      // Payment details
      doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, { align: 'center' })
      doc.text(`Status: ${data.paymentStatus}`, { align: 'center' })
      
      doc.moveDown(0.5)
      doc.fontSize(7).font('Helvetica')
      doc.text('Thank you for your business!', { align: 'center' })
      doc.text('Please visit us again', { align: 'center' })
      
      // Footer
      doc.moveDown(0.5)
      doc.text('─'.repeat(30), { align: 'center' })
      doc.fontSize(6)
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' })
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

