/**
 * Form Submission Processor
 * Processes form submissions, creates contacts, and triggers automation
 */

import { prisma } from '@/lib/db/prisma'
import { FormRendererService } from './form-renderer'
import { FormBuilderService } from './form-builder'

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
      const contact = await this.createContactFromSubmission(
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

    // Trigger automation (if configured)
    if (contactId) {
      await this.triggerAutomation(form.tenantId, contactId, form.id, submission.id)
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
  ) {
    // Check if contact already exists (by email or phone)
    let existingContact = null

    if (contactData.email) {
      existingContact = await prisma.contact.findFirst({
        where: {
          tenantId,
          email: contactData.email,
        },
      })
    }

    if (!existingContact && contactData.phone) {
      existingContact = await prisma.contact.findFirst({
        where: {
          tenantId,
          phone: contactData.phone,
        },
      })
    }

    if (existingContact) {
      // Update existing contact with new data
      return prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          ...(contactData.name && !existingContact.name && { name: contactData.name }),
          ...(contactData.email && !existingContact.email && { email: contactData.email }),
          ...(contactData.phone && !existingContact.phone && { phone: contactData.phone }),
          ...(contactData.company && !existingContact.company && { company: contactData.company }),
          source: contactData.source || existingContact.source,
          sourceId: formId,
          sourceData: {
            ...((existingContact.sourceData as any) || {}),
            ...(contactData.sourceData || {}),
            lastFormSubmission: submissionId,
          },
          lastContactedAt: new Date(),
        },
      })
    }

    // Create new contact
    return prisma.contact.create({
      data: {
        tenantId,
        name: contactData.name || 'Unknown',
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        stage: 'prospect',
        source: contactData.source || 'web_form',
        sourceId: formId,
        sourceData: {
          ...(contactData.sourceData || {}),
          firstFormSubmission: submissionId,
        },
        lastContactedAt: new Date(),
      },
    })
  }

  /**
   * Trigger automation workflows
   */
  private static async triggerAutomation(
    tenantId: string,
    contactId: string,
    formId: string,
    submissionId: string
  ) {
    // This would integrate with the workflow engine
    // For now, we'll just log it
    // TODO: Integrate with lib/automation/workflow-engine.ts
    console.log(`Trigger automation for contact ${contactId} from form ${formId}`)
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
