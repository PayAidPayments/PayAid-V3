/**
 * Telephony Integration
 * Supports SIP.js for SIP calls and Exotel for PSTN calls
 */

// SIP.js Integration
export interface SIPConfig {
  uri: string
  password: string
  wsServers: string
  displayName?: string
}

export class SIPTelephony {
  private userAgent: any = null

  constructor(private config: SIPConfig) {}

  /**
   * Initialize SIP.js user agent
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import of SIP.js (install: npm install sip.js)
      const { UserAgent, Registerer, URI } = await import('sip.js')

      // Convert string URI to SIP.js URI object
      const sipUri = URI.parse(this.config.uri)

      this.userAgent = new UserAgent({
        uri: sipUri,
        transportOptions: {
          server: this.config.wsServers,
        },
        authorizationUsername: this.config.uri.split('@')[0],
        authorizationPassword: this.config.password,
        displayName: this.config.displayName,
      })

      await this.userAgent.start()
    } catch (error) {
      console.error('Failed to initialize SIP.js:', error)
      throw new Error('SIP.js not installed. Run: npm install sip.js')
    }
  }

  /**
   * Make a SIP call
   */
  async makeCall(targetUri: string): Promise<any> {
    if (!this.userAgent) {
      throw new Error('SIP not initialized')
    }

    const { Inviter, URI } = await import('sip.js')
    // Convert string URI to SIP.js URI object
    const targetSipUri = URI.parse(targetUri)
    const inviter = new Inviter(this.userAgent, targetSipUri)

    await inviter.invite()

    return inviter
  }

  /**
   * End call
   */
  async endCall(session: any): Promise<void> {
    if (session) {
      await session.bye()
    }
  }
}

// Exotel Integration
export interface ExotelConfig {
  apiKey: string
  apiToken: string
  subdomain: string
  callerId: string
}

export class ExotelTelephony {
  private baseUrl: string

  constructor(private config: ExotelConfig) {
    this.baseUrl = `https://${config.subdomain}.exotel.com/v1/Accounts/${config.subdomain}`
  }

  /**
   * Make a call via Exotel
   */
  async makeCall(
    to: string,
    from: string,
    callType: 'trans' | 'promo' = 'trans'
  ): Promise<any> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiToken}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/Calls/connect.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        CallerId: this.config.callerId,
        CallType: callType,
        TimeLimit: '3600', // 1 hour max
        StatusCallback: `${process.env.APP_URL}/api/v1/voice-agents/exotel/callback`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Exotel API error: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<any> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiToken}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/Calls/${callSid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get call status: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Download call recording
   */
  async downloadRecording(recordingUrl: string): Promise<Buffer> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiToken}`).toString('base64')

    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

/**
 * Get telephony provider instance
 */
export function getTelephonyProvider(type: 'sip' | 'exotel', config: SIPConfig | ExotelConfig) {
  if (type === 'sip') {
    return new SIPTelephony(config as SIPConfig)
  } else {
    return new ExotelTelephony(config as ExotelConfig)
  }
}

