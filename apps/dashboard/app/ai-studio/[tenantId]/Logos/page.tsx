'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VectorLogoEditor } from '@/components/logo/VectorLogoEditor'
import { Sparkles, Wand2 } from 'lucide-react'

interface Logo {
  id: string
  businessName: string
  industry?: string
  style?: string
  status: string
  logoType?: 'VECTOR' | 'AI_IMAGE'
  variations: Array<{
    id: string
    imageUrl: string
    thumbnailUrl?: string
    isSelected: boolean
    svgData?: string
  }>
  _count: {
    variations: number
  }
  createdAt: string
}

export default function LogosPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatorMode, setGeneratorMode] = useState<'vector' | 'ai'>('vector')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    style: 'modern' as 'modern' | 'traditional' | 'playful' | 'elegant' | 'minimal' | 'bold',
    colors: [] as string[],
  })

  const { data, isLoading, refetch } = useQuery<{ logos: Logo[] }>({
    queryKey: ['logos'],
    queryFn: async () => {
      const response = await apiRequest('/api/logos')
      if (!response.ok) throw new Error('Failed to fetch logos')
      return response.json()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/logos', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          colors: data.colors.length > 0 ? data.colors : undefined,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        // Build comprehensive error message
        let errorMessage = errorData.error || 'Failed to generate logo'
        if (errorData.hint) {
          errorMessage += `\n\n${errorData.hint}`
        }
        if (errorData.details && !errorData.details.includes('Error stack')) {
          errorMessage += `\n\n${errorData.details}`
        }
        throw new Error(errorMessage)
      }
      return response.json()
    },
    onSuccess: () => {
      setShowGenerator(false)
      setError('')
      setFormData({
        businessName: '',
        industry: '',
        style: 'modern',
        colors: [],
      })
      refetch()
    },
    onError: (err: Error) => {
      const errorMessage = err.message || 'Failed to generate logo. Please try again.'
      setError(errorMessage)
      console.error('Logo generation error:', err)
    },
  })

  const logos = data?.logos || []
  const vectorLogos = logos.filter(l => l.logoType === 'VECTOR' || !l.logoType)
  const aiLogos = logos.filter(l => l.logoType === 'AI_IMAGE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logo Generator</h1>
          <p className="mt-2 text-gray-600">Create professional vector logos for your business</p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Create Logo
        </Button>
      </div>

      {showGenerator && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Logo</CardTitle>
            <CardDescription>Choose your preferred creation method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={generatorMode} onValueChange={(v) => setGeneratorMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="vector" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Vector Editor (Recommended)
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  AI Generator (Legacy)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vector">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>✨ New!</strong> Create editable vector logos with SVG export, professional typography, and instant generation.
                  </p>
                </div>
                <VectorLogoEditor
                  tenantId={tenantId}
                  businessName={formData.businessName}
                  brandColors={formData.colors}
                  onSave={(logo) => {
                    setShowGenerator(false)
                    refetch()
                  }}
                  onCancel={() => setShowGenerator(false)}
                />
              </TabsContent>

              <TabsContent value="ai">
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> AI-generated logos are PNG only and not editable. We recommend using the Vector Editor for better results.
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setError('')
                    generateMutation.mutate(formData)
                  }}
                  className="space-y-4"
                >
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md whitespace-pre-line">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        required
                        placeholder="e.g., Tech Solutions Inc"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <Input
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Technology, Retail, Healthcare"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={formData.style}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value as any })}
                        className="w-full h-10 rounded-md border border-gray-300 px-3"
                      >
                        <option value="modern">Modern</option>
                        <option value="traditional">Traditional</option>
                        <option value="playful">Playful</option>
                        <option value="elegant">Elegant</option>
                        <option value="minimal">Minimal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? 'Generating...' : 'Generate Logo'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowGenerator(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <PageLoading message="Loading logos..." fullScreen={false} />
      ) : logos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No logos created yet</p>
              <Button onClick={() => setShowGenerator(true)}>Create Your First Logo</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Logos ({logos.length})</TabsTrigger>
            <TabsTrigger value="vector">Vector ({vectorLogos.length})</TabsTrigger>
            {aiLogos.length > 0 && <TabsTrigger value="ai">AI Generated ({aiLogos.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="all">
            <LogoGrid logos={logos} />
          </TabsContent>

          <TabsContent value="vector">
            <LogoGrid logos={vectorLogos} />
          </TabsContent>

          {aiLogos.length > 0 && (
            <TabsContent value="ai">
              <LogoGrid logos={aiLogos} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}

function LogoGrid({ logos }: { logos: Logo[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {logos.map((logo) => (
        <Card key={logo.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{logo.businessName}</CardTitle>
                <CardDescription>
                  {logo.industry && `${logo.industry} • `}
                  {logo.style && `${logo.style} style`}
                </CardDescription>
              </div>
              {logo.logoType === 'VECTOR' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Vector
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {logo.status === 'GENERATING' ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Generating logo variations...</div>
              </div>
            ) : logo.variations.length > 0 ? (
              <div className="space-y-2">
                <div className="w-full h-48 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                  {logo.variations[0].svgData ? (
                    <div dangerouslySetInnerHTML={{ __html: logo.variations[0].svgData }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.variations[0].thumbnailUrl || logo.variations[0].imageUrl}
                      alt={logo.businessName}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                              <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs">Image unavailable</span>
                            </div>
                          `
                        }
                      }}
                    />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {logo._count.variations} variation{logo._count.variations !== 1 ? 's' : ''}
                </div>
                <Link href={`/dashboard/logos/${logo.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View & {logo.logoType === 'VECTOR' ? 'Edit' : 'Customize'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No variations available</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
