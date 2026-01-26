'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Sparkles, TrendingUp, Users, Shield } from 'lucide-react'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

const onboardingSteps = [
  {
    id: 'profile',
    title: 'Complete Company Profile',
    description: 'Add company details, GSTIN, and compliance settings',
    icon: Shield,
    route: '/settings/company',
  },
  {
    id: 'ai-setup',
    title: 'Enable AI Co-Founder',
    description: 'Activate AI features and configure preferences',
    icon: Sparkles,
    route: '/dashboard/ai-studio',
  },
  {
    id: 'forecast',
    title: 'View Revenue Forecast',
    description: 'Explore your 90-day revenue projection',
    icon: TrendingUp,
    route: '/dashboard/forecast',
  },
  {
    id: 'team',
    title: 'Invite Team Members',
    description: 'Add team members for collaboration',
    icon: Users,
    route: '/settings/team',
  },
]

export default function OnboardingWelcome() {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    // Check completed steps from localStorage or API
    const saved = localStorage.getItem('onboarding_completed')
    if (saved) {
      setCompletedSteps(JSON.parse(saved))
    }
  }, [])

  const markStepComplete = (stepId: string) => {
    const updated = [...completedSteps, stepId]
    setCompletedSteps(updated)
    localStorage.setItem('onboarding_completed', JSON.stringify(updated))
  }

  const handleStepClick = (step: typeof onboardingSteps[0]) => {
    router.push(step.route)
  }

  const allComplete = onboardingSteps.every((step) => completedSteps.includes(step.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold" style={{ color: PAYAID_PURPLE }}>
            Welcome to PayAid V3! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered business management platform
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {onboardingSteps.map((step) => {
            const Icon = step.icon
            const isComplete = completedSteps.includes(step.id)

            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isComplete ? 'border-green-500' : ''
                }`}
                onClick={() => handleStepClick(step)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${PAYAID_PURPLE}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: PAYAID_PURPLE }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    {isComplete && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepClick(step)
                    }}
                  >
                    {isComplete ? 'Review' : 'Get Started'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Completion Message */}
        {allComplete && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Onboarding Complete! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                You're all set to start using PayAid V3. Explore all features and start
                collaborating with your team!
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                style={{ backgroundColor: PAYAID_PURPLE }}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Skip Option */}
        {!allComplete && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            >
              Skip onboarding for now
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
