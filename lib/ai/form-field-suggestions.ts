/**
 * AI-Powered Form Field Suggestions
 * Context-aware form field suggestions based on industry, purpose, and best practices
 */

import { ChatGroq } from '@langchain/groq'
import { logger } from '@/lib/logging/structured-logger'
import { FormField } from '@/lib/forms/form-builder'

export interface FormContext {
  industry?: string
  purpose?: string // 'lead_capture', 'contact_form', 'event_registration', 'survey', 'quote_request'
  existingFields?: FormField[]
  companyName?: string
}

export interface FieldSuggestion {
  label: string
  type: FormField['type']
  placeholder?: string
  required: boolean
  options?: string[]
  reasoning: string
  confidence: number // 0 to 1
}

export class FormFieldSuggestionService {
  private llm: ChatGroq

  constructor() {
    this.llm = new ChatGroq({
      modelName: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  /**
   * Get AI-powered form field suggestions
   */
  async suggestFields(context: FormContext): Promise<FieldSuggestion[]> {
    try {
      const prompt = this.buildSuggestionPrompt(context)
      const response = await this.llm.invoke(prompt)
      const suggestions = this.parseSuggestions(response, context)

      logger.info('Form field suggestions generated', {
        industry: context.industry,
        purpose: context.purpose,
        suggestionCount: suggestions.length,
      })

      return suggestions
    } catch (error) {
      logger.error('Failed to generate form field suggestions', error instanceof Error ? error : undefined)
      // Fallback to industry-specific defaults
      return this.getFallbackSuggestions(context)
    }
  }

  private buildSuggestionPrompt(context: FormContext): string {
    const industryContext = context.industry
      ? `Industry: ${context.industry}\n`
      : ''
    const purposeContext = context.purpose
      ? `Form Purpose: ${context.purpose}\n`
      : ''
    const existingFields = context.existingFields?.length
      ? `Existing Fields: ${context.existingFields.map((f) => f.label).join(', ')}\n`
      : ''

    return `You are an expert form designer helping create effective lead capture forms.

Context:
${industryContext}${purposeContext}${existingFields}

Based on best practices for ${context.industry || 'general'} forms with purpose "${context.purpose || 'lead_capture'}", suggest 5-8 form fields that would be most effective.

Consider:
1. Essential contact information (name, email, phone)
2. Industry-specific fields (e.g., company size for B2B, budget for sales)
3. Qualification fields (e.g., timeline, requirements)
4. GDPR compliance (consent checkboxes)
5. Progressive profiling (don't ask for too much upfront)

Return suggestions as JSON array:
[
  {
    "label": "Field label",
    "type": "text|email|phone|select|checkbox|radio|textarea|number|date",
    "placeholder": "Optional placeholder text",
    "required": true|false,
    "options": ["option1", "option2"] // Only for select/radio
  }
]

For each field, also provide:
- "reasoning": "Why this field is important"
- "confidence": 0.0-1.0 (how confident you are this field is needed)

Return only valid JSON, no markdown formatting.`
  }

  private parseSuggestions(response: string, context: FormContext): FieldSuggestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return this.getFallbackSuggestions(context)
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        label: string
        type: string
        placeholder?: string
        required: boolean
        options?: string[]
        reasoning?: string
        confidence?: number
      }>

      return parsed.map((field) => ({
        label: field.label,
        type: this.validateFieldType(field.type),
        placeholder: field.placeholder,
        required: field.required ?? false,
        options: field.options,
        reasoning: field.reasoning || 'AI-suggested field',
        confidence: field.confidence ?? 0.7,
      }))
    } catch (error) {
      logger.error('Failed to parse AI suggestions', error instanceof Error ? error : undefined)
      return this.getFallbackSuggestions(context)
    }
  }

  private validateFieldType(type: string): FormField['type'] {
    const validTypes: FormField['type'][] = [
      'text',
      'email',
      'phone',
      'select',
      'checkbox',
      'radio',
      'textarea',
      'number',
      'date',
    ]
    return validTypes.includes(type as FormField['type']) ? (type as FormField['type']) : 'text'
  }

