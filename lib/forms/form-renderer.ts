/**
 * Form Renderer Service
 * Renders forms for embedding and handles conditional logic
 */

import { FormBuilderService } from './form-builder'

export interface RenderableField {
  id: string
  label: string
  type: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
  conditionalLogic?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains'
    value: string
    show: boolean
  }
}

export interface RenderableForm {
  id: string
  name: string
  description?: string
  fields: RenderableField[]
  settings: {
    gdprConsent?: boolean
    redirectUrl?: string
    successMessage?: string
  }
}

export class FormRendererService {
  /**
   * Render form for embedding (public-facing)
   */
  static async renderForm(slug: string): Promise<RenderableForm | null> {
    const form = await FormBuilderService.getFormBySlug(slug)

    if (!form) {
      return null
    }

    return {
      id: form.id,
      name: form.name,
      description: form.description || undefined,
      fields: form.fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || undefined,
        required: field.required,
        options: field.options ? (field.options as string[]) : undefined,
        validation: field.validation
          ? (field.validation as RenderableField['validation'])
          : undefined,
        conditionalLogic: field.conditionalLogic
          ? (field.conditionalLogic as RenderableField['conditionalLogic'])
          : undefined,
      })),
      settings: (form.settings as RenderableForm['settings']) || {},
    }
  }

  /**
   * Evaluate conditional logic for fields
   */
  static evaluateConditionalLogic(
    field: RenderableField,
    formData: Record<string, any>
  ): boolean {
    if (!field.conditionalLogic) {
      return true // Show by default
    }

    const { field: targetField, operator, value, show } = field.conditionalLogic
    const fieldValue = formData[targetField]

    if (fieldValue === undefined || fieldValue === null) {
      return !show // Hide if condition field is empty
    }

    let matches = false

    switch (operator) {
      case 'equals':
        matches = String(fieldValue) === value
        break
      case 'not_equals':
        matches = String(fieldValue) !== value
        break
      case 'contains':
        matches = String(fieldValue).toLowerCase().includes(value.toLowerCase())
        break
    }

    return show ? matches : !matches
  }

  /**
   * Get visible fields based on conditional logic
   */
  static getVisibleFields(
    form: RenderableForm,
    formData: Record<string, any>
  ): RenderableField[] {
    return form.fields.filter((field) =>
      this.evaluateConditionalLogic(field, formData)
    )
  }

  /**
   * Validate form submission
   */
  static validateSubmission(
    form: RenderableForm,
    data: Record<string, any>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    for (const field of form.fields) {
      const value = data[field.id] || data[field.label]

      // Check required fields
      if (field.required && (!value || value.trim() === '')) {
        errors[field.id] = `${field.label} is required`
        continue
      }

      // Skip validation if field is empty and not required
      if (!value || value.trim() === '') {
        continue
      }

      // Type-specific validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors[field.id] = 'Invalid email format'
        }
      }

      if (field.type === 'phone' && value) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
        if (!phoneRegex.test(value)) {
          errors[field.id] = 'Invalid phone number format'
        }
      }

      if (field.type === 'number' && value) {
        const num = Number(value)
        if (isNaN(num)) {
          errors[field.id] = 'Must be a valid number'
        } else {
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors[field.id] = `Must be at least ${field.validation.min}`
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors[field.id] = `Must be at most ${field.validation.max}`
          }
        }
      }

      // Length validation
      if (field.validation) {
        const strValue = String(value)
        if (field.validation.minLength && strValue.length < field.validation.minLength) {
          errors[field.id] = `Must be at least ${field.validation.minLength} characters`
        }
        if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
          errors[field.id] = `Must be at most ${field.validation.maxLength} characters`
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(strValue)) {
            errors[field.id] = 'Invalid format'
          }
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }
}
