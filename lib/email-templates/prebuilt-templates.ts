/**
 * Pre-built Email Templates Library
 * Common email templates for various use cases
 */

export interface PrebuiltTemplate {
  id: string
  name: string
  category: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  description: string
}

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'onboarding',
    subject: 'Welcome to {{company}}!',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #53328A 0%, #F5C700 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to {{company}}!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi {{firstName}},</p>
    <p>We're thrilled to have you on board! Thank you for joining {{company}}.</p>
    <p>We're here to help you succeed. If you have any questions, feel free to reach out to us.</p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="{{dashboardUrl}}" style="background: #53328A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
    </div>
    <p>Best regards,<br>The {{company}} Team</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

We're thrilled to have you on board! Thank you for joining {{company}}.

We're here to help you succeed. If you have any questions, feel free to reach out to us.

Get Started: {{dashboardUrl}}

Best regards,
The {{company}} Team`,
    variables: ['firstName', 'company', 'dashboardUrl'],
    description: 'Welcome new users to your platform',
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    category: 'sales',
    subject: 'Quick question about {{company}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <p>Hi {{firstName}},</p>
    <p>I noticed that {{company}} is in the {{industry}} space. I thought you might be interested in learning how we've helped similar companies {{benefit}}.</p>
    <p>Would you be open to a quick 15-minute call this week to discuss?</p>
    <p>Best regards,<br>{{senderName}}<br>{{senderTitle}}<br>{{senderCompany}}</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

I noticed that {{company}} is in the {{industry}} space. I thought you might be interested in learning how we've helped similar companies {{benefit}}.

Would you be open to a quick 15-minute call this week to discuss?

Best regards,
{{senderName}}
{{senderTitle}}
{{senderCompany}}`,
    variables: ['firstName', 'company', 'industry', 'benefit', 'senderName', 'senderTitle', 'senderCompany'],
    description: 'Professional cold outreach email for sales',
  },
  {
    id: 'follow-up',
    name: 'Follow-up Email',
    category: 'sales',
    subject: 'Following up on our conversation',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <p>Hi {{firstName}},</p>
    <p>I wanted to follow up on our conversation about {{topic}}. I've attached the {{resource}} we discussed.</p>
    <p>Please let me know if you have any questions or if you'd like to schedule a follow-up call.</p>
    <p>Best regards,<br>{{senderName}}</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

I wanted to follow up on our conversation about {{topic}}. I've attached the {{resource}} we discussed.

Please let me know if you have any questions or if you'd like to schedule a follow-up call.

Best regards,
{{senderName}}`,
    variables: ['firstName', 'topic', 'resource', 'senderName'],
    description: 'Follow-up email after a meeting or conversation',
  },
  {
    id: 'invoice',
    name: 'Invoice Email',
    category: 'transactional',
    subject: 'Invoice #{{invoiceNumber}} from {{company}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <p>Hi {{firstName}},</p>
    <p>Please find attached invoice #{{invoiceNumber}} for {{amount}}.</p>
    <p><strong>Due Date:</strong> {{dueDate}}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="{{paymentLink}}" style="background: #53328A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a>
    </div>
    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
    <p>Best regards,<br>{{company}} Finance Team</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

Please find attached invoice #{{invoiceNumber}} for {{amount}}.

Due Date: {{dueDate}}

Pay Now: {{paymentLink}}

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
{{company}} Finance Team`,
    variables: ['firstName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink', 'company'],
    description: 'Invoice notification email',
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    category: 'marketing',
    subject: 'You left something in your cart!',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <p>Hi {{firstName}},</p>
    <p>We noticed you left some items in your cart. Don't miss out!</p>
    <p><strong>Items in your cart:</strong></p>
    <ul>
      {{#each items}}
      <li>{{name}} - {{price}}</li>
      {{/each}}
    </ul>
    <div style="margin: 30px 0; text-align: center;">
      <a href="{{cartUrl}}" style="background: #53328A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Purchase</a>
    </div>
    <p>This offer expires soon!</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

We noticed you left some items in your cart. Don't miss out!

Complete Your Purchase: {{cartUrl}}

This offer expires soon!`,
    variables: ['firstName', 'cartUrl', 'items'],
    description: 'Recover abandoned shopping carts',
  },
  {
    id: 're-engagement',
    name: 'Re-engagement Email',
    category: 'marketing',
    subject: 'We miss you, {{firstName}}!',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <p>Hi {{firstName}},</p>
    <p>We haven't seen you in a while, and we wanted to check in!</p>
    <p>We've got some exciting updates and special offers just for you:</p>
    <ul>
      <li>{{offer1}}</li>
      <li>{{offer2}}</li>
      <li>{{offer3}}</li>
    </ul>
    <div style="margin: 30px 0; text-align: center;">
      <a href="{{dashboardUrl}}" style="background: #53328A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Check It Out</a>
    </div>
    <p>We'd love to have you back!</p>
  </div>
</body>
</html>
    `.trim(),
    textContent: `Hi {{firstName}},

We haven't seen you in a while, and we wanted to check in!

We've got some exciting updates and special offers just for you.

Check It Out: {{dashboardUrl}}

We'd love to have you back!`,
    variables: ['firstName', 'offer1', 'offer2', 'offer3', 'dashboardUrl'],
    description: 'Re-engage inactive users',
  },
]

export function getTemplateById(id: string): PrebuiltTemplate | undefined {
  return PREBUILT_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): PrebuiltTemplate[] {
  return PREBUILT_TEMPLATES.filter(t => t.category === category)
}

export function getAllCategories(): string[] {
  return Array.from(new Set(PREBUILT_TEMPLATES.map(t => t.category)))
}

