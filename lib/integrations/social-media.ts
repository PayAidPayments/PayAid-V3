/**
 * Social Media Integration Service
 * LinkedIn and Twitter integration for CRM
 */

export interface LinkedInConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface TwitterConfig {
  apiKey: string
  apiSecret: string
  accessToken?: string
  accessTokenSecret?: string
}

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  headline?: string
  industry?: string
  location?: string
  profilePicture?: string
  company?: string
  position?: string
  email?: string
}

export interface TwitterProfile {
  id: string
  username: string
  name: string
  bio?: string
  location?: string
  profileImage?: string
  followersCount?: number
  followingCount?: number
}

export class LinkedInService {
  private config: LinkedInConfig
  private accessToken: string | null = null

  constructor(config: LinkedInConfig) {
    this.config = config
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'r_liteprofile r_emailaddress',
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn access token')
    }

    const data = await response.json()
    this.accessToken = data.access_token
    return this.accessToken
  }

  /**
   * Get LinkedIn profile
   */
  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn profile')
    }

    const data = await response.json()

    // Get email separately
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let email: string | undefined
    if (emailResponse.ok) {
      const emailData = await emailResponse.json()
      email = emailData.elements?.[0]?.['handle~']?.emailAddress
    }

    return {
      id: data.id,
      firstName: data.localizedFirstName,
      lastName: data.localizedLastName,
      headline: data.headline?.localized?.en_US,
      industry: data.industry,
      location: data.location?.name,
      email,
    }
  }

  /**
   * Search for company by name
   */
  async searchCompany(accessToken: string, companyName: string): Promise<any> {
    const response = await fetch(
      `https://api.linkedin.com/v2/search?q=companies&keywords=${encodeURIComponent(companyName)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to search LinkedIn companies')
    }

    return response.json()
  }
}

export class TwitterService {
  private config: TwitterConfig

  constructor(config: TwitterConfig) {
    this.config = config
  }

  /**
   * Get Twitter profile by username
   */
  async getProfile(username: string): Promise<TwitterProfile> {
    // Twitter API v2 requires OAuth 2.0
    // This is a simplified implementation
    const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken || ''}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get Twitter profile')
    }

    const data = await response.json()

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      bio: data.data.description,
      location: data.data.location,
      profileImage: data.data.profile_image_url,
    }
  }

  /**
   * Search for tweets
   */
  async searchTweets(query: string, maxResults: number = 10): Promise<any[]> {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken || ''}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to search tweets')
    }

    const data = await response.json()
    return data.data || []
  }
}
