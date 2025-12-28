/**
 * SendGrid Email Integration
 * Handles all email sending via SendGrid API
 */

interface EmailOptions {
  to: string | string[]
  from: string
  subject: string
  html?: string
  text?: string
  templateId?: string
  dynamicTemplateData?: Record<string, any>
  attachments?: Array<{
    content: string
    filename: string
    type?: string
  }>
}

interface EmailTracking {
  opens?: boolean
  clicks?: boolean
  subscriptionTracking?: boolean
}

class SendGridClient {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || ''
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com'
  }

  async sendEmail(options: EmailOptions, tracking?: EmailTracking): Promise<void> {
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured, skipping email send')
      return
    }

    const payload: any = {
      personalizations: [
        {
          to: Array.isArray(options.to)
            ? options.to.map(email => ({ email }))
            : [{ email: options.to }],
          subject: options.subject,
        },
      ],
      from: {
        email: options.from || this.fromEmail,
      },
      content: [],
    }

    if (options.html) {
      payload.content.push({
        type: 'text/html',
        value: options.html,
      })
    }

    if (options.text) {
      payload.content.push({
        type: 'text/plain',
        value: options.text,
      })
    }

    if (options.templateId) {
      payload.templateId = options.templateId
      if (options.dynamicTemplateData) {
        payload.personalizations[0].dynamicTemplateData = options.dynamicTemplateData
      }
    }

    if (options.attachments) {
      payload.attachments = options.attachments
    }

    if (tracking) {
      payload.trackingSettings = {
        clickTracking: {
          enable: tracking.clicks !== false,
        },
        openTracking: {
          enable: tracking.opens !== false,
        },
        subscriptionTracking: {
          enable: tracking.subscriptionTracking !== false,
        },
      }
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${response.status} ${error}`)
      }
    } catch (error) {
      console.error('SendGrid email error:', error)
      throw error
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    dynamicTemplateData: Record<string, any>,
    subject?: string
  ): Promise<void> {
    return this.sendEmail({
      to,
      from: this.fromEmail,
      subject: subject || 'Email from PayAid',
      templateId,
      dynamicTemplateData,
    })
  }
}

// Singleton instance
let sendGridInstance: SendGridClient | null = null

export function getSendGridClient(): SendGridClient {
  if (!sendGridInstance) {
    sendGridInstance = new SendGridClient()
  }
  return sendGridInstance
}

export default getSendGridClient()

