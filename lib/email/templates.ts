/**
 * Email Templates
 * Pre-built email templates for common use cases
 */

export const emailTemplates = {
  welcome: {
    subject: 'Welcome to PayAid!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PayAid!</h1>
          </div>
          <div class="content">
            <p>Hi {{name}},</p>
            <p>Welcome to PayAid - your all-in-one business operating system!</p>
            <p>We're excited to help you manage your business more efficiently.</p>
            <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The PayAid Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  
  invoice: {
    subject: 'Invoice {{invoiceNumber}} from {{businessName}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .invoice-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; color: #0ea5e9; }
          .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .payment-button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice {{invoiceNumber}}</h1>
          </div>
          <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Please find attached your invoice from {{businessName}}.</p>
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
              <p><strong>Invoice Date:</strong> {{invoiceDate}}</p>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
              <p><strong>Amount:</strong> <span class="total">₹{{total}}</span></p>
            </div>
            {{#if paymentLinkUrl}}
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{paymentLinkUrl}}" class="payment-button">Pay Now</a>
            </p>
            <p style="text-align: center; color: #666; font-size: 14px;">
              Click the button above to pay securely via PayAid Payments
            </p>
            {{/if}}
            <a href="{{invoiceUrl}}" class="button">View Invoice</a>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>{{businessName}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  orderConfirmation: {
    subject: 'Order Confirmation - {{orderNumber}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Thank you for your order!</p>
            <div class="order-details">
              <p><strong>Order Number:</strong> {{orderNumber}}</p>
              <p><strong>Order Date:</strong> {{orderDate}}</p>
              <p><strong>Total Amount:</strong> ₹{{total}}</p>
            </div>
            <a href="{{orderTrackingUrl}}" class="button">Track Your Order</a>
            <p>We'll send you updates as your order is processed.</p>
            <p>Best regards,<br>{{businessName}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, value)
  }
  return rendered
}

