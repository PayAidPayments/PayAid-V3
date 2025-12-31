/**
 * Input Validation Utilities (Layer 4)
 * Uses Zod for schema validation and sanitization
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const emailSchema = z.string().email().toLowerCase().trim()
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
export const urlSchema = z.string().url()
export const uuidSchema = z.string().uuid()

// Contact validation
export const contactSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  notes: z.string().max(5000).optional(),
})

// Invoice validation
export const invoiceSchema = z.object({
  customerId: uuidSchema,
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    rate: z.number().nonnegative(),
    taxRate: z.number().min(0).max(100).optional(),
  })).min(1).max(100),
  dueDate: z.date().optional(),
  notes: z.string().max(5000).optional(),
})

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

// Sanitize text input
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

// API request validation helper
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const body = await request.json()
    const result = validateAndSanitize(schema, body)
    
    if (!result.success) {
      return {
        success: false,
        error: 'Invalid input',
        status: 400,
      }
    }
    
    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON',
      status: 400,
    }
  }
}

