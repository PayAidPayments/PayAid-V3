import { z } from 'zod'

export const imageProviderSchema = z.enum([
  'auto',
  'self-hosted',
  'google-ai-studio',
  'huggingface',
  'nanobanana',
])

export type ImageProvider = z.infer<typeof imageProviderSchema>

export const imageGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional(),
  size: z.string().optional(),
  provider: imageProviderSchema.optional(),
})

export const logoGenerationRequestSchema = z.object({
  brandName: z.string().min(2),
  tagline: z.string().optional(),
  visualDirection: z.string().optional(),
  colorPalette: z.string().optional(),
  provider: imageProviderSchema.optional(),
})

export const websiteGenerationRequestSchema = z.object({
  businessName: z.string().min(2),
  industry: z.string().optional(),
  objective: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.string().optional(),
  pages: z.array(z.string().min(1)).min(1).max(12).optional(),
})
import { z } from 'zod'

export const imageProviderSchema = z.enum([
  'auto',
  'self-hosted',
  'google-ai-studio',
  'huggingface',
  'nanobanana',
])

export const imageGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional(),
  size: z.string().optional(),
  provider: imageProviderSchema.optional(),
})

export const logoGenerationRequestSchema = z.object({
  prompt: z.string().min(3),
  brandName: z.string().min(1),
  style: z.string().optional(),
  provider: imageProviderSchema.optional(),
  includeWordmark: z.boolean().optional(),
})

export const websiteGenerationRequestSchema = z.object({
  businessName: z.string().min(1),
  industry: z.string().min(1),
  objective: z.string().min(1),
  tone: z.string().optional(),
  cta: z.string().optional(),
  sections: z
    .array(z.enum(['hero', 'features', 'social-proof', 'pricing', 'faq', 'contact']))
    .optional(),
})

export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>
export type LogoGenerationRequest = z.infer<typeof logoGenerationRequestSchema>
export type WebsiteGenerationRequest = z.infer<typeof websiteGenerationRequestSchema>
