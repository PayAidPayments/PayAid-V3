/**
 * PDF Generation for Invoices
 * Uses PDFKit to generate GST-compliant invoices
 */

import PDFDocument from 'pdfkit'
import { GSTCalculation } from './gst'
import { formatINR } from './gst'

export interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
  hsnCode?: string
  sacCode?: string
  gstRate: number
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate?: Date
  
  // Business details
  businessName: string
  businessAddress?: string
  businessCity?: string
  businessState?: string
  businessPostalCode?: string
  businessGSTIN?: string
  
  // Customer details
  customerName: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerPostalCode?: string
  customerGSTIN?: string
  
  // GST Details
  placeOfSupply?: string
  reverseCharge?: boolean
  
  // Invoice items
  items: InvoiceItem[]
  
  // Totals
  subtotal: number
  gst: GSTCalculation
  total: number
  
  // Additional info
  notes?: string
  terms?: string
}

/**
 * Convert number to words (Indian numbering system)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  
  if (num === 0) return 'Zero'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    return ones[hundred] + ' Hundred' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 100000) {
    const thousand = Math.floor(num / 1000)
    const remainder = num % 1000
    return numberToWords(thousand) + ' Thousand' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 10000000) {
    const lakh = Math.floor(num / 100000)
    const remainder = num % 100000
    return numberToWords(lakh) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  const crore = Math.floor(num / 10000000)
  const remainder = num % 10000000
  return numberToWords(crore) + ' Crore' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
}

/**
 * Generate PDF buffer for invoice
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const buffers: Buffer[] = []
      
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold')
      doc.text('TAX INVOICE', { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica')
      doc.text('Original for Recipient', { align: 'center' })
      doc.moveDown(1)
      
      // Business and Customer Details (Side by Side)
      const startY = doc.y
      const leftX = 50
      const rightX = 300
      const colWidth = 200
      
      // Business Details (Left)
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text('From:', leftX, startY)
      doc.fontSize(10).font('Helvetica')
      doc.text(data.businessName, leftX, doc.y + 5)
      if (data.businessAddress) doc.text(data.businessAddress, leftX, doc.y + 3)
      if (data.businessCity || data.businessState) {
        doc.text(`${data.businessCity || ''}${data.businessCity && data.businessState ? ', ' : ''}${data.businessState || ''} ${data.businessPostalCode || ''}`, leftX, doc.y + 3)
      }
      if (data.businessGSTIN) {
        doc.font('Helvetica-Bold')
        doc.text(`GSTIN: ${data.businessGSTIN}`, leftX, doc.y + 5)
        doc.font('Helvetica')
      }
      
      // Customer Details (Right)
      const customerStartY = startY
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text('To:', rightX, customerStartY)
      doc.fontSize(10).font('Helvetica')
      doc.text(data.customerName, rightX, doc.y + 5)
      if (data.customerAddress) doc.text(data.customerAddress, rightX, doc.y + 3)
      if (data.customerCity || data.customerState) {
        doc.text(`${data.customerCity || ''}${data.customerCity && data.customerState ? ', ' : ''}${data.customerState || ''} ${data.customerPostalCode || ''}`, rightX, doc.y + 3)
      }
      if (data.customerGSTIN) {
        doc.font('Helvetica-Bold')
        doc.text(`GSTIN: ${data.customerGSTIN}`, rightX, doc.y + 5)
        doc.font('Helvetica')
      }
      
      // Invoice Details
      const invoiceDetailsY = Math.max(doc.y, customerStartY + 60) + 20
      doc.fontSize(10)
      doc.text(`Invoice Number: ${data.invoiceNumber}`, leftX, invoiceDetailsY)
      doc.text(`Invoice Date: ${data.invoiceDate.toLocaleDateString('en-IN')}`, leftX, doc.y + 5)
      if (data.dueDate) {
        doc.text(`Due Date: ${data.dueDate.toLocaleDateString('en-IN')}`, leftX, doc.y + 5)
      }
      if (data.placeOfSupply) {
        doc.text(`Place of Supply: ${data.placeOfSupply}`, leftX, doc.y + 5)
      }
      if (data.reverseCharge) {
        doc.font('Helvetica-Bold')
        doc.text('Reverse Charge: Yes', leftX, doc.y + 5)
        doc.font('Helvetica')
      }
      
      doc.moveDown(1.5)
      
      // Items Table
      const tableTop = doc.y
      const itemHeight = 25
      const colWidths = [30, 200, 60, 60, 60, 60, 60] // Sr, Description, HSN/SAC, Qty, Rate, Amount, GST%
      
      // Table Header
      doc.fontSize(9).font('Helvetica-Bold')
      doc.text('Sr', leftX, tableTop)
      doc.text('Description', leftX + colWidths[0], tableTop)
      doc.text('HSN/SAC', leftX + colWidths[0] + colWidths[1], tableTop)
      doc.text('Qty', leftX + colWidths[0] + colWidths[1] + colWidths[2], tableTop)
      doc.text('Rate', leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop)
      doc.text('Amount', leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop)
      doc.text('GST%', leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], tableTop)
      
      // Draw header line
      doc.moveTo(leftX, tableTop + 15).lineTo(leftX + 550, tableTop + 15).stroke()
      
      // Table Rows
      doc.fontSize(9).font('Helvetica')
      let currentY = tableTop + 20
      
      data.items.forEach((item, index) => {
        const hsnSac = item.hsnCode || item.sacCode || '-'
        doc.text(String(index + 1), leftX, currentY)
        doc.text(item.description.substring(0, 40), leftX + colWidths[0], currentY)
        doc.text(hsnSac, leftX + colWidths[0] + colWidths[1], currentY)
        doc.text(String(item.quantity), leftX + colWidths[0] + colWidths[1] + colWidths[2], currentY, { align: 'right' })
        doc.text(formatINR(item.rate), leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, { align: 'right' })
        doc.text(formatINR(item.amount), leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentY, { align: 'right' })
        doc.text(`${item.gstRate}%`, leftX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], currentY, { align: 'right' })
        currentY += itemHeight
      })
      
      // Draw bottom line
      doc.moveTo(leftX, currentY).lineTo(leftX + 550, currentY).stroke()
      
      doc.moveDown(1)
      
      // Totals Section
      const totalsX = 350
      doc.fontSize(10)
      doc.text('Subtotal:', totalsX, doc.y, { align: 'right', width: 150 })
      doc.text(formatINR(data.subtotal), totalsX + 150, doc.y, { align: 'right' })
      
      if (data.gst.isInterState) {
        doc.text('IGST:', totalsX, doc.y + 5, { align: 'right', width: 150 })
        doc.text(formatINR(data.gst.igst), totalsX + 150, doc.y - 5, { align: 'right' })
      } else {
        doc.text('CGST:', totalsX, doc.y + 5, { align: 'right', width: 150 })
        doc.text(formatINR(data.gst.cgst), totalsX + 150, doc.y - 5, { align: 'right' })
        doc.text('SGST:', totalsX, doc.y + 5, { align: 'right', width: 150 })
        doc.text(formatINR(data.gst.sgst), totalsX + 150, doc.y - 5, { align: 'right' })
      }
      
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('Total:', totalsX, doc.y + 10, { align: 'right', width: 150 })
      doc.text(formatINR(data.total), totalsX + 150, doc.y - 10, { align: 'right' })
      doc.font('Helvetica')
      
      // Amount in Words
      doc.moveDown(1)
      doc.fontSize(10)
      const amountWords = numberToWords(Math.floor(data.total)) + ' Rupees Only'
      doc.text(`Amount in Words: ${amountWords}`, leftX, doc.y)
      
      // Notes and Terms
      if (data.notes) {
        doc.moveDown(1)
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('Notes:', leftX, doc.y)
        doc.font('Helvetica')
        doc.text(data.notes, leftX, doc.y + 5, { width: 500 })
      }
      
      if (data.terms) {
        doc.moveDown(1)
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('Terms & Conditions:', leftX, doc.y)
        doc.font('Helvetica')
        doc.text(data.terms, leftX, doc.y + 5, { width: 500 })
      }
      
      // Footer
      doc.fontSize(8)
      doc.text('This is a computer-generated invoice.', 50, doc.page.height - 50, { align: 'center', width: 500 })
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate invoice PDF and return as base64
 */