  private getFallbackSuggestions(context: FormContext): FieldSuggestion[] {
    // Industry-specific defaults
    const industryDefaults: Record<string, FieldSuggestion[]> = {
      fintech: [
        {
          label: 'Full Name',
          type: 'text',
          placeholder: 'Enter your full name',
          required: true,
          reasoning: 'Required for KYC compliance',
          confidence: 1.0,
        },
        {
          label: 'Email Address',
          type: 'email',
          placeholder: 'your.email@example.com',
          required: true,
          reasoning: 'Primary contact method',
          confidence: 1.0,
        },
        {
          label: 'Phone Number',
          type: 'phone',
          placeholder: '+91 98765 43210',
          required: true,
          reasoning: 'Required for verification',
          confidence: 0.9,
        },
        {
          label: 'Company Name',
          type: 'text',
          placeholder: 'Your company name',
          required: false,
          reasoning: 'B2B qualification',
          confidence: 0.8,
        },
        {
          label: 'Monthly Transaction Volume',
          type: 'select',
          options: ['< ₹1L', '₹1L - ₹10L', '₹10L - ₹50L', '₹50L+'],
          required: false,
          reasoning: 'Helps qualify lead value',
          confidence: 0.7,
        },
      ],
      d2c: [
        {
          label: 'Name',
          type: 'text',
          placeholder: 'Your name',
          required: true,
          reasoning: 'Personalization',
          confidence: 1.0,
        },
        {
          label: 'Email',
          type: 'email',
          placeholder: 'your.email@example.com',
          required: true,
          reasoning: 'Order confirmations',
          confidence: 1.0,
        },
        {
          label: 'Phone',
          type: 'phone',
          placeholder: '+91 98765 43210',
          required: true,
          reasoning: 'Delivery updates',
          confidence: 0.9,
        },
        {
          label: 'Product Interest',
          type: 'select',
          options: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'],
          required: false,
          reasoning: 'Segmentation',
          confidence: 0.7,
        },
      ],
    }

    // Purpose-specific defaults
    const purposeDefaults: Record<string, FieldSuggestion[]> = {
      lead_capture: [
        {
          label: 'Name',
          type: 'text',
          required: true,
          reasoning: 'Basic contact information',
          confidence: 1.0,
        },
        {
          label: 'Email',
          type: 'email',
          required: true,
          reasoning: 'Primary contact method',
          confidence: 1.0,
        },
        {
          label: 'Phone',
          type: 'phone',
          required: false,
          reasoning: 'Optional contact method',
          confidence: 0.8,
        },
      ],
      event_registration: [
        {
          label: 'Full Name',
          type: 'text',
          required: true,
          reasoning: 'Event badge',
          confidence: 1.0,
        },
        {
          label: 'Email',
          type: 'email',
          required: true,
          reasoning: 'Event updates',
          confidence: 1.0,
        },
        {
          label: 'Phone',
          type: 'phone',
          required: true,
          reasoning: 'Emergency contact',
          confidence: 0.9,
        },
        {
          label: 'Dietary Requirements',
          type: 'select',
          options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'],
          required: false,
          reasoning: 'Catering planning',
          confidence: 0.7,
        },
      ],
    }

    // Return industry-specific if available, otherwise purpose-specific, otherwise generic
    if (context.industry && industryDefaults[context.industry]) {
      return industryDefaults[context.industry]
    }
    if (context.purpose && purposeDefaults[context.purpose]) {
      return purposeDefaults[context.purpose]
    }

    // Generic fallback
    return [
      {
        label: 'Name',
        type: 'text',
        required: true,
        reasoning: 'Basic contact information',
        confidence: 1.0,
      },
      {
        label: 'Email',
        type: 'email',
        required: true,
        reasoning: 'Primary contact method',
        confidence: 1.0,
      },
    ]
  }
}
