'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getIndustryConfig } from '@/lib/industries/config'
import { Logo } from '@/components/brand/Logo'

// Get subdomain domain from environment (defaults to payaid.com)
const SUBDOMAIN_DOMAIN = process.env.NEXT_PUBLIC_SUBDOMAIN_DOMAIN || 'payaid.com'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const industryId = searchParams.get('industry')
  const selectedModulesParam = searchParams.get('modules')
  const selectedTierParam = searchParams.get('tier') as 'starter' | 'professional' | null
  const industrySubTypeParam = searchParams.get('subtype')
  const { register, isLoading, token } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    subdomain: '',
  })
  const [error, setError] = useState('')
  const [industry, setIndustry] = useState<any>(null)

  useEffect(() => {
    if (industryId) {
      // Handle custom industry
      if (industryId === 'custom') {
        const customName = searchParams.get('name')
        if (customName) {
          setIndustry({
            id: 'custom',
            name: decodeURIComponent(customName),
            icon: '💼',
            description: 'Custom industry configuration',
          })
          if (!formData.tenantName) {
            setFormData(prev => ({
              ...prev,
              tenantName: `My ${decodeURIComponent(customName)} Business`,
            }))
          }
        }
      } else {
        const config = getIndustryConfig(industryId)
        if (config) {
          setIndustry(config)
          // Pre-fill business name suggestion based on industry
          if (!formData.tenantName) {
            setFormData(prev => ({
              ...prev,
              tenantName: `My ${config.name} Business`,
            }))
          }
        }
      }
    }
  }, [industryId, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens')
      return
    }

    try {
      // Register the user
      await register(formData)
      
      // Get token from store after registration
      const authToken = useAuthStore.getState().token
      
      // If industry is specified, configure modules after registration
      if (industryId && authToken) {
        try {
          // Parse selected modules from URL parameter
          const selectedModules = selectedModulesParam
            ? selectedModulesParam.split(',').filter(Boolean)
            : []
          
          // Ensure ai-studio is always included
          if (!selectedModules.includes('ai-studio')) {
            selectedModules.push('ai-studio')
          }

          // For custom industries, fetch AI recommendations first
          if (industryId === 'custom') {
            const customName = searchParams.get('name')
            if (customName) {
              // Use selected modules or fetch AI recommendations
              let modulesToEnable = selectedModules.length > 1 // More than just ai-studio
                ? selectedModules
                : ['crm', 'finance', 'ai-studio']
              
              // If no modules selected, fetch AI recommendations
              if (selectedModules.length <= 1) {
                const aiResponse = await fetch('/api/ai/analyze-industry', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    industryName: decodeURIComponent(customName),
                  }),
                })
                
                if (aiResponse.ok) {
                  const aiData = await aiResponse.json()
                  modulesToEnable = aiData.coreModules || modulesToEnable
                }
              }

              await fetch('/api/industries/custom/modules', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  industryName: decodeURIComponent(customName),
                  coreModules: modulesToEnable,
                  industryFeatures: [],
                }),
              })
            }
          } else {
            // Standard industry configuration with selected modules
            if (selectedModules.length > 0) {
              // Use selected modules
              await fetch('/api/industries/' + industryId + '/modules', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  industries: [industryId],
                  selectedModules: selectedModules,
                  tier: selectedTierParam || 'professional',
                  industrySubType: industrySubTypeParam || null,
                }),
              })
            } else {
              // Fallback to auto-configure all recommended modules
              await fetch('/api/industries/' + industryId + '/modules', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  industries: [industryId],
                  tier: selectedTierParam || 'professional',
                  industrySubType: industrySubTypeParam || null,
                }),
              })
            }
          }
        } catch (configError) {
          console.warn('Failed to configure industry modules:', configError)
          // Don't fail registration if auto-config fails
        }
      }

      // After signup, check if industry was set
      if (industryId && authToken) {
        // Industry was set during signup - redirect to tenant home page to see modules
        const { tenant } = useAuthStore.getState()
        if (tenant?.id) {
          router.push(`/home/${tenant.id}`)
        } else {
          router.push('/home')
        }
      } else {
        // No industry set - redirect to landing page to select industry
        router.push('/?onboarding=true')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {industry ? (
              <>
                <div className="text-4xl mb-2">{industry.icon}</div>
                Start Your {industry.name} Business
              </>
            ) : (
              'Create your account'
            )}
          </CardTitle>
          <CardDescription className="text-center">
            {industry 
              ? `Get started with ${industry.name} management`
              : 'Get started with PayAid V3 Business Operating System'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {industry && (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
                <strong>{industry.name} features:</strong> {industry.description}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="tenantName" className="text-sm font-medium">
                Business Name
              </label>
              <Input
                id="tenantName"
                name="tenantName"
                type="text"
                placeholder={industry ? `My ${industry.name} Business` : 'My Business'}
                value={formData.tenantName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subdomain" className="text-sm font-medium">
                Subdomain
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  placeholder="mybusiness"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  pattern="[a-z0-9-]+"
                  disabled={isLoading}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  .{SUBDOMAIN_DOMAIN}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
            <div className="text-center mt-4">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home Page
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}

// Prevent static generation - this page uses useSearchParams which requires dynamic rendering
export const dynamic = 'force-dynamic'
