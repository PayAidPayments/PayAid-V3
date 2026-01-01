/**
 * Form Filler Agent - Auto-fill forms from CRM data
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

export interface FormField {
  name: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea'
  label?: string
  required?: boolean
  options?: string[]
}

export interface FormData {
  fields: FormField[]
  formType?: 'government' | 'vendor' | 'customer' | 'other'
}

export interface FilledForm {
  [fieldName: string]: string | number | Date | null
}

/**
 * Map CRM data to form fields
 */
export async function mapFormFields(
  tenantId: string,
  formData: FormData,
  contactId?: string,
  businessData?: any
): Promise<FilledForm> {
  // Get business data
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      gstin: true,
      pan: true,
    },
  })

  // Get contact data if provided
  let contact = null
  if (contactId) {
    contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        name: true,
        email: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })
  }

  const filledForm: FilledForm = {}

  // Use AI to intelligently map fields
  const systemPrompt = `You are a form filling AI agent. Map business/contact data to form fields intelligently.
Match field names and labels to appropriate data. Return JSON with field names as keys and values.`

  const userPrompt = `Form fields:
${JSON.stringify(formData.fields, null, 2)}

Business data:
${JSON.stringify(tenant, null, 2)}

Contact data:
${JSON.stringify(contact, null, 2)}

Map the data to form fields and return JSON.`

  try {
    const groq = getGroqClient()
    const response = await groq.generateCompletion(userPrompt, systemPrompt)
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const aiMapped = JSON.parse(jsonMatch[0])
      Object.assign(filledForm, aiMapped)
    }
  } catch (error) {
    console.error('AI form mapping failed, using rule-based:', error)
  }

  // Rule-based fallback mapping
  for (const field of formData.fields) {
    const fieldLower = field.name.toLowerCase()
    const labelLower = (field.label || '').toLowerCase()

    // Business name
    if (fieldLower.includes('business') || fieldLower.includes('company') || fieldLower.includes('organization') ||
        labelLower.includes('business') || labelLower.includes('company')) {
      filledForm[field.name] = tenant?.name || ''
      continue
    }

    // Email
    if (fieldLower.includes('email') || labelLower.includes('email')) {
      filledForm[field.name] = contact?.email || tenant?.email || ''
      continue
    }

    // Phone
    if (fieldLower.includes('phone') || fieldLower.includes('mobile') || fieldLower.includes('contact') ||
        labelLower.includes('phone') || labelLower.includes('mobile')) {
      filledForm[field.name] = contact?.phone || tenant?.phone || ''
      continue
    }

    // Address
    if (fieldLower.includes('address') || labelLower.includes('address')) {
      filledForm[field.name] = contact?.address || tenant?.address || ''
      continue
    }

    // City
    if (fieldLower.includes('city') || labelLower.includes('city')) {
      filledForm[field.name] = contact?.city || tenant?.city || ''
      continue
    }

    // State
    if (fieldLower.includes('state') || labelLower.includes('state')) {
      filledForm[field.name] = contact?.state || tenant?.state || ''
      continue
    }

    // Postal code
    if (fieldLower.includes('postal') || fieldLower.includes('zip') || fieldLower.includes('pincode') ||
        labelLower.includes('postal') || labelLower.includes('zip')) {
      filledForm[field.name] = contact?.postalCode || tenant?.postalCode || ''
      continue
    }

    // GSTIN
    if (fieldLower.includes('gst') || fieldLower.includes('gstin') || labelLower.includes('gst')) {
      filledForm[field.name] = tenant?.gstin || ''
      continue
    }

    // PAN
    if (fieldLower.includes('pan') || labelLower.includes('pan')) {
      filledForm[field.name] = tenant?.pan || ''
      continue
    }

    // Name
    if (fieldLower.includes('name') && !fieldLower.includes('business') && !fieldLower.includes('company')) {
      filledForm[field.name] = contact?.name || tenant?.name || ''
      continue
    }

    // Default empty
    if (!filledForm[field.name]) {
      filledForm[field.name] = ''
    }
  }

  return filledForm
}

/**
 * Validate filled form data
 */
export function validateFilledForm(formData: FormData, filledForm: FilledForm): {
  valid: boolean
  errors: { field: string; message: string }[]
} {
  const errors: { field: string; message: string }[] = []

  for (const field of formData.fields) {
    if (field.required && (!filledForm[field.name] || filledForm[field.name] === '')) {
      errors.push({
        field: field.name,
        message: `${field.label || field.name} is required`,
      })
    }

    // Type validation
    if (filledForm[field.name]) {
      if (field.type === 'email' && typeof filledForm[field.name] === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(filledForm[field.name] as string)) {
          errors.push({
            field: field.name,
            message: `Invalid email format for ${field.label || field.name}`,
          })
        }
      }

      if (field.type === 'phone' && typeof filledForm[field.name] === 'string') {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
        if (!phoneRegex.test(filledForm[field.name] as string)) {
          errors.push({
            field: field.name,
            message: `Invalid phone format for ${field.label || field.name}`,
          })
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

