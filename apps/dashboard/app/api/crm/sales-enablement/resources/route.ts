import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/sales-enablement/resources - Get all sales enablement resources
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Return comprehensive sample data for Sales Enablement Library
    const sampleResources = [
      // Playbooks
      {
        id: 'resource-1',
        title: 'Enterprise Sales Playbook',
        type: 'playbook',
        category: 'Enterprise',
        description: 'Complete guide to enterprise sales process, from prospecting to closing',
        content: 'Enterprise Sales Playbook Content...',
        tags: ['enterprise', 'b2b', 'sales', 'playbook'],
        usageCount: 45,
        rating: 4.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-2',
        title: 'SMB Sales Playbook',
        type: 'playbook',
        category: 'SMB',
        description: 'Sales process optimized for small and medium businesses',
        content: 'SMB Sales Playbook Content...',
        tags: ['smb', 'sales', 'playbook', 'small-business'],
        usageCount: 38,
        rating: 4.6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-3',
        title: 'Objection Handling Playbook',
        type: 'playbook',
        category: 'Sales Skills',
        description: 'Comprehensive guide to handling common sales objections',
        content: 'Objection Handling Playbook Content...',
        tags: ['objections', 'sales', 'playbook', 'skills'],
        usageCount: 67,
        rating: 4.9,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Templates
      {
        id: 'resource-4',
        title: 'Cold Email Template - Introduction',
        type: 'template',
        category: 'Email',
        description: 'Professional introduction email template for cold outreach',
        content: 'Hi [Name],\n\nI noticed [Company] is [relevant context]...',
        tags: ['email', 'cold-outreach', 'template', 'introduction'],
        usageCount: 120,
        rating: 4.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-5',
        title: 'Follow-up Email Template',
        type: 'template',
        category: 'Email',
        description: 'Effective follow-up email template to re-engage prospects',
        content: 'Hi [Name],\n\nFollowing up on our previous conversation...',
        tags: ['email', 'follow-up', 'template', 're-engagement'],
        usageCount: 95,
        rating: 4.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-6',
        title: 'Proposal Template',
        type: 'template',
        category: 'Proposals',
        description: 'Professional proposal template with pricing and terms',
        content: 'Proposal Template Content...',
        tags: ['proposal', 'template', 'pricing', 'terms'],
        usageCount: 78,
        rating: 4.6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-7',
        title: 'Quote Template',
        type: 'template',
        category: 'Quotes',
        description: 'Standard quote template for quick pricing',
        content: 'Quote Template Content...',
        tags: ['quote', 'template', 'pricing'],
        usageCount: 112,
        rating: 4.4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Scripts
      {
        id: 'resource-8',
        title: 'Discovery Call Script',
        type: 'script',
        category: 'Calls',
        description: 'Structured script for discovery calls to qualify prospects',
        content: 'Discovery Call Script Content...',
        tags: ['calls', 'discovery', 'script', 'qualification'],
        usageCount: 89,
        rating: 4.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-9',
        title: 'Demo Call Script',
        type: 'script',
        category: 'Calls',
        description: 'Script for product demonstration calls',
        content: 'Demo Call Script Content...',
        tags: ['calls', 'demo', 'script', 'product'],
        usageCount: 72,
        rating: 4.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-10',
        title: 'Closing Call Script',
        type: 'script',
        category: 'Calls',
        description: 'Script for closing deals and handling final objections',
        content: 'Closing Call Script Content...',
        tags: ['calls', 'closing', 'script', 'deal'],
        usageCount: 56,
        rating: 4.9,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Videos
      {
        id: 'resource-11',
        title: 'Product Demo Video',
        type: 'video',
        category: 'Training',
        description: 'Comprehensive product demonstration video',
        url: 'https://example.com/videos/product-demo',
        tags: ['video', 'demo', 'product', 'training'],
        usageCount: 134,
        rating: 4.6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-12',
        title: 'Sales Training - Objection Handling',
        type: 'video',
        category: 'Training',
        description: 'Video training on handling sales objections',
        url: 'https://example.com/videos/objection-handling',
        tags: ['video', 'training', 'objections', 'sales'],
        usageCount: 98,
        rating: 4.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Presentations
      {
        id: 'resource-13',
        title: 'Company Overview Presentation',
        type: 'presentation',
        category: 'Presentations',
        description: 'Standard company overview presentation deck',
        url: 'https://example.com/presentations/company-overview',
        tags: ['presentation', 'company', 'overview', 'deck'],
        usageCount: 87,
        rating: 4.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'resource-14',
        title: 'Product Pitch Deck',
        type: 'presentation',
        category: 'Presentations',
        description: 'Professional product pitch presentation',
        url: 'https://example.com/presentations/product-pitch',
        tags: ['presentation', 'product', 'pitch', 'deck'],
        usageCount: 103,
        rating: 4.6,
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
