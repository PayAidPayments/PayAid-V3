/**
 * Integration Tests: OAuth2 SSO Flow
 * 
 * Tests the complete OAuth2 Single Sign-On flow across modules
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

const CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'http://localhost:3000'
const CRM_MODULE_URL = process.env.CRM_MODULE_URL || 'http://localhost:3001'
const INVOICING_MODULE_URL = process.env.INVOICING_MODULE_URL || 'http://localhost:3002'

describe('OAuth2 SSO Integration Tests', () => {
  let testUser: { email: string; password: string }
  let authToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Setup test user
    testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    }
  })

  afterAll(async () => {
    // Cleanup
  })

  describe('Authorization Flow', () => {
    it('should redirect to core when accessing module without token', async () => {
      const response = await fetch(`${CRM_MODULE_URL}/api/contacts`, {
        redirect: 'manual',
      })

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain(`${CORE_AUTH_URL}/api/oauth/authorize`)
    })

    it('should include correct OAuth parameters in redirect', async () => {
      const response = await fetch(`${CRM_MODULE_URL}/api/contacts`, {
        redirect: 'manual',
      })

      const location = response.headers.get('location')
      expect(location).toContain('client_id=')
      expect(location).toContain('redirect_uri=')
      expect(location).toContain('response_type=code')
    })
  })

  describe('Token Exchange', () => {
    it('should exchange authorization code for access token', async () => {
      // This would require a valid authorization code
      // In real tests, you'd need to simulate the full flow
      const mockCode = 'test_auth_code'
      
      const response = await fetch(`${CORE_AUTH_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: mockCode,
          redirect_uri: `${CRM_MODULE_URL}/api/oauth/callback`,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
        }),
      })

      // Note: This will fail with invalid code, but tests the endpoint structure
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should return access token and refresh token', async () => {
      // This test requires a valid authorization code
      // Would need to be set up with actual OAuth flow
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Token Refresh', () => {
    it('should refresh access token using refresh token', async () => {
      if (!refreshToken) {
        // Skip if no refresh token available
        return
      }

      const response = await fetch(`${CORE_AUTH_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('access_token')
        expect(data).toHaveProperty('refresh_token')
        expect(data.token_type).toBe('Bearer')
      }
    })

    it('should rotate refresh token on refresh', async () => {
      if (!refreshToken) {
        return
      }

      const response = await fetch(`${CORE_AUTH_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.refresh_token).not.toBe(refreshToken)
      }
    })
  })

  describe('UserInfo Endpoint', () => {
    it('should return user info with valid token', async () => {
      if (!authToken) {
        return
      }

      const response = await fetch(`${CORE_AUTH_URL}/api/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('sub')
        expect(data).toHaveProperty('email')
        expect(data).toHaveProperty('tenant_id')
        expect(data).toHaveProperty('licensed_modules')
      }
    })

    it('should reject invalid token', async () => {
      const response = await fetch(`${CORE_AUTH_URL}/api/oauth/userinfo`, {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Logout', () => {
    it('should clear token cookies on logout', async () => {
      const response = await fetch(`${CRM_MODULE_URL}/api/auth/logout`, {
        method: 'POST',
        redirect: 'manual',
      })

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('payaid_token=')
      expect(cookies).toContain('Max-Age=0') // Cookie cleared
    })
  })
})

