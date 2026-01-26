/**
 * Form Builder Service
 * Creates and manages web forms for lead capture
 */

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const FormFieldSchema = z.object({
  label: z.string(),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea', 'number', 'date']),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select/radio/checkbox
  conditionalLogic: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains']),
    value: z.string(),
    show: z.boolean(),
  }).optional(),
  order: z.number().default(0),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
})

export const FormSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  fields: z.array(FormFieldSchema),
  settings: z.object({
    gdprConsent: z.boolean().default(true),
    redirectUrl: z.string().url().optional(),
    successMessage: z.string().optional(),
    notifyEmail: z.string().email().optional(),
    autoCreateContact: z.boolean().default(true),
    autoAssignRep: z.boolean().default(false),
  }).default({}),
})

export type FormField = z.infer<typeof FormFieldSchema>
export type Form = z.infer<typeof FormSchema>

export class FormBuilderService {
  /**
   * Create a new form
   */
  static async createForm(tenantId: string, data: {
    name: string
    description?: string
    slug: string
    fields: FormField[]
    settings?: Form['settings']
  }) {
    // Validate slug uniqueness
    const existing = await prisma.form.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new Error(`Form with slug "${data.slug}" already exists`)
    }

    // Validate form data
    const validated = FormSchema.parse({
      name: data.name,
      description: data.description,
      slug: data.slug,
      status: 'draft',
      fields: data.fields,
      settings: data.settings || {},
    })

    // Create form with fields
    const form = await prisma.form.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        slug: validated.slug,
        status: validated.status,
        settings: validated.settings,
        fields: {
          create: validated.fields.map((field, index) => ({
            label: field.label,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options || null,
            conditionalLogic: field.conditionalLogic || null,
            order: field.order || index,
            validation: field.validation || null,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return form
  }

  /**
   * Update form
   */
  static async updateForm(
    tenantId: string,
    formId: string,
    data: Partial<{
      name: string
      description: string
      status: 'draft' | 'active' | 'archived'
      settings: Partial<Form['settings']>
    }>
  ) {
    const form = await prisma.form.findFirst({
      where: { id: formId, tenantId },
    })

    if (!form) {
      throw new Error('Form not found')
    }

    // Merge settings if provided
    const currentSettings = (form.settings as any) || {}
    const mergedSettings = data.settings 
      ? { ...currentSettings, ...data.settings }
      : currentSettings

    return prisma.form.update({
      where: { id: formId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.settings && { settings: mergedSettings as any }),
        updatedAt: new Date(),
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  /**
   * Update form fields
   */
  static async updateFormFields(
    tenantId: string,
    formId: string,
    fields: FormField[]
  ) {
    const form = await prisma.form.findFirst({
      where: { id: formId, tenantId },
    })

    if (!form) {
      throw new Error('Form not found')
    }

    // Delete existing fields
    await prisma.formField.deleteMany({
      where: { formId },
    })

    // Create new fields
    await prisma.formField.createMany({
      data: fields.map((field, index) => ({
        formId,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options || null,
        conditionalLogic: field.conditionalLogic || null,
        order: field.order || index,
        validation: field.validation || null,
      })),
    })

    return prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  /**
   * Get form by slug (for public embedding)
   */
  static async getFormBySlug(slug: string) {
    return prisma.form.findUnique({
      where: { slug, status: 'active' },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  /**
   * Get form by ID (for tenant)
   */
  static async getFormById(tenantId: string, formId: string) {
    return prisma.form.findFirst({
      where: { id: formId, tenantId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        submissions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * List all forms for tenant
   */
  static async listForms(tenantId: string, filters?: {
    status?: 'draft' | 'active' | 'archived'
  }) {
    return prisma.form.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Delete form
   */
  static async deleteForm(tenantId: string, formId: string) {
    const form = await prisma.form.findFirst({
      where: { id: formId, tenantId },
    })

    if (!form) {
      throw new Error('Form not found')
    }

    return prisma.form.delete({
      where: { id: formId },
    })
  }
}
