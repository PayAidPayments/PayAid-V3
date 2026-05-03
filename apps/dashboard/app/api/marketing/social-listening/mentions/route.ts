import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/marketing/social-listening/mentions - Get social media mentions
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // For now, return sample data - in production, integrate with social media APIs
    // This would fetch mentions from Facebook, Twitter, LinkedIn, Instagram, YouTube APIs
    const sampleMentions = [
      {
        id: 'mention-1',
        platform: 'twitter',
        type: 'mention',
        author: 'John Doe',
        authorHandle: 'johndoe',
        content: 'Just tried @PayAidV3 and it\'s amazing! The AI features are incredible.',
        sentiment: 'positive',
        intent: 'high',
        engagement: {
          likes: 12,
          shares: 3,
          comments: 5,
        },
        url: 'https://twitter.com/johndoe/status/123',
        timestamp: new Date().toISOString(),
        requiresResponse: false,
        tags: ['positive', 'product'],
      },
      {
        id: 'mention-2',
        platform: 'facebook',
        type: 'comment',
        author: 'Jane Smith',
        content: 'Having issues with invoice generation. Can someone help?',
        sentiment: 'negative',
        intent: 'high',
        engagement: {
          likes: 0,
          shares: 0,
          comments: 2,
        },
        url: 'https://facebook.com/post/123',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        requiresResponse: true,
        tags: ['support', 'urgent'],
      },
    ]

    return NextResponse.json({ mentions: sampleMentions })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get mentions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentions', message: error?.message },
      { status: 500 }
    )
  }
}