export async function generateInvoicePDFBase64(data: InvoiceData): Promise<string> {
  const pdfBuffer = await generateInvoicePDF(data)
  return pdfBuffer.toString('base64')
}

/**
 * Generate Payslip PDF
 */
export interface PayslipData {
  employeeName: string
  employeeCode: string
  month: number
  year: number
  department?: string
  designation?: string
  
  // Earnings
  basic: number
  hra: number
  allowances: number
  grossEarnings: number
  
  // Deductions
  pf: number
  esi: number
  pt: number
  tds: number
  lop: number
  totalDeductions: number
  
  // Net Pay
  netPay: number
  
  // Additional Info
  daysPaid: number
  totalDays: number
}

export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const buffers: Buffer[] = []
      
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold')
      doc.text('SALARY STATEMENT', { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica')
      doc.text(`For the month of ${new Date(data.year, data.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`, { align: 'center' })
      doc.moveDown(1)
      
      // Employee Details
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text('Employee Details:', 50, doc.y)
      doc.fontSize(10).font('Helvetica')
      doc.text(`Name: ${data.employeeName}`, 50, doc.y + 5)
      doc.text(`Employee Code: ${data.employeeCode}`, 50, doc.y + 5)
      if (data.department) doc.text(`Department: ${data.department}`, 50, doc.y + 5)
      if (data.designation) doc.text(`Designation: ${data.designation}`, 50, doc.y + 5)
      doc.text(`Days Paid: ${data.daysPaid} / ${data.totalDays}`, 50, doc.y + 5)
      
      doc.moveDown(1)
      
      // Earnings Table
      const earningsTop = doc.y
      doc.fontSize(11).font('Helvetica-Bold')
      doc.text('EARNINGS', 50, earningsTop)
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica')
      
      doc.text('Basic Salary', 50, doc.y)
      doc.text(formatINR(data.basic), 400, doc.y, { align: 'right' })
      
      doc.text('HRA', 50, doc.y + 5)
      doc.text(formatINR(data.hra), 400, doc.y - 5, { align: 'right' })
      
      doc.text('Allowances', 50, doc.y + 5)
      doc.text(formatINR(data.allowances), 400, doc.y - 5, { align: 'right' })
      
      doc.font('Helvetica-Bold')
      doc.text('Gross Earnings', 50, doc.y + 10)
      doc.text(formatINR(data.grossEarnings), 400, doc.y - 10, { align: 'right' })
      doc.font('Helvetica')
      
      doc.moveDown(1)
      
      // Deductions Table
      const deductionsTop = doc.y
      doc.fontSize(11).font('Helvetica-Bold')
      doc.text('DEDUCTIONS', 50, deductionsTop)
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica')
      
      if (data.pf > 0) {
        doc.text('Provident Fund (PF)', 50, doc.y)
        doc.text(formatINR(data.pf), 400, doc.y, { align: 'right' })
      }
      
      if (data.esi > 0) {
        doc.text('Employee State Insurance (ESI)', 50, doc.y + 5)
        doc.text(formatINR(data.esi), 400, doc.y - 5, { align: 'right' })
      }
      
      if (data.pt > 0) {
        doc.text('Professional Tax (PT)', 50, doc.y + 5)
        doc.text(formatINR(data.pt), 400, doc.y - 5, { align: 'right' })
      }
      
      if (data.tds > 0) {
        doc.text('Tax Deducted at Source (TDS)', 50, doc.y + 5)
        doc.text(formatINR(data.tds), 400, doc.y - 5, { align: 'right' })
      }
      
      if (data.lop > 0) {
        doc.text('Loss of Pay (LOP)', 50, doc.y + 5)
        doc.text(formatINR(data.lop), 400, doc.y - 5, { align: 'right' })
      }
      
      doc.font('Helvetica-Bold')
      doc.text('Total Deductions', 50, doc.y + 10)
      doc.text(formatINR(data.totalDeductions), 400, doc.y - 10, { align: 'right' })
      doc.font('Helvetica')
      
      doc.moveDown(1)
      
      // Net Pay
      doc.fontSize(14).font('Helvetica-Bold')
      doc.text('NET PAY', 50, doc.y)
      doc.text(formatINR(data.netPay), 400, doc.y, { align: 'right' })
      
      // Amount in Words
      doc.moveDown(1)
      doc.fontSize(10).font('Helvetica')
      const amountWords = numberToWords(Math.floor(data.netPay)) + ' Rupees Only'
      doc.text(`Amount in Words: ${amountWords}`, 50, doc.y)
      
      // Footer
      doc.fontSize(8)
      doc.text('This is a computer-generated payslip.', 50, doc.page.height - 50, { align: 'center', width: 500 })
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
