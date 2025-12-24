'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface NurtureTemplate {
  id: string
  name: string
  description: string | null
  steps: Array<{
    id: string
    dayNumber: number
    subject: string
    body: string
    order: number
  }>
  enrollmentsCount: number
}

interface NurtureSequenceApplierProps {
  contactId: string
  contactName: string
  onEnroll: () => void
  onClose: () => void
}

export function NurtureSequenceApplier({
  contactId,
  contactName,
  onEnroll,
  onClose,
}: NurtureSequenceApplierProps) {
  const [templates, setTemplates] = useState<NurtureTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/nurture/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (templateId: string) => {
    try {
      setEnrolling(templateId)
      const response = await fetch(`/api/leads/${contactId}/enroll-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })

      if (response.ok) {
        onEnroll()
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to enroll in sequence')
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Apply Nurture Sequence</CardTitle>
          <CardDescription>
            Select a sequence to automatically nurture: {contactName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No nurture templates available</p>
              <p className="text-sm">
                Create templates in Settings → Marketing → Nurture Templates
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                        <div className="mt-2 text-sm text-gray-600">
                          {template.steps.length} emails over{' '}
                          {Math.max(...template.steps.map((s) => s.dayNumber))} days
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEnroll(template.id)}
                        disabled={enrolling === template.id}
                        className="ml-4"
                      >
                        {enrolling === template.id ? 'Enrolling...' : 'Apply'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Email Timeline:
                      </p>
                      {template.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-2 bg-gray-50 rounded"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">
                                Day {step.dayNumber}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-sm font-medium">{step.subject}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {step.body.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
