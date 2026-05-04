'use client'

import { useEffect, useState } from 'react'
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
import type { LogoConfig } from '@/lib/logo/vector-engine'
import { Sparkles, Wand2 } from 'lucide-react'

interface Logo {
  id: string
  businessName: string
  industry?: string
  style?: string
  colors?: string[]
  status: string
  logoType?: 'VECTOR' | 'AI_IMAGE'
  variations: Array<{
    id: string
    imageUrl: string
    thumbnailUrl?: string
    isSelected: boolean
    svgData?: string
    layoutConfig?: Partial<LogoConfig> | null
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
  const [generatorMode, setGeneratorMode] = useState<'vector' | 'ai'>('ai')
  const [editingVectorLogo, setEditingVectorLogo] = useState<Logo | null>(null)
  const [error, setError] = useState('')
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
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

  const deleteMutation = useMutation({
    mutationFn: async (logoId: string) => {
      const response = await apiRequest(`/api/logos/${logoId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to delete logo')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setSnackbarMessage('Logo deleted successfully')
    },
  })

  useEffect(() => {
    if (!snackbarMessage) return
    const timer = setTimeout(() => setSnackbarMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [snackbarMessage])

  const logos = data?.logos || []
  const vectorLogos = logos.filter(l => l.logoType === 'VECTOR' || !l.logoType)
  const aiLogos = logos.filter(l => l.logoType === 'AI_IMAGE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logo Generator</h1>
          <p className="mt-2 text-gray-600">
            Start with <strong>AI concepts</strong> for varied marks, or use the <strong>vector editor</strong> for a
            typography + simple-shape lockup you can export as SVG.
          </p>
        </div>
        {!showGenerator && (
          <Button onClick={() => setShowGenerator(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Create Logo
          </Button>
        )}
      </div>

      {showGenerator && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Logo</CardTitle>
            <CardDescription>Choose your preferred creation method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={generatorMode} onValueChange={(v) => setGeneratorMode(v as 'vector' | 'ai')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  AI concepts
                </TabsTrigger>
                <TabsTrigger value="vector" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Vector mark
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-900">
                    Generates <strong>five PNG concepts</strong> via your workspace image model. Best when you want a
                    richer mark than typography + basic shapes. Requires a configured image provider (see env / AI
                    Studio settings).
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

              <TabsContent value="vector">
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-950">
                    Builds an <strong>SVG from fonts + a small set of geometric icons</strong> (circle monogram, shield,
                    etc.). It will not look like a full illustration—use <strong>AI concepts</strong> for that, then
                    trace or refine elsewhere if you need vectors.
                  </p>
                </div>
                <VectorLogoEditor
                  key={`vector-editor-${editingVectorLogo?.id || 'new'}`}
                  tenantId={tenantId}
                  businessName={editingVectorLogo?.businessName || formData.businessName}
                  brandColors={editingVectorLogo?.colors || formData.colors}
                  initialConfig={editingVectorLogo?.variations[0]?.layoutConfig || undefined}
                  initialIndustry={editingVectorLogo?.industry || ''}
                  initialKeywords={editingVectorLogo?.style ? editingVectorLogo.style.split(',').map((s) => s.trim()).filter(Boolean) : []}
                  onSave={(logo) => {
                    setShowGenerator(false)
                    setEditingVectorLogo(null)
                    refetch()
                  }}
                  onCancel={() => {
                    setShowGenerator(false)
                    setEditingVectorLogo(null)
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!showGenerator && (isLoading ? (
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
            <LogoGrid
              logos={logos}
              tenantId={tenantId}
              onDelete={(logo) => {
                const ok = window.confirm(`Delete logo "${logo.businessName}"? This cannot be undone.`)
                if (!ok) return
                setError('')
                deleteMutation.mutate(logo.id, {
                  onError: (err: Error) => {
                    setError(err.message || 'Failed to delete logo')
                  },
                })
              }}
              onEditVector={(logo) => {
                setEditingVectorLogo(logo)
                setGeneratorMode('vector')
                setShowGenerator(true)
              }}
            />
          </TabsContent>

          <TabsContent value="vector">
            <LogoGrid
              logos={vectorLogos}
              tenantId={tenantId}
              onDelete={(logo) => {
                const ok = window.confirm(`Delete logo "${logo.businessName}"? This cannot be undone.`)
                if (!ok) return
                setError('')
                deleteMutation.mutate(logo.id, {
                  onError: (err: Error) => {
                    setError(err.message || 'Failed to delete logo')
                  },
                })
              }}
              onEditVector={(logo) => {
                setEditingVectorLogo(logo)
                setGeneratorMode('vector')
                setShowGenerator(true)
              }}
            />
          </TabsContent>

          {aiLogos.length > 0 && (
            <TabsContent value="ai">
              <LogoGrid
                logos={aiLogos}
                tenantId={tenantId}
                onDelete={(logo) => {
                  const ok = window.confirm(`Delete logo "${logo.businessName}"? This cannot be undone.`)
                  if (!ok) return
                  setError('')
                  deleteMutation.mutate(logo.id, {
                    onError: (err: Error) => {
                      setError(err.message || 'Failed to delete logo')
                    },
                  })
                }}
                onEditVector={() => {}}
              />
            </TabsContent>
          )}
        </Tabs>
      ))}
      {snackbarMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {snackbarMessage}
        </div>
      ) : null}
    </div>
  )
}

function LogoGrid({
  logos,
  tenantId,
  onDelete,
  onEditVector,
}: {
  logos: Logo[]
  tenantId: string
  onDelete: (logo: Logo) => void
  onEditVector: (logo: Logo) => void
}) {
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
                {logo.logoType === 'VECTOR' && (
                  <div className="text-xs text-slate-600 rounded bg-slate-100 px-2 py-1">
                    Lockup: {getLockupLabel(logo.variations[0]?.layoutConfig)}
                  </div>
                )}
                {logo.logoType === 'VECTOR' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditVector(logo)}>
                      Edit
                    </Button>
                    <Link href={`/ai-studio/${tenantId}/Logos/${logo.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Detail
                      </Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(logo)}>
                      Delete
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/dashboard/logos/${logo.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View & Customize
                      </Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(logo)}>
                      Delete
                    </Button>
                  </div>
                )}
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

function getLockupLabel(layoutConfig?: Partial<LogoConfig> | null): string {
  const lockup = layoutConfig?.layout?.lockupType || 'combination-horizontal'
  if (lockup === 'stacked') return 'Stacked'
  if (lockup === 'wordmark') return 'Wordmark'
  if (lockup === 'emblem') return 'Emblem'
  return 'Horizontal'
}
