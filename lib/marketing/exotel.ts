/**
 * Exotel SMS Integration
 * Handles SMS sending via Exotel API
 */

class ExotelClient {
  private apiKey: string
  private apiToken: string
  private sid: string

  constructor() {
    this.apiKey = process.env.EXOTEL_API_KEY || ''
    this.apiToken = process.env.EXOTEL_API_TOKEN || ''
    this.sid = process.env.EXOTEL_SID || ''
  }

  async sendSMS(to: string, message: string, senderId?: string): Promise<{ messageId: string; status: string }> {
    if (!this.apiKey || !this.apiToken || !this.sid) {
      throw new Error('Exotel credentials not configured')
    }

    try {
      const url = `https://${this.apiKey}:${this.apiToken}@api.exotel.com/v1/Accounts/${this.sid}/Sms/send.json`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: senderId || 'PAYAID',
          To: to,
          Body: message,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Exotel API error: ${response.status} ${error}`)
      }

      const data = await response.json()
      return {
        messageId: data.Sid || data.sid || `exotel-${Date.now()}`,
        status: data.Status || 'queued',
      }
    } catch (error) {
      console.error('Exotel SMS error:', error)
      throw error
    }
  }

  async sendBulkSMS(recipients: string[], message: string, senderId?: string): Promise<Array<{ phone: string; messageId: string; status: string }>> {
    const promises = recipients.map(async (phone) => {
      try {
        const result = await this.sendSMS(phone, message, senderId)
        return { phone, messageId: result.messageId, status: result.status }
      } catch (error: any) {
        return { phone, messageId: '', status: 'failed', error: error.message }
      }
    })

    return Promise.all(promises)
  }
}

let exotelInstance: ExotelClient | null = null

export function getExotelClient(): ExotelClient {
  if (!exotelInstance) {
    exotelInstance = new ExotelClient()
  }
  return exotelInstance
}

export default getExotelClient()

