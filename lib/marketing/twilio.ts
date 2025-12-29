/**
 * Twilio SMS Integration
 * Handles SMS sending via Twilio API
 */

class TwilioClient {
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || ''
    this.authToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || ''
  }

  async sendSMS(to: string, message: string): Promise<{ messageId: string; status: string }> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials not configured')
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: to,
          Body: message,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Twilio API error: ${response.status} ${error}`)
      }

      const data = await response.json()
      return {
        messageId: data.sid,
        status: data.status,
      }
    } catch (error) {
      console.error('Twilio SMS error:', error)
      throw error
    }
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<Array<{ phone: string; messageId: string; status: string }>> {
    const promises = recipients.map(async (phone) => {
      try {
        const result = await this.sendSMS(phone, message)
        return { phone, messageId: result.messageId, status: result.status }
      } catch (error: any) {
        return { phone, messageId: '', status: 'failed', error: error.message }
      }
    })

    return Promise.all(promises)
  }
}

let twilioInstance: TwilioClient | null = null

export function getTwilioClient(): TwilioClient {
  if (!twilioInstance) {
    twilioInstance = new TwilioClient()
  }
  return twilioInstance
}

