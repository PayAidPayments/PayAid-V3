/**
 * E2E Tests for Territory & Quota Management
 */

import { describe, it, expect } from '@jest/globals'

describe('Territory & Quota Management E2E Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let authToken: string
  let tenantId: string

  describe('Territory Management', () => {
    it('should create a territory', async () => {
      const territoryData = {
        name: 'North India Territory',
        description: 'Covers Delhi, Punjab, Haryana',
        criteria: {
          states: ['Delhi', 'Punjab', 'Haryana'],
          cities: ['New Delhi', 'Chandigarh'],
        },
      }

      const response = await fetch(`${baseUrl}/api/territories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(territoryData),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(territoryData.name)
    })

    it('should assign sales rep to territory', async () => {
      // Create territory first, then assign rep
      const response = await fetch(`${baseUrl}/api/territories/[territoryId]/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          salesRepId: 'rep-id',
          role: 'owner',
        }),
      })

      expect(response.status).toBe(200)
    })
  })

  describe('Quota Management', () => {
    it('should create a quota', async () => {
      const quotaData = {
        salesRepId: 'rep-id',
        period: 'monthly',
        periodStart: new Date().toISOString(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        target: 100000,
      }

      const response = await fetch(`${baseUrl}/api/quotas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(quotaData),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Lead Routing', () => {
    it('should route lead to sales rep', async () => {
      const response = await fetch(`${baseUrl}/api/leads/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          contactData: {
            state: 'Delhi',
            city: 'New Delhi',
            industry: 'Technology',
          },
          strategy: 'territory-based',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('salesRepId')
    })
  })
})
