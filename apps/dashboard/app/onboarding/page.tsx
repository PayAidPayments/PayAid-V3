'use client'

import { useRouter } from 'next/navigation'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/OnboardingWizard'
import { useMutation } from '@tanstack/react-query'

export default function OnboardingPage() {
  const router = useRouter()

  const completeMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete onboarding')
      }
      return response.json()
    },
    onSuccess: () => {
      router.push('/dashboard')
    },
  })

  const handleComplete = (data: OnboardingData) => {
    completeMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <OnboardingWizard onComplete={handleComplete} />
    </div>
  )
}

