/**
 * Form Submission Processor
 * Processes form submissions, creates contacts, and triggers automation
 */

import { prisma } from '@/lib/db/prisma'
import { FormRendererService } from './form-renderer'
import { FormBuilderService } from './form-builder'
import {
  INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
  processInboundLead,
} from '@/lib/crm/inbound-orchestration'

export interface SubmissionData {
  [fieldId: string]: any
}

export interface SubmissionMetadata {
  source?: string // Website URL
  ipAddress?: string
  userAgent?: string
  referrer?: string
}

export class FormSubmissionProcessor {
  /**
   * Process form submission
   */
  static async processSubmission(
    formSlug: string,
    data: SubmissionData,
    metadata: SubmissionMetadata = {}
  ) {
    // Get form
    const form = await FormBuilderService.getFormBySlug(formSlug)

    if (!form) {
      throw new Error('Form not found or inactive')
    }

    // Validate submission
    const renderableForm = await FormRendererService.renderForm(formSlug)
    if (!renderableForm) {
      throw new Error('Form not found')
    }

    const validation = FormRendererService.validateSubmission(renderableForm, data)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Extract contact information from form data
    const contactData = this.extractContactData(renderableForm, data)
    const settings = (form.settings as any) || {}

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        tenantId: form.tenantId,
        data: data as any,
        source: metadata.source,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'new',
      },
    })

    // Auto-create contact if enabled
    let contactId: string | null = null
    if (settings.autoCreateContact && contactData) {
      const { contact } = await this.createContactFromSubmission(
        form.tenantId,
        contactData,
        form.id,
        submission.id
      )
      contactId = contact.id

      // Update submission with contact
      await prisma.formSubmission.update({
        where: { id: submission.id },
        data: { contactId, status: 'processed' },
      })

    }

    return {
      submission,
      contactId,
      success: true,
    }
  }

  /**
   * Extract contact data from form submission
   */
  private static extractContactData(
    form: Awaited<ReturnType<typeof FormRendererService.renderForm>>,
    data: SubmissionData
  ): {
    name?: string
    email?: string
    phone?: string
    company?: string
    source?: string
    [key: string]: any
  } | null {
    if (!form) return null

    const contactData: any = {
      source: 'web_form',
      sourceId: form.id,
    }

    // Map common field labels to contact fields
    for (const field of form.fields) {
      const value = data[field.id] || data[field.label]

      if (!value) continue

      const labelLower = field.label.toLowerCase()

      if (labelLower.includes('name') && !contactData.name) {
        contactData.name = value
      } else if (labelLower.includes('email') && !contactData.email) {
        contactData.email = value
      } else if (labelLower.includes('phone') && !contactData.phone) {
        contactData.phone = value
      } else if (labelLower.includes('company') && !contactData.company) {
        contactData.company = value
      } else {
        // Store other fields in sourceData
        if (!contactData.sourceData) {
          contactData.sourceData = {}
        }
        contactData.sourceData[field.label] = value
      }
    }

    // Must have at least name or email
    if (!contactData.name && !contactData.email) {
      return null
    }

    return contactData
  }

  /**
   * Create contact from form submission
   */
  private static async createContactFromSubmission(
    tenantId: string,
    contactData: {
      name?: string
      email?: string
      phone?: string
      company?: string
      source?: string
      sourceId?: string
      sourceData?: any
    },
    formId: string,
    submissionId: string
  ): Promise<{ contact: { id: string; name: string; email: string | null; phone: string | null; company: string | null } }> {
    const inbound = await processInboundLead({
      tenantId,
      actorUserId: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
      dedupePolicy: 'merge_existing',
      mergeExistingFields: 'fill_empty_only',
      source: {
        sourceChannel: 'web_form',
        sourceAsset: formId,
        sourceRef: submissionId,
        capturedBy: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
        rawMetadata: {
          ...(contactData.sourceData && typeof contactData.sourceData === 'object'
            ? contactData.sourceData
            : {}),
          lastFormSubmission: submissionId,
        },
      },
      legacySourceLabel: contactData.source || 'web_form',
      contact: {
        name: contactData.name || 'Unknown',
        email: contactData.email ?? null,
        phone: contactData.phone ?? null,
        company: contactData.company ?? null,
        type: 'lead',
        stage: 'prospect',
        status: 'active',
      },
      touchLastContactedAt: true,
    })

    if (!inbound.ok || inbound.error) {
      if (inbound.error?.code === 'CONTACT_LIMIT') {
        throw new Error('Contact limit reached. Please upgrade your plan.')
      }
      throw new Error(inbound.error?.message || 'Failed to create or update contact from form')
    }

    const contact = inbound.contact
    return {
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
      },
    }
  }

  /**
   * Get form submissions
   */
  static async getSubmissions(
    tenantId: string,
    formId: string,
    filters?: {
      status?: string
      limit?: number
      offset?: number
    }
  ) {
    return prisma.formSubmission.findMany({
      where: {
        formId,
        tenantId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    })
  }
}
