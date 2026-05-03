/**
 * WATI WhatsApp Integration
 * Handles WhatsApp Business API via WATI
 */

interface WhatsAppMessage {
  to: string
  templateName: string
  languageCode?: string
  bodyParameters?: string[]
  mediaUrl?: string
}

class WATIClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.WATI_API_KEY || ''
    this.baseUrl = process.env.WATI_BASE_URL || 'https://api.wati.io'
  }

  async sendMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.apiKey) {
      console.warn('WATI API key not configured, skipping WhatsApp send')
      return
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/sendTemplateMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: message.to,
          template_name: message.templateName,
          language_code: message.languageCode || 'en',
          body_parameters: message.bodyParameters || [],
          media_url: message.mediaUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`WATI API error: ${response.status} ${error}`)
      }
    } catch (error) {
      console.error('WATI WhatsApp error:', error)
      throw error
    }
  }

  async sendBroadcast(recipients: string[], templateName: string, bodyParameters: Record<string, string[]>): Promise<void> {
    // Send to multiple recipients
    const promises = recipients.map(phone => 
      this.sendMessage({
        to: phone,
        templateName,
        bodyParameters: bodyParameters[phone] || [],
      })
    )

    await Promise.all(promises)
  }
}

let watiInstance: WATIClient | null = null

export function getWATIClient(): WATIClient {
  if (!watiInstance) {
    watiInstance = new WATIClient()
  }
  return watiInstance
}

export default getWATIClient()

