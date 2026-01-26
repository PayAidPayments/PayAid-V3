/**
 * Form Builder Component
 * Visual drag-and-drop form designer
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Save, Sparkles } from 'lucide-react'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'number' | 'date'
  placeholder?: string
  required: boolean
  options?: string[]
  order: number
}

interface FormBuilderProps {
  tenantId: string
  formId?: string
  onSave?: (form: { name: string; description?: string; slug: string; fields: FormField[] }) => void
}

export function FormBuilder({ tenantId, formId, onSave }: FormBuilderProps) {
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [industry, setIndustry] = useState('')
  const [purpose, setPurpose] = useState('lead_capture')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Load existing form if formId provided
  useEffect(() => {
    if (formId) {
      // TODO: Fetch form data
      // fetchForm(formId).then(setFormData)
    }
  }, [formId])

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      order: fields.length,
    }
    setFields([...fields, newField])
    setEditingField(newField)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
    if (editingField?.id === fieldId) {
      setEditingField({ ...editingField, ...updates })
    }
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    if (editingField?.id === fieldId) {
      setEditingField(null)
    }
  }

  const getAISuggestions = async () => {
    try {
      setLoadingSuggestions(true)
      const response = await fetch('/api/forms/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry || undefined,
          purpose: purpose || 'lead_capture',
          existingFields: fields.map((f) => ({
            label: f.label,
            type: f.type,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get suggestions')

      const data = await response.json()
      const suggestions = data.data || []

      // Add suggested fields
      const newFields = suggestions.map((suggestion: any, index: number) => ({
        id: `field-${Date.now()}-${index}`,
        label: suggestion.label,
        type: suggestion.type,
        placeholder: suggestion.placeholder,
        required: suggestion.required || false,
        options: suggestion.options,
        order: fields.length + index,
      }))

      setFields([...fields, ...newFields])
      alert(`Added ${newFields.length} AI-suggested fields!`)
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      alert('Failed to get AI suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleSave = async () => {
    if (!formName || !formSlug) {
      alert('Please fill in form name and slug')
      return
    }

    if (fields.length === 0) {
      alert('Please add at least one field')
      return
    }

    const formData = {
      name: formName,
      description: formDescription,
      slug: formSlug,
      fields: fields.map((f) => ({
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options,
        order: f.order,
      })),
    }

    try {
      const response = await fetch('/api/forms' + (formId ? `/${formId}` : ''), {
        method: formId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save form')
      }

      const result = await response.json()
      onSave?.(formData)
      alert('Form saved successfully!')
    } catch (error) {
      console.error('Save form error:', error)
      alert('Failed to save form')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure your form name, description, and slug</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={getAISuggestions}
              disabled={loadingSuggestions}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loadingSuggestions ? 'Getting Suggestions...' : 'Get AI Suggestions'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="formName">Form Name *</Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contact Form"
            />
          </div>
          <div>
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this form"
            />
          </div>
          <div>
            <Label htmlFor="formSlug">Slug *</Label>
            <Input
              id="formSlug"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="contact-form"
            />
            <p className="text-sm text-muted-foreground mt-1">
              URL: /forms/{formSlug || 'your-slug'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry (for AI suggestions)</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., fintech, d2c, agency"
              />
            </div>
            <div>
              <Label htmlFor="purpose">Form Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_capture">Lead Capture</SelectItem>
                  <SelectItem value="contact_form">Contact Form</SelectItem>
                  <SelectItem value="event_registration">Event Registration</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                  <SelectItem value="quote_request">Quote Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Add and configure form fields</CardDescription>
            </div>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fields added yet. Click &quot;Add Field&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={`border rounded-lg p-4 ${
                    editingField?.id === field.id ? 'border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Field Label"
                          className="flex-1"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value: FormField['type']) =>
                            updateField(field.id, { type: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                      />
                      {(field.type === 'select' || field.type === 'radio') && (
                        <div>
                          <Label className="text-sm">Options (one per line)</Label>
                          <Textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value.split('\n').filter(Boolean),
                              })
                            }
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Form
        </Button>
      </div>
    </div>
  )
}
