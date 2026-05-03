import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/marketing/social-listening/rules - Get listening rules
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // For now, return sample data - in production, create SocialListeningRule model
    const sampleRules = [
      {
        id: 'rule-1',
        name: 'Brand Mentions',
        keywords: ['PayAid', 'PayAid V3', 'payaid'],
        platforms: ['facebook', 'twitter', 'linkedin'],
        status: 'active',
        alertOnMatch: true,
        autoRespond: false,
      },
      {
        id: 'rule-2',
        name: 'Support Requests',
        keywords: ['help', 'support', 'issue', 'problem'],
        platforms: ['facebook', 'twitter'],
        status: 'active',
        alertOnMatch: true,
        autoRespond: true,
      },
    ]

    return NextResponse.json({ rules: sampleRules })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get rules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules', message: error?.message },
      { status: 500 }
    )
  }
}
