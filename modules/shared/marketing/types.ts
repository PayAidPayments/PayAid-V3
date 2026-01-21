/**
 * Marketing & AI Content Module Types - Base Module
 * Shared across all industries
 */

import { z } from 'zod'

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sent' | 'paused'
export type ContentType = 'email' | 'social_post' | 'product_description' | 'landing_page_copy' | 'proposal' | 'case_study' | 'blog_post'
export type ContentTone = 'professional' | 'casual' | 'technical' | 'creative'
export type ContentStatus = 'generating' | 'generated' | 'approved' | 'published'

export interface EmailCampaign {
  id: string
  organizationId: string
  name: string
  subject: string
  htmlContent: string
  aiGeneratedPrompt?: string
  recipientSegments: string[]
  recipientCount: number
  status: EmailCampaignStatus
  scheduledFor?: Date
  sentAt?: Date
  openRate: number
  clickRate: number
  conversionRate?: number
  unsubscribeCount: number
  metrics: {
    totalSent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  createdAt: Date
}

export interface AIContentRequest {
  id: string
  organizationId: string
  contentType: ContentType
  prompt: string
  industry: string
  generatedContent: string
  tone: ContentTone
  includesCallToAction: boolean
  status: ContentStatus
  approvedAt?: Date
  usageCount?: number
  createdAt: Date
}

export interface SMSCampaign {
  id: string
  organizationId: string
  name: string
  message: string // Max 160 chars
  recipientSegments: string[]
  recipientCount: number
  status: 'draft' | 'scheduled' | 'sent'
  scheduledFor?: Date
  sentAt?: Date
  deliveryRate: number
  createdAt: Date
}

// Validation schemas
export const CreateEmailCampaignSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipientSegments: z.array(z.string().uuid()),
  scheduledFor: z.string().datetime().optional(),
})

export const GenerateAIContentSchema = z.object({
  organizationId: z.string().uuid(),
  contentType: z.enum(['email', 'social_post', 'product_description', 'landing_page_copy', 'proposal', 'case_study', 'blog_post']),
  prompt: z.string().min(1),
  industry: z.string(),
  tone: z.enum(['professional', 'casual', 'technical', 'creative']).default('professional'),
  includesCallToAction: z.boolean().default(true),
})

export const CreateSMSCampaignSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  message: z.string().min(1).max(160),
  recipientSegments: z.array(z.string().uuid()),
  scheduledFor: z.string().datetime().optional(),
})
