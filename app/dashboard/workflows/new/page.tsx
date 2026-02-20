'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { WorkflowBuilderForm } from '@/components/workflow/WorkflowBuilderForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'

export default function NewWorkflowPage() {
  const router = useRouter()
  const [showAI, setShowAI] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null)

  const generateMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch('/api/ai/workflows/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setGeneratedWorkflow(data.workflow)
    },
  })

  if (generatedWorkflow) {
    return (
      <WorkflowBuilderForm
        initial={generatedWorkflow}
        onSaved={(id) => router.push('/dashboard/workflows')}
        onCancel={() => {
          setGeneratedWorkflow(null)
          setAiDescription('')
        }}
      />
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl">
      {!showAI ? (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Create Workflow</h1>
            <Button variant="outline" onClick={() => setShowAI(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          </div>
          <WorkflowBuilderForm
            onSaved={(id) => router.push('/dashboard/workflows')}
            onCancel={() => router.push('/dashboard/workflows')}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Generate Workflow with AI
            </CardTitle>
            <CardDescription>
              Describe what you want the workflow to do in plain English
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Describe your workflow
              </label>
              <Textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g., When a new contact is created, send them a welcome email and create a follow-up task for 3 days later"
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: "Send email when invoice is overdue", "Create task when deal is created", "Welcome new leads with SMS"
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => generateMutation.mutate(aiDescription)}
                disabled={!aiDescription.trim() || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Workflow
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAI(false)}>
                Use Manual Builder
              </Button>
            </div>
            {generateMutation.error && (
              <div className="text-sm text-red-600">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : 'Generation failed'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

