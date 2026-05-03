/**
 * Form Renderer Component
 * Renders form for public embedding
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FormField {
  id: string
  label: string
  type: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface FormRendererProps {
  slug: string
  onSubmit?: (data: Record<string, any>) => void
}

export function FormRenderer({ slug, onSubmit }: FormRendererProps) {
  const [form, setForm] = useState<{ name: string; fields: FormField[]; settings: any } | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Fetch form data
    fetch(`/api/forms/public/${slug}/render`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setForm(data.data)
        }
      })
      .catch((error) => {
        console.error('Error loading form:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/forms/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setSubmitted(true)
      onSubmit?.(formData)
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading form...</div>
  }

  if (!form) {
    return <div className="text-center py-8 text-red-500">Form not found</div>
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 font-semibold mb-2">Form submitted successfully!</div>
        <p className="text-muted-foreground">
          {form.settings?.successMessage || 'Thank you for your submission. We will get back to you soon.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{form.name}</h2>

      {form.fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {field.type === 'text' && (
            <Input
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {field.type === 'email' && (
            <Input
              id={field.id}
              type="email"
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {field.type === 'phone' && (
            <Input
              id={field.id}
              type="tel"
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {field.type === 'number' && (
            <Input
              id={field.id}
              type="number"
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {field.type === 'date' && (
            <Input
              id={field.id}
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
            />
          )}

          {field.type === 'select' && (
            <CustomSelect
              value={formData[field.id] || ''}
              onValueChange={(value: string) => setFormData({ ...formData, [field.id]: value })}
              placeholder={field.placeholder || 'Select an option'}
            >
              <CustomSelectTrigger>
              </CustomSelectTrigger>
              <CustomSelectContent>
                {field.options?.map((option) => (
                  <CustomSelectItem key={option} value={option}>
                    {option}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          )}

          {field.type === 'radio' && (
            <RadioGroup
              value={formData[field.id] || ''}
              onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {field.type === 'checkbox' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(formData[field.id] as string[])?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const current = (formData[field.id] as string[]) || []
                      setFormData({
                        ...formData,
                        [field.id]: checked
                          ? [...current, option]
                          : current.filter((v) => v !== option),
                      })
                    }}
                  />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {form.settings?.gdprConsent && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="gdpr-consent"
            checked={formData.gdprConsent || false}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, gdprConsent: checked })
            }
            required
          />
          <Label htmlFor="gdpr-consent" className="text-sm">
            I consent to the processing of my personal data
          </Label>
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
