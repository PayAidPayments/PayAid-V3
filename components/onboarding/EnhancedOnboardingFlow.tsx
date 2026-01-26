'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ReactNode
  required: boolean
}

interface EnhancedOnboardingFlowProps {
  steps: OnboardingStep[]
  onComplete?: () => void
  onSkip?: () => void
}

export function EnhancedOnboardingFlow({
  steps,
  onComplete,
  onSkip,
}: EnhancedOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set())

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    setCompletedSteps(new Set([...completedSteps, currentStep]))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    const step = steps[currentStep]
    if (!step.required) {
      setSkippedSteps(new Set([...skippedSteps, currentStep]))
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        onSkip?.()
      }
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Welcome to PayAid CRM</CardTitle>
                <CardDescription>Let's get you set up in just a few steps</CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
        </Card>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center flex-1',
                index < steps.length - 1 && 'mr-2'
              )}
            >
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                    completedSteps.has(index)
                      ? 'bg-green-600 text-white'
                      : skippedSteps.has(index)
                        ? 'bg-gray-300 text-gray-600'
                        : index === currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {completedSteps.has(index) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-xs text-center max-w-20">
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-1 flex-1 mx-2',
                    completedSteps.has(index) ? 'bg-green-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStepData.title}</CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStepData.component}

            <div className="flex justify-between pt-4 border-t">
              <div>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {!currentStepData.required && (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
