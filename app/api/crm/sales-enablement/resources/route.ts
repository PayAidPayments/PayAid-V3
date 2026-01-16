import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/sales-enablement/resources - Get all sales enablement resources
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // For now, return sample data - in production, create SalesEnablementResource model
    const sampleResources = [
      {
        id: 'resource-1',
        title: 'Enterprise Sales Playbook',
        type: 'playbook',
        category: 'Enterprise',
        description: 'Complete guide to enterprise sales process',
        tags: ['enterprise', 'b2b', 'sales'],
        usageCount: 45,
        rating: 4.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-2',
        title: 'Cold Email Template - Introduction',
        type: 'template',
        category: 'Email',
        description: 'Professional introduction email template',
        tags: ['email', 'cold-outreach', 'template'],
        usageCount: 120,
        rating: 4.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-3',
        title: 'Discovery Call Script',
        type: 'script',
        category: 'Calls',
        description: 'Structured script for discovery calls',
        tags: ['calls', 'discovery', 'script'],
        usageCount: 89,
        rating: 4.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ resources: sampleResources })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get resources error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources', message: error?.message },
      { status: 500 }
    )
  }
}
