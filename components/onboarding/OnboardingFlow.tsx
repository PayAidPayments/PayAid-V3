'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Mail, Users, TrendingUp, Settings } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  completed: boolean
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'email',
      title: 'Connect Your Email',
      description: 'Sync your Gmail or Outlook to automatically log emails',
      icon: <Mail className="h-6 w-6" />,
      action: () => {
        // Navigate to email settings
        window.location.href = '/settings/email'
      },
      completed: false,
    },
    {
      id: 'contacts',
      title: 'Import Contacts',
      description: 'Add your contacts or import from CSV',
      icon: <Users className="h-6 w-6" />,
      action: () => {
        window.location.href = '/contacts/import'
      },
      completed: false,
    },
    {
      id: 'pipeline',
      title: 'Set Up Pipeline',
      description: 'Choose an industry template or customize your deal stages',
      icon: <TrendingUp className="h-6 w-6" />,
      action: () => {
        window.location.href = '/settings/pipeline'
      },
      completed: false,
    },
    {
      id: 'team',
      title: 'Invite Team Members',
      description: 'Add your team and assign roles',
      icon: <Settings className="h-6 w-6" />,
      action: () => {
        window.location.href = '/settings/team'
      },
      completed: false,
    },
  ])

  useEffect(() => {
    // Check completion status
    checkCompletionStatus()
  }, [])

  const checkCompletionStatus = async () => {
    try {
      // Check if email is connected
      const emailRes = await fetch('/api/email/accounts')
      const emailData = await emailRes.json()
      if (emailData.data && emailData.data.length > 0) {
        updateStepCompletion('email', true)
      }

      // Check if contacts exist
      const contactsRes = await fetch('/api/crm/contacts?limit=1')
      const contactsData = await contactsRes.json()
      if (contactsData.data && contactsData.data.length > 0) {
        updateStepCompletion('contacts', true)
      }

      // Check if pipeline is configured
      const pipelineRes = await fetch('/api/crm/deals?limit=1')
      const pipelineData = await pipelineRes.json()
      if (pipelineData.data) {
        updateStepCompletion('pipeline', true)
      }

      // Check if team members exist
      const teamRes = await fetch('/api/users')
      const teamData = await teamRes.json()
      if (teamData.data && teamData.data.length > 1) {
        updateStepCompletion('team', true)
      }
    } catch (error) {
      console.error('Error checking completion status:', error)
    }
  }

  const updateStepCompletion = (stepId: string, completed: boolean) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, completed } : step))
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = async () => {
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]
  const completedSteps = steps.filter((s) => s.completed).length

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Welcome to PayAid CRM!</CardTitle>
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <CardDescription>
            Let's get you set up in just a few steps ({completedSteps}/{steps.length} completed)
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {currentStepData.completed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    {currentStepData.icon}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                <p className="text-gray-600 mt-1">{currentStepData.description}</p>
                {currentStepData.completed && (
                  <p className="text-sm text-green-600 mt-2">✓ Completed</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={currentStepData.action}>
                  {currentStepData.completed ? 'Review' : 'Get Started'}
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2 pt-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep
                      ? 'bg-purple-600'
                      : step.completed
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
