/**
 * Freelancer Industry Module Types
 * Industry-specific features for freelancers and solo consultants
 */

import { z } from 'zod'

export interface ServicePortfolio {
  id: string
  organizationId: string
  title: string
  description: string
  category: string
  rate: number // In ₹ (hourly or project-based)
  rateType: 'hourly' | 'project' | 'retainer'
  images: string[]
  caseStudy?: string
  clientTestimonial?: {
    clientName: string
    testimonial: string
    rating: number
  }
  createdAt: Date
}

export interface Proposal {
  id: string
  organizationId: string
  clientId: string
  title: string
  description: string
  services: Array<{
    service: string
    quantity: number
    rate: number // In ₹
    total: number // In ₹
  }>
  totalAmount: number // In ₹
  validityDays: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  sentAt?: Date
  expiresAt?: Date
  createdAt: Date
}

export interface Retainer {
  id: string
  organizationId: string
  clientId: string
  monthlyAmount: number // In ₹
  startDate: Date
  endDate?: Date
  status: 'active' | 'paused' | 'cancelled'
  createdAt: Date
}

// Validation schemas
export const CreateServicePortfolioSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  rate: z.number().positive(),
  rateType: z.enum(['hourly', 'project', 'retainer']),
  images: z.array(z.string()).optional(),
  caseStudy: z.string().optional(),
})

export const CreateProposalSchema = z.object({
  organizationId: z.string().uuid(),
  clientId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  services: z.array(
    z.object({
      service: z.string(),
      quantity: z.number().positive(),
      rate: z.number().positive(),
    })
  ),
  validityDays: z.number().int().positive().default(30),
})
