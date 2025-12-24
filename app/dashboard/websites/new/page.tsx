'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { apiRequest } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Sparkles, ArrowRight, ArrowLeft, Building2, Palette, Target, Globe } from 'lucide-react'
import { ModuleGate } from '@/components/modules/ModuleGate'

type WebsiteType = 'business' | 'portfolio' | 'ecommerce' | 'blog' | 'landing' | 'other'
type Industry = 'ecommerce' | 'saas' | 'restaurant' | 'healthcare' | 'education' | 'real-estate' | 'finance' | 'other'
type Style = 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant'

interface FormData {
  // Step 1: Basic Info
  name: string
  domain: string
  subdomain: string
  
  // Step 2: Website Type & Industry
  websiteType: WebsiteType
  industry: Industry
  purpose: string
  
  // Step 3: Design Preferences
  style: Style
  primaryColor: string
  includeFeatures: string[]
  
  // Step 4: SEO & Content
  metaTitle: string
  metaDescription: string
  targetAudience: string
}

const STEPS = [
  { id: 1, title: 'Basic Information', icon: Globe },
  { id: 2, title: 'Website Type', icon: Building2 },
  { id: 3, title: 'Design Preferences', icon: Palette },
  { id: 4, title: 'SEO & Content', icon: Target },
]

function NewWebsitePageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant } = useAuthStore()
  
  // Extract tenant ID from pathname (e.g., /dashboard/[tenantId]/websites/new)
  // or get from auth store
  const pathParts = pathname.split('/').filter(Boolean)
  const tenantIdFromPath = pathParts.length > 1 && pathParts[0] === 'dashboard' && pathParts[1].length > 15 
    ? pathParts[1] 
    : null
  const tenantId = tenantIdFromPath || tenant?.id

  // Helper to create tenant-aware URLs
  const getUrl = (path: string) => {
    if (tenantId) {
      const cleanPath = path.replace(/^\/dashboard\/?/, '')
      return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
    }
    return path
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    domain: '',
    subdomain: '',
    websiteType: 'business',
    industry: 'other',
    purpose: '',
    style: 'modern',
    primaryColor: '#3b82f6',
    includeFeatures: [],
    metaTitle: '',
    metaDescription: '',
    targetAudience: '',
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        const response = await apiRequest('/api/websites', {
          method: 'POST',
          body: JSON.stringify({
            name: data.name.trim(),
            domain: data.domain?.trim() || undefined,
            subdomain: data.subdomain?.trim() || undefined,
            metaTitle: data.metaTitle?.trim() || undefined,
            metaDescription: data.metaDescription?.trim() || undefined,
            // Store questionnaire data for AI builder
            questionnaireData: {
              websiteType: data.websiteType,
              industry: data.industry,
              purpose: data.purpose,
              style: data.style,
              primaryColor: data.primaryColor,
              includeFeatures: data.includeFeatures,
              targetAudience: data.targetAudience,
            },
          }),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.message || 'Failed to create website'
          throw new Error(errorMessage)
        }
        const result = await response.json()
        if (!result.id) {
          throw new Error('Invalid response from server')
        }
        return result
      } catch (err) {
        console.error('Create website mutation error:', err)
        throw err
      }
    },
    onSuccess: (data) => {
      if (data?.id) {
        // Redirect to builder page with pre-filled data
        const params = new URLSearchParams({
          type: formData.websiteType,
          industry: formData.industry,
          style: formData.style,
          purpose: formData.purpose || '',
        })
        router.push(getUrl(`/dashboard/websites/${data.id}/builder?${params.toString()}`))
      } else {
        setError('Website created but could not redirect. Please refresh the page.')
      }
    },
    onError: (err: Error) => {
      console.error('Create website error:', err)
      setError(err.message || 'Failed to create website. Please try again.')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      return
    }
    
    // Final step - create website
    createMutation.mutate(formData)
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData({ ...formData, ...updates })
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Website</h1>
          <p className="mt-2 text-muted-foreground">
            Answer a few questions to get started with AI-powered website building
          </p>
        </div>
        <Link href={getUrl('/dashboard/websites')}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs mt-2 ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Globe className="h-5 w-5" />}
            {currentStep === 2 && <Building2 className="h-5 w-5" />}
            {currentStep === 3 && <Palette className="h-5 w-5" />}
            {currentStep === 4 && <Target className="h-5 w-5" />}
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Tell us about your website'}
            {currentStep === 2 && 'What type of website are you building?'}
            {currentStep === 3 && 'Choose your design preferences'}
            {currentStep === 4 && 'Help us optimize for search engines'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Website Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    required
                    placeholder="e.g., My Business Website"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Custom Domain (optional)</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => updateFormData({ domain: e.target.value })}
                      placeholder="example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use auto-generated subdomain
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain (optional)</Label>
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => updateFormData({ subdomain: e.target.value })}
                      placeholder="my-site"
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated if left empty
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Website Type & Industry */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>What type of website are you building? <span className="text-red-500">*</span></Label>
                  <RadioGroup
                    value={formData.websiteType}
                    onValueChange={(value) => updateFormData({ websiteType: value as WebsiteType })}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="business" id="type-business" />
                      <Label htmlFor="type-business" className="flex-1 cursor-pointer">
                        <div className="font-medium">Business Website</div>
                        <div className="text-sm text-muted-foreground">Company or organization website</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="ecommerce" id="type-ecommerce" />
                      <Label htmlFor="type-ecommerce" className="flex-1 cursor-pointer">
                        <div className="font-medium">E-commerce Store</div>
                        <div className="text-sm text-muted-foreground">Sell products online</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="portfolio" id="type-portfolio" />
                      <Label htmlFor="type-portfolio" className="flex-1 cursor-pointer">
                        <div className="font-medium">Portfolio</div>
                        <div className="text-sm text-muted-foreground">Showcase your work</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="blog" id="type-blog" />
                      <Label htmlFor="type-blog" className="flex-1 cursor-pointer">
                        <div className="font-medium">Blog</div>
                        <div className="text-sm text-muted-foreground">Share articles and content</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="landing" id="type-landing" />
                      <Label htmlFor="type-landing" className="flex-1 cursor-pointer">
                        <div className="font-medium">Landing Page</div>
                        <div className="text-sm text-muted-foreground">Single page for campaigns</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="other" id="type-other" />
                      <Label htmlFor="type-other" className="flex-1 cursor-pointer">
                        <div className="font-medium">Other</div>
                        <div className="text-sm text-muted-foreground">Something else</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => updateFormData({ industry: value as Industry })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="saas">SaaS / Technology</SelectItem>
                      <SelectItem value="restaurant">Restaurant / Food</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">What's the main purpose of your website?</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => updateFormData({ purpose: e.target.value })}
                    placeholder="e.g., Generate leads, sell products, showcase portfolio..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Design Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="style">Design Style <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => updateFormData({ style: value as Style })}
                  >
                    <SelectTrigger id="style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern - Clean and contemporary</SelectItem>
                      <SelectItem value="classic">Classic - Traditional and professional</SelectItem>
                      <SelectItem value="minimal">Minimal - Simple and focused</SelectItem>
                      <SelectItem value="bold">Bold - Vibrant and eye-catching</SelectItem>
                      <SelectItem value="elegant">Elegant - Sophisticated and refined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => updateFormData({ primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => updateFormData({ primaryColor: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Which features would you like to include?</Label>
                  <div className="space-y-2">
                    {[
                      { id: 'hero', label: 'Hero Section' },
                      { id: 'features', label: 'Features Section' },
                      { id: 'pricing', label: 'Pricing Table' },
                      { id: 'testimonials', label: 'Testimonials' },
                      { id: 'contact', label: 'Contact Form' },
                      { id: 'footer', label: 'Footer' },
                    ].map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature.id}
                          checked={formData.includeFeatures.includes(feature.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData({
                                includeFeatures: [...formData.includeFeatures, feature.id],
                              })
                            } else {
                              updateFormData({
                                includeFeatures: formData.includeFeatures.filter((f) => f !== feature.id),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={feature.id} className="cursor-pointer">
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: SEO & Content */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => updateFormData({ metaTitle: e.target.value })}
                    placeholder="Page title for search engines"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => updateFormData({ metaDescription: e.target.value })}
                    placeholder="Brief description for search engines"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Who is your target audience?</Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => updateFormData({ targetAudience: e.target.value })}
                    placeholder="e.g., Small business owners, Tech enthusiasts, Health-conscious individuals..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {currentStep === STEPS.length ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? 'Creating...' : 'Create & Start Building'}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewWebsitePage() {
  return (
    <ModuleGate module="ai-studio">
      <NewWebsitePageContent />
    </ModuleGate>
  )
}
