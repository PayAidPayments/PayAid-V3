'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, Code2, Eye, Save, Download, ArrowLeft, Lightbulb, LayoutGrid, Search, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { EnhancedComponentPreview } from '@/components/website-builder/EnhancedComponentPreview'
import { ModuleGate } from '@/components/modules/ModuleGate'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

interface GeneratedComponent {
  code: string
  componentName: string
  description: string
  type: 'component' | 'page' | 'layout'
}

interface GenerationResponse {
  success: boolean
  components: GeneratedComponent[]
  provider: 'groq' | 'ollama' | 'huggingface' | 'none'
  error?: string
}

interface ComponentTemplate {
  id: string
  name: string
  description: string
  category: string
  code: string
  tags: string[]
}

function WebsiteBuilderPageContent() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { tenant } = useAuthStore()
  
  // Extract tenant ID from pathname (e.g., /dashboard/[tenantId]/websites/[id]/builder)
  // or get from auth store
  const pathParts = pathname.split('/').filter(Boolean)
  const tenantIdFromPath = pathParts.length > 1 && pathParts[0] === 'dashboard' && pathParts[1].length > 15 
    ? pathParts[1] 
    : null
  const tenantId = tenantIdFromPath || tenant?.id
  const websiteId = params.id as string

  // Helper to create tenant-aware URLs
  const getUrl = (path: string) => {
    if (tenantId) {
      const cleanPath = path.replace(/^\/dashboard\/?/, '')
      return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
    }
    return path
  }

  // Get questionnaire data from URL params
  const urlType = searchParams.get('type')
  const urlIndustry = searchParams.get('industry')
  const urlStyle = searchParams.get('style')
  const urlPurpose = searchParams.get('purpose')

  const [prompt, setPrompt] = useState(urlPurpose || '')
  const [style, setStyle] = useState<'modern' | 'classic' | 'minimal' | 'bold' | 'elegant'>(
    (urlStyle as any) || 'modern'
  )
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResponse | null>(null)
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string>('')
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [variations, setVariations] = useState<any[]>([])
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false)
  const [showABTest, setShowABTest] = useState(false)
  const [abTestResult, setAbTestResult] = useState<any>(null)
  const [isGeneratingABTest, setIsGeneratingABTest] = useState(false)

  // Available component types
  const componentTypes = [
    { id: 'hero', label: 'Hero Section', description: 'Main banner with headline and CTA' },
    { id: 'features', label: 'Features Grid', description: 'Showcase key features' },
    { id: 'pricing', label: 'Pricing Cards', description: 'Display pricing plans' },
    { id: 'testimonials', label: 'Testimonials', description: 'Customer reviews' },
    { id: 'about', label: 'About Section', description: 'Company information' },
    { id: 'contact', label: 'Contact Form', description: 'Contact form section' },
    { id: 'footer', label: 'Footer', description: 'Site footer with links' },
  ]

  // Fetch website info
  const { data: website } = useQuery({
    queryKey: ['website', websiteId],
    queryFn: async () => {
      const response = await fetch(`/api/websites/${websiteId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch website')
      return response.json()
    },
  })

  // Pre-fill form based on questionnaire data
  useEffect(() => {
    if (urlPurpose) {
      setPrompt(urlPurpose)
    }
    if (urlStyle) {
      setStyle(urlStyle as any)
    }
    if (urlType) {
      // Auto-select relevant components based on website type
      const componentMap: Record<string, string[]> = {
        business: ['hero', 'features', 'contact', 'footer'],
        ecommerce: ['hero', 'features', 'footer'],
        portfolio: ['hero', 'about', 'footer'],
        blog: ['hero', 'footer'],
        landing: ['hero', 'features', 'pricing', 'testimonials', 'contact'],
      }
      const suggestedComponents = componentMap[urlType] || []
      if (suggestedComponents.length > 0) {
        setSelectedComponents(suggestedComponents)
      }
    }
  }, [urlPurpose, urlStyle, urlType])

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['templates', templateSearch, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (templateSearch) params.set('search', templateSearch)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      const response = await fetch(`/api/websites/templates?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    },
    enabled: showTemplates,
  })

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    )
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for your website')
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/websites/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          components: selectedComponents,
          framework: 'nextjs',
        }),
      })

      const data: GenerationResponse = await response.json()
      setGenerationResult(data)

      if (data.success && data.components.length > 0) {
        setSelectedComponentIndex(0) // Select first component
      } else {
        alert(data.error || 'Failed to generate components. Please try again.')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred while generating components. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseTemplate = (template: ComponentTemplate) => {
    const component: GeneratedComponent = {
      code: template.code,
      componentName: template.name.replace(/\s+/g, ''),
      description: template.description,
      type: 'component',
    }
    setGenerationResult({
      success: true,
      components: [component],
      provider: 'template',
    })
    setSelectedComponentIndex(0)
    setShowTemplates(false)
  }

  const handleGetSuggestions = async () => {
    if (!selectedComponent) return

    setIsLoadingSuggestions(true)
    setSuggestions('')

    try {
      const response = await fetch('/api/websites/generate/suggestions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: selectedComponent.code,
          componentName: selectedComponent.componentName,
          prompt: prompt,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
      } else {
        alert(data.error || 'Failed to get suggestions')
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      alert('An error occurred while getting suggestions')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const saveComponentMutation = useMutation({
    mutationFn: async ({ pageId, component }: { pageId: string; component: GeneratedComponent }) => {
      const response = await fetch(`/api/websites/${websiteId}/pages/${pageId}/save-component`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          componentName: component.componentName,
          code: component.code,
          description: component.description,
          type: component.type,
          sectionType: selectedComponents[0] || 'component',
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save component')
      }
      return response.json()
    },
    onSuccess: () => {
      setSaveDialogOpen(false)
      alert('Component saved successfully!')
    },
  })

  const handleSaveComponent = async (component: GeneratedComponent) => {
    if (!website?.pages || website.pages.length === 0) {
      alert('Please create a page first before saving components')
      return
    }
    setSaveDialogOpen(true)
  }

  const handleConfirmSave = () => {
    if (!selectedComponent || !selectedPageId) {
      alert('Please select a page')
      return
    }
    saveComponentMutation.mutate({ pageId: selectedPageId, component: selectedComponent })
  }

  const handleGenerateVariations = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description first')
      return
    }

    setIsGeneratingVariations(true)
    setVariations([])

    try {
      const response = await fetch('/api/websites/generate/variations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          components: selectedComponents,
          count: 3,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setVariations(data.variations)
        setShowVariations(true)
      } else {
        alert(data.error || 'Failed to generate variations')
      }
    } catch (error) {
      console.error('Variations error:', error)
      alert('An error occurred while generating variations')
    } finally {
      setIsGeneratingVariations(false)
    }
  }

  const handleGenerateABTest = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description first')
      return
    }

    setIsGeneratingABTest(true)
    setAbTestResult(null)

    try {
      const response = await fetch('/api/websites/generate/ab-test', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          componentType: selectedComponents[0] || 'hero',
          testHypothesis: 'Optimize for conversion',
        }),
      })

      const data = await response.json()
      if (data.success) {
        setAbTestResult(data)
        setShowABTest(true)
      } else {
        alert(data.error || 'Failed to generate A/B test')
      }
    } catch (error) {
      console.error('A/B test error:', error)
      alert('An error occurred while generating A/B test')
    } finally {
      setIsGeneratingABTest(false)
    }
  }

  const handleExportCode = (component: GeneratedComponent) => {
    const blob = new Blob([component.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${component.componentName}.tsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedComponent = selectedComponentIndex !== null && generationResult?.components
    ? generationResult.components[selectedComponentIndex]
    : null

  const templates = templatesData?.templates || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={getUrl(`/dashboard/websites/${websiteId}`)}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Website
              </Button>
            </Link>
            <Dialog open={showComponentLibrary} onOpenChange={setShowComponentLibrary}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Code2 className="h-4 w-4 mr-2" />
                  Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Component Library</DialogTitle>
                  <DialogDescription>
                    Browse components saved from your websites
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {libraryData?.components && libraryData.components.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {libraryData.components.map((comp: any) => (
                        <Card key={comp.id} className="cursor-pointer hover:border-primary" onClick={() => {
                          const component: GeneratedComponent = {
                            code: comp.code,
                            componentName: comp.name,
                            description: comp.description,
                            type: comp.type,
                          }
                          setGenerationResult({
                            success: true,
                            components: [component],
                            provider: 'library',
                          })
                          setSelectedComponentIndex(0)
                          setShowComponentLibrary(false)
                        }}>
                          <CardHeader>
                            <CardTitle className="text-lg">{comp.name}</CardTitle>
                            <CardDescription>{comp.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground">
                              From: {comp.websiteName} - {comp.pageTitle}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No components in library yet. Save components to build your library.</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Component Templates</DialogTitle>
                  <DialogDescription>
                    Choose from pre-built component templates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="hero">Hero</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="testimonials">Testimonials</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template: ComponentTemplate) => (
                      <Card key={template.id} className="cursor-pointer hover:border-primary" onClick={() => handleUseTemplate(template)}>
                        <CardHeader>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <h1 className="text-3xl font-bold">AI Website Builder</h1>
          <p className="text-muted-foreground mt-1">
            {website?.name ? `Building: ${website.name}` : 'Generate React components with AI'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Prompt Input */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Components
              </CardTitle>
              <CardDescription>
                Describe your website and let AI create React components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Describe Your Website</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Create a modern landing page for a SaaS product with hero section, features grid, and pricing cards"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Components to Include (Optional)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {componentTypes.map((type) => (
                    <div key={type.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedComponents.includes(type.id)}
                        onCheckedChange={() => handleComponentToggle(type.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={type.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {type.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Components
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleGenerateVariations}
                    disabled={isGeneratingVariations || !prompt.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingVariations ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Variations
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateABTest}
                    disabled={isGeneratingABTest || !prompt.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingABTest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        A/B Test
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {generationResult && (
                <div className="mt-4 p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">
                    Generated using: {generationResult.provider.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {generationResult.components.length} component(s) created
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Component List */}
          {generationResult?.success && generationResult.components.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Components</CardTitle>
                <CardDescription>
                  Select a component to view and edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generationResult.components.map((component, index) => (
                    <Button
                      key={index}
                      variant={selectedComponentIndex === index ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedComponentIndex(index)}
                    >
                      <Code2 className="h-4 w-4 mr-2" />
                      {component.componentName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Preview & Code */}
        <div className="lg:col-span-2 space-y-4">
          {selectedComponent ? (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code2 className="h-4 w-4 mr-2" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="suggestions">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggestions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedComponent.componentName}</CardTitle>
                        <CardDescription>{selectedComponent.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveComponent(selectedComponent)}
                          disabled={saveComponentMutation.isPending}
                        >
                          {saveComponentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCode(selectedComponent)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <EnhancedComponentPreview
                      code={selectedComponent.code}
                      componentName={selectedComponent.componentName}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Component Code</CardTitle>
                        <CardDescription>
                          {selectedComponent.componentName}.tsx
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedComponent.code)
                            alert('Code copied to clipboard!')
                          }}
                        >
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCode(selectedComponent)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <pre className="p-4 bg-[#1e1e1e] text-[#d4d4d4] text-sm overflow-auto max-h-[600px]">
                        <code>{selectedComponent.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>AI Suggestions</CardTitle>
                        <CardDescription>
                          Get AI-powered suggestions to improve your component
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGetSuggestions}
                        disabled={isLoadingSuggestions}
                      >
                        {isLoadingSuggestions ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Get Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestions ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                          {suggestions}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click "Get Suggestions" to receive AI-powered improvements for your component</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Component Selected</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Enter a description above and click "Generate Components" to create
                  React components with AI. Then select a component from the list to view
                  its code and preview.
                </p>
              </CardContent>
            </Card>
          )}

          {generationResult && !generationResult.success && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Generation Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {generationResult.error || 'Failed to generate components. Please try again.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Provider used: {generationResult.provider}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Component to Page</DialogTitle>
            <DialogDescription>
              Select a page to save this component to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Page</Label>
              <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {website?.pages?.map((page: any) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title} ({page.path})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} disabled={!selectedPageId || saveComponentMutation.isPending}>
                {saveComponentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Component
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variations Dialog */}
      <Dialog open={showVariations} onOpenChange={setShowVariations}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Component Variations</DialogTitle>
            <DialogDescription>
              Choose from {variations.length} generated variations
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variations.map((variation: any, index: number) => (
              <Card key={index} className="cursor-pointer hover:border-primary" onClick={() => {
                if (variation.components && variation.components.length > 0) {
                  setGenerationResult({
                    success: true,
                    components: variation.components,
                    provider: variation.provider,
                  })
                  setSelectedComponentIndex(0)
                  setShowVariations(false)
                }
              }}>
                <CardHeader>
                  <CardTitle>Variation {variation.variation}</CardTitle>
                  <CardDescription>Style: {variation.style}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {variation.components?.length || 0} component(s) • {variation.provider}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* A/B Test Dialog */}
      <Dialog open={showABTest} onOpenChange={setShowABTest}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>A/B Test Variants</DialogTitle>
            <DialogDescription>
              Compare two variants for testing
            </DialogDescription>
          </DialogHeader>
          {abTestResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Variant A (Control)</CardTitle>
                    <CardDescription>Original version</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {abTestResult.variantA ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setGenerationResult({
                            success: true,
                            components: [abTestResult.variantA],
                            provider: 'ab-test',
                          })
                          setSelectedComponentIndex(0)
                          setShowABTest(false)
                        }}
                      >
                        Use Variant A
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Failed to generate</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Variant B (Test)</CardTitle>
                    <CardDescription>{abTestResult.testHypothesis}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {abTestResult.variantB ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setGenerationResult({
                            success: true,
                            components: [abTestResult.variantB],
                            provider: 'ab-test',
                          })
                          setSelectedComponentIndex(0)
                          setShowABTest(false)
                        }}
                      >
                        Use Variant B
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Failed to generate</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Testing Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {abTestResult.suggestions?.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm">{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function WebsiteBuilderPage() {
  return (
    <ModuleGate module="ai-studio">
      <WebsiteBuilderPageContent />
    </ModuleGate>
  )
}
