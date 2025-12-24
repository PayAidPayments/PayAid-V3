/**
 * Order Confirmation Email Service
 * 
 * Sends order confirmation emails after successful payment
 */

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  amount: number
  modules: string[]
  orderDate: string
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  // TODO: Implement email sending
  // For now, just log
  console.log('📧 Order Confirmation Email:', {
    to: data.customerEmail,
    subject: `Order Confirmation - ${data.orderNumber}`,
    orderNumber: data.orderNumber,
    amount: data.amount,
    modules: data.modules,
  })

  // In production, use your email service (SendGrid, Resend, etc.)
  // Example:
  // await emailService.send({
  //   to: data.customerEmail,
  //   subject: `Order Confirmation - ${data.orderNumber}`,
  //   html: generateOrderConfirmationHTML(data),
  // })
}

function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Order Confirmed!</h1>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your purchase. Your order has been confirmed and your modules have been activated.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
            <p><strong>Modules:</strong> ${data.modules.map(m => m.toUpperCase()).join(', ')}</p>
          </div>
          
          <p>You can now access your modules from your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Go to Dashboard
          </a>
          
          <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `
}

