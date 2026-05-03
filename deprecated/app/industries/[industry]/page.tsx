'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { getIndustryConfig, getAllIndustries } from '@/lib/industries/config'
import { CheckCircle2, ArrowRight, Sparkles, Package, Users, DollarSign } from 'lucide-react'

export default function IndustryLandingPage() {
  const params = useParams()
  const router = useRouter()
  const industryId = params?.industry as string

  const [industry, setIndustry] = useState<any>(null)
  const [recommendedModules, setRecommendedModules] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!industryId) return

    const config = getIndustryConfig(industryId)
    if (config) {
      setIndustry(config)
      
      // Fetch recommended modules
      fetch(`/api/industries/${industryId}/modules`)
        .then(res => res.json())
        .then(data => {
          setRecommendedModules(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [industryId])

  if (loading) {
    return <PageLoading message="Loading industry information..." fullScreen={true} />
  }

  if (!industry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Industry not found</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGetStarted = () => {
    router.push(`/signup?industry=${industryId}`)
  }

  const handleLearnMore = () => {
    router.push(`/industries/${industryId}/features`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{industry.icon}</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {industry.name} Management Software
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {industry.description}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleLearnMore} className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>

        {/* Core Modules Section */}
        {recommendedModules && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Everything You Need to Run Your {industry.name} Business
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {recommendedModules.coreModules?.map((moduleId: string) => {
                const moduleIcons: Record<string, any> = {
                  crm: Users,
                  finance: DollarSign,
                  inventory: Package,
                  sales: DollarSign,
                  'ai-studio': Sparkles,
                }
                const Icon = moduleIcons[moduleId] || Package
                const moduleNames: Record<string, string> = {
                  crm: 'CRM',
                  finance: 'Finance & Accounting',
                  inventory: 'Inventory',
                  sales: 'Sales',
                  'ai-studio': 'AI Studio',
                }

                return (
                  <Card key={moduleId} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>{moduleNames[moduleId] || moduleId}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Included in your {industry.name} plan
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Industry Features */}
        {industry.industryFeatures && industry.industryFeatures.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              {industry.name}-Specific Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industry.industryFeatures.map((feature: string, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Industry Subtypes */}
        {industry.subTypes && industry.subTypes.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Perfect for All Types of {industry.name} Businesses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industry.subTypes.map((subType: any) => (
                <Card key={subType.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{subType.name}</CardTitle>
                    <CardDescription>{subType.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-[#53328A] to-[#F5C700] text-white border-0">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your {industry.name} Business?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of businesses already using PayAid
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGetStarted}
                className="text-lg px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

