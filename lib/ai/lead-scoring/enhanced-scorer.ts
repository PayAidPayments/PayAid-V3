/**
 * Enhanced Lead Scoring Algorithm
 * 0-100 scoring system with multiple factors:
 * - Engagement metrics (email opens, clicks, website visits, demo attendance)
 * - Demographic fit (company size, industry, geography)
 * - Behavioral signals (time in app, feature usage, payment intent)
 * - Historical patterns (similar customers, referral source)
 */

import { prisma } from '@/lib/db/prisma'
import { extractContactFeatures } from './pipeline'
import type { Contact } from '@prisma/client'

export interface EnhancedScoreComponents {
  // Engagement (0-30 points)
  engagement: {
    emailOpens: number
    emailClicks: number
    websiteVisits: number
    demoAttendance: number
    callDuration: number
    interactionCount: number
    total: number
  }
  
  // Demographic Fit (0-25 points)
  demographic: {
    companySize: number
    industry: number
    geography: number
    revenue: number
    total: number
  }
  
  // Behavioral (0-25 points)
  behavioral: {
    timeInApp: number
    featureUsage: number
    paymentIntent: number
    documentDownloads: number
    total: number
  }
  
  // Historical Patterns (0-20 points)
  historical: {
    similarCustomers: number
    referralSource: number
    leadSource: number
    total: number
  }
  
  // Final score (0-100)
  finalScore: number
}

export interface ScoringWeights {
  engagement: number // 0-1
  demographic: number // 0-1
  behavioral: number // 0-1
  historical: number // 0-1
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  engagement: 0.30,
  demographic: 0.25,
  behavioral: 0.25,
  historical: 0.20,
}

/**
 * Calculate enhanced lead score (0-100)
 */
export async function calculateEnhancedScore(
  contact: Contact,
  weights: Partial<ScoringWeights> = {}
): Promise<{ score: number; components: EnhancedScoreComponents }> {
  const scoringWeights = { ...DEFAULT_WEIGHTS, ...weights }
  
  // Extract features
  const features = await extractContactFeatures(contact.id)
  
  // Calculate engagement score (0-30 points)
  const emailOpensScore = Math.min(features.emailOpens * 2, 8) // Max 8 points
  const emailClicksScore = Math.min(features.emailClicks * 3, 10) // Max 10 points
  const websiteVisitsScore = Math.min(features.websiteVisits * 1, 5) // Max 5 points
  const demoAttendanceScore = features.demoAttendance ? 7 : 0 // 7 points if attended
  const callDurationScore = Math.min(features.callDuration / 10, 5) // Max 5 points (100 min = 5 points)
  const interactionCountScore = Math.min(features.interactionCount * 0.5, 10) // Max 10 points
  
  const engagementTotal = Math.min(
    emailOpensScore +
    emailClicksScore +
    websiteVisitsScore +
    demoAttendanceScore +
    callDurationScore +
    interactionCountScore,
    30
  ) * scoringWeights.engagement
  
  // Calculate demographic fit score (0-25 points)
  const companySizeScore = features.companySize === 'large' ? 10 : features.companySize === 'medium' ? 7 : 3
  const industryScore = getIndustryScore(features.industry ?? '') // 0-8 points
  const geographyScore = getGeographyScore(features.geography ?? '') // 0-5 points
  const revenueScore = (features.revenue ?? 0) > 1000000 ? 2 : (features.revenue ?? 0) > 100000 ? 1 : 0
  
  const demographicTotal = Math.min(
    companySizeScore + industryScore + geographyScore + revenueScore,
    25
  ) * scoringWeights.demographic
  
  // Calculate behavioral score (0-25 points)
  const timeInAppScore = Math.min(features.timeInApp / 60, 8) // Max 8 points (8 hours = 8 points)
  const featureUsageScore = Math.min(features.featureUsage.length * 2, 10) // Max 10 points
  const paymentIntentScore = features.paymentIntent ? 7 : 0 // 7 points if payment intent
  const documentDownloadsScore = Math.min(features.documentDownloads * 0.5, 5) // Max 5 points
  
  const behavioralTotal = Math.min(
    timeInAppScore + featureUsageScore + paymentIntentScore + documentDownloadsScore,
    25
  ) * scoringWeights.behavioral
  
  // Calculate historical patterns score (0-20 points)
  const similarCustomersScore = Math.min(features.similarCustomers * 5, 10) // Max 10 points
  const referralSourceScore = getReferralSourceScore(features.referralSource) // 0-5 points
  const leadSourceScore = getLeadSourceScore(features.leadSource) // 0-5 points
  
  const historicalTotal = Math.min(
    similarCustomersScore + referralSourceScore + leadSourceScore,
    20
  ) * scoringWeights.historical
  
  // Calculate final score (0-100)
  const finalScore = Math.round(
    engagementTotal + demographicTotal + behavioralTotal + historicalTotal
  )
  
  const components: EnhancedScoreComponents = {
    engagement: {
      emailOpens: emailOpensScore,
      emailClicks: emailClicksScore,
      websiteVisits: websiteVisitsScore,
      demoAttendance: demoAttendanceScore,
      callDuration: callDurationScore,
      interactionCount: interactionCountScore,
      total: engagementTotal,
    },
    demographic: {
      companySize: companySizeScore,
      industry: industryScore,
      geography: geographyScore,
      revenue: revenueScore,
      total: demographicTotal,
    },
    behavioral: {
      timeInApp: timeInAppScore,
      featureUsage: featureUsageScore,
      paymentIntent: paymentIntentScore,
      documentDownloads: documentDownloadsScore,
      total: behavioralTotal,
    },
    historical: {
      similarCustomers: similarCustomersScore,
      referralSource: referralSourceScore,
      leadSource: leadSourceScore,
      total: historicalTotal,
    },
    finalScore: Math.min(100, Math.max(0, finalScore)),
  }
  
  return {
    score: components.finalScore,
    components,
  }
}

/**
 * Get industry score (0-8 points)
 */
function getIndustryScore(industry: string): number {
  const highValueIndustries = ['fintech', 'saas', 'healthcare', 'ecommerce', 'manufacturing']
  const mediumValueIndustries = ['retail', 'education', 'real-estate', 'logistics']
  
  if (highValueIndustries.includes(industry.toLowerCase())) {
    return 8
  } else if (mediumValueIndustries.includes(industry.toLowerCase())) {
    return 5
  }
  return 3
}

/**
 * Get geography score (0-5 points)
 */
function getGeographyScore(geography: string): number {
  const highValueRegions = ['India', 'USA', 'UK', 'Singapore', 'UAE']
  if (highValueRegions.includes(geography)) {
    return 5
  }
  return 2
}

/**
 * Get referral source score (0-5 points)
 */
function getReferralSourceScore(source: string): number {
  const highValueSources = ['referral', 'partner', 'existing-customer']
  const mediumValueSources = ['website', 'social-media', 'content']
  
  if (highValueSources.includes(source.toLowerCase())) {
    return 5
  } else if (mediumValueSources.includes(source.toLowerCase())) {
    return 3
  }
  return 1
}

/**
 * Get lead source score (0-5 points)
 */
function getLeadSourceScore(source: string): number {
  const highValueSources = ['website', 'referral', 'partner']
  const mediumValueSources = ['social-media', 'content', 'event']
  
  if (highValueSources.includes(source.toLowerCase())) {
    return 5
  } else if (mediumValueSources.includes(source.toLowerCase())) {
    return 3
  }
  return 1
}
