'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { INDUSTRY_PRESETS, BUSINESS_GOALS, type IndustryPreset } from '@/lib/onboarding/industry-presets'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
}

export interface OnboardingData {
  industries: string[]
  businessComplexity: 'single' | 'multiple-locations' | 'multiple-lines'
  businessUnits?: Array<{
    name: string
    industryPacks: string[]
    location?: string
  }>
  goals: string[]
  recommendedModules: {
    baseModules: string[]
    industryPacks: string[]
    recommendedModules: string[]
  }
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [businessComplexity, setBusinessComplexity] = useState<'single' | 'multiple-locations' | 'multiple-lines'>('single')
  const [businessUnits, setBusinessUnits] = useState<Array<{ name: string; industryPacks: string[]; location?: string }>>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<any>(null)

  const handleIndustryToggle = (industryId: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industryId)
        ? prev.filter((id) => id !== industryId)
        : [...prev, industryId]
    )
  }

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleNext = async () => {
    if (step === 1 && selectedIndustries.length === 0) {
      alert('Please select at least one business type')
      return
    }

    if (step === 2 && !businessComplexity) {
      alert('Please select business complexity')
      return
    }

    if (step === 3 && businessComplexity === 'multiple-lines' && businessUnits.length === 0) {
      alert('Please add at least one business unit')
      return
    }

    if (step === 4 && selectedGoals.length === 0) {
      alert('Please select at least one goal')
      return
    }

    if (step === 4) {
      // Get recommendations
      const response = await fetch('/api/onboarding/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryIds: selectedIndustries,
          goals: selectedGoals,
          businessComplexity,
        }),
      })
      const data = await response.json()
      setRecommendations(data.recommendations)
      setStep(5)
      return
    }

    if (step === 5) {
      // Complete onboarding
      onComplete({
        industries: selectedIndustries,
        businessComplexity,
        businessUnits: businessComplexity === 'multiple-lines' ? businessUnits : undefined,
        goals: selectedGoals,
        recommendedModules: recommendations,
      })
      return
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const addBusinessUnit = () => {
    setBusinessUnits([...businessUnits, { name: '', industryPacks: [] }])
  }

  const updateBusinessUnit = (index: number, updates: Partial<typeof businessUnits[0]>) => {
    const updated = [...businessUnits]
    updated[index] = { ...updated[index], ...updates }
    setBusinessUnits(updated)
  }

  const removeBusinessUnit = (index: number) => {
    setBusinessUnits(businessUnits.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to PayAid V3</CardTitle>
          <CardDescription>
            Let's set up your business. This will take just a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Business Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Which best describes your business?</h2>
                <p className="text-sm text-gray-600 mb-4">You can select multiple if you run different business lines</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {INDUSTRY_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleIndustryToggle(preset.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedIndustries.includes(preset.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      {selectedIndustries.includes(preset.id) && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{preset.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Business Complexity */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">How many business units do you have?</h2>
                <p className="text-sm text-gray-600 mb-4">This helps us recommend the right setup</p>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'single', label: 'Single business / single location', desc: 'One business, one location' },
                  { id: 'multiple-locations', label: 'Multiple branches / locations', desc: 'Same business, multiple locations' },
                  { id: 'multiple-lines', label: 'Multiple business lines', desc: 'Different businesses (e.g., Manufacturing + Retail + Restaurant)' },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setBusinessComplexity(option.id as any)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      businessComplexity === option.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Business Units (if multiple lines) */}
          {step === 3 && businessComplexity === 'multiple-lines' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Create Your Business Units</h2>
                <p className="text-sm text-gray-600 mb-4">Each unit can have different industry modules</p>
              </div>
              <div className="space-y-4">
                {businessUnits.map((unit, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Business Unit {index + 1}</h3>
                          {businessUnits.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBusinessUnit(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Unit name (e.g., Manufacturing Plant)"
                          value={unit.name}
                          onChange={(e) => updateBusinessUnit(index, { name: e.target.value })}
                        />
                        <Input
                          placeholder="Location (optional)"
                          value={unit.location || ''}
                          onChange={(e) => updateBusinessUnit(index, { location: e.target.value })}
                        />
                        <div>
                          <label className="text-sm font-medium mb-2 block">Industry Packs</label>
                          <div className="flex flex-wrap gap-2">
                            {INDUSTRY_PRESETS.map((preset) => (
                              <Button
                                key={preset.id}
                                variant={unit.industryPacks.includes(preset.id) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  const packs = unit.industryPacks.includes(preset.id)
                                    ? unit.industryPacks.filter((p) => p !== preset.id)
                                    : [...unit.industryPacks, preset.id]
                                  updateBusinessUnit(index, { industryPacks: packs })
                                }}
                              >
                                {preset.icon} {preset.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addBusinessUnit}>
                  + Add Business Unit
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">What do you want to set up first?</h2>
                <p className="text-sm text-gray-600 mb-4">Select your top 3 priorities</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUSINESS_GOALS.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedGoals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{goal.icon}</span>
                      {selectedGoals.includes(goal.id) && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{goal.label}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Recommendations */}
          {step === 5 && recommendations && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Your Recommended Setup</h2>
                <p className="text-sm text-gray-600 mb-4">Based on your selections, here's what we recommend</p>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Base Modules (Always Included)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.baseModules.map((module: string) => (
                        <span key={module} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {module}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Packs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.industryPacks.map((pack: string) => (
                        <span key={pack} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {pack}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Recommended Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.recommendedModules.map((module: string) => (
                        <span key={module} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {module}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-sm text-gray-500">
              Step {step} of {businessComplexity === 'multiple-lines' ? 5 : 4}
            </div>
            <Button onClick={handleNext}>
              {step === 5 ? 'Complete Setup' : 'Next'}
              {step !== 5 && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

