/**
 * Background Job: Send Invoice Email with Payment Link
 * Processes 'send-invoice-with-payment-link' jobs from the queue
 */

import { prisma } from '@/lib/db/prisma'
import { emailTemplates, renderTemplate } from '@/lib/email/templates'
import { getSendGridClient } from '@/lib/email/sendgrid'
import { format } from 'date-fns'

/**
 * Process send-invoice-with-payment-link job
 */
export async function processSendInvoiceWithPaymentLink(jobData: {
  invoiceId: string
  recipientEmail: string
  paymentLinkUrl: string
  invoiceNumber: string
  customerName: string
  amount: number
  dueDate: Date | null
  tenantName: string
}) {
  try {
    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: jobData.invoiceId },
      include: {
        customer: true,
        tenant: true,
      },
    })

    if (!invoice) {
      throw new Error(`Invoice not found: ${jobData.invoiceId}`)
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    // Prepare template variables
    const templateVars = {
      invoiceNumber: invoice.invoiceNumber,
      businessName: invoice.tenant.name,
      customerName: jobData.customerName,
      invoiceDate: format(invoice.invoiceDate, 'dd MMM yyyy'),
      dueDate: jobData.dueDate ? format(jobData.dueDate, 'dd MMM yyyy') : 'N/A',
      total: invoice.total.toLocaleString('en-IN', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      invoiceUrl: `${baseUrl}/dashboard/invoices/${invoice.id}`,
      paymentLinkUrl: jobData.paymentLinkUrl,
    }

    // Render email template
    let emailHtml = emailTemplates.invoice.html
    
    // Replace template variables
    emailHtml = renderTemplate(emailHtml, templateVars)
    
    // Handle payment link button (conditional rendering)
    if (jobData.paymentLinkUrl) {
      emailHtml = emailHtml.replace(
        '{{#if paymentLinkUrl}}',
        ''
      ).replace(
        '{{/if}}',
        ''
      )
      emailHtml = emailHtml.replace(
        '{{paymentLinkUrl}}',
        jobData.paymentLinkUrl
      )
    } else {
      // Remove payment button section if no payment link
      emailHtml = emailHtml.replace(
        /{{#if paymentLinkUrl}}[\s\S]*?{{paymentLinkUrl}}[\s\S]*?{{#if}}/g,
        ''
      )
    }

    const emailSubject = renderTemplate(
      emailTemplates.invoice.subject,
      templateVars
    )

    // Send email via SendGrid
    const sendGrid = getSendGridClient()
    
    try {
      await sendGrid.sendEmail({
        to: jobData.recipientEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.io',
        subject: emailSubject,
        html: emailHtml,
        text: `Invoice ${invoice.invoiceNumber} from ${invoice.tenant.name}\n\nAmount: ₹${templateVars.total}\n\nPayment Link: ${jobData.paymentLinkUrl || 'N/A'}\n\nView Invoice: ${templateVars.invoiceUrl}`,
      }, {
        opens: true,
        clicks: true,
      })

      console.log(`Invoice email sent: ${invoice.invoiceNumber} to ${jobData.recipientEmail}`)
    } catch (error) {
      // Fallback: Log email (for development or if SendGrid fails)
      console.log('=== INVOICE EMAIL (SendGrid error or not configured) ===')
      console.log(`To: ${jobData.recipientEmail}`)
      console.log(`Subject: ${emailSubject}`)
      console.log(`Payment Link: ${jobData.paymentLinkUrl}`)
      console.log('==============================================')
      // Don't throw - allow job to complete even if email fails
    }

    return { success: true }
  } catch (error: any) {
    console.error('Send invoice with payment link error:', error)
    throw error
  }
}
