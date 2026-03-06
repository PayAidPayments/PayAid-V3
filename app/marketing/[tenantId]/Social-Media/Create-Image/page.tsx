'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { PLATFORM_SIZE_OPTIONS, NEGATIVE_PROMPT_PRESETS } from '@/lib/ai/image-presets'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

type PromptItem = { id: string; prompt: string; isSaved?: boolean; createdAt: string }

export default function CreateImagePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('1024x1024')
  const [provider, setProvider] = useState<string>('auto')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [editHistory, setEditHistory] = useState<Array<{ prompt: string; imageUrl: string }>>([])
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false)
  const [savedToLibrary, setSavedToLibrary] = useState(false)
  const [imageCopied, setImageCopied] = useState(false)
  // Rate limit & prompt history
  const [limits, setLimits] = useState<{ limit: number; used: number; remaining: number; resetAt: string } | null>(null)
  const [recentPrompts, setRecentPrompts] = useState<PromptItem[]>([])
  const [savedPrompts, setSavedPrompts] = useState<PromptItem[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [genHistory, setGenHistory] = useState<Array<{ id: string; prompt: string; imageUrl: string | null; cached: boolean; createdAt: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/image/limits', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setLimits(data)
      }
    } catch {
      setLimits(null)
    }
  }, [])

  const fetchPrompts = useCallback(async () => {
    setPromptsLoading(true)
    try {
      const res = await fetch('/api/ai/image/prompts', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setRecentPrompts(data.recent ?? [])
        setSavedPrompts(data.saved ?? [])
      }
    } catch {
      setRecentPrompts([])
      setSavedPrompts([])
    } finally {
      setPromptsLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/ai/image/history', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setGenHistory(data.history ?? [])
      }
    } catch {
      setGenHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLimits()
    fetchPrompts()
    fetchHistory()
  }, [fetchLimits, fetchPrompts, fetchHistory])

  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (provider === 'google-ai-studio' || provider === 'auto') {
        try {
          setIsCheckingConnection(true)
          const response = await fetch('/api/ai/integrations', {
            headers: getAuthHeaders(),
          })
          
          if (response.ok) {
            const data = await response.json()
            const isConfigured = data.configurations?.['google-ai-studio']?.configured || false
            setGoogleConnected(isConfigured)
          }
        } catch (error) {
          console.error('Failed to check Google connection:', error)
          setGoogleConnected(false)
        } finally {
          setIsCheckingConnection(false)
        }
      } else {
        setIsCheckingConnection(false)
      }
    }

    checkGoogleConnection()
  }, [provider])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const { token, isAuthenticated } = useAuthStore.getState()
    if (!token || !isAuthenticated) {
      setError('You must be logged in to generate images. Please log in and try again.')
      router.push('/login')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const response = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          style,
          size,
          provider,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.')
          useAuthStore.getState().logout()
          router.push('/login')
          return
        }
        if (response.status === 429) {
          setError(errorData.message || `Daily limit reached (${errorData.limit} images). Resets at ${errorData.resetAt ? new Date(errorData.resetAt).toLocaleString() : 'midnight UTC'}.`)
          return
        }
        if (response.status === 400 && errorData.error === 'Prompt not allowed') {
          setError(errorData.message || 'This prompt is not allowed by your organization.')
          return
        }
        
        if (errorData.needsClarification && errorData.suggestedQuestions) {
          let clarificationMessage = errorData.message || 'Please provide more details:'
          clarificationMessage += '\n\n'
          errorData.suggestedQuestions.forEach((q: string, idx: number) => {
            clarificationMessage += `${idx + 1}. ${q}\n`
          })
          if (errorData.hint) {
            clarificationMessage += `\n${errorData.hint}`
          }
          throw new Error(clarificationMessage)
        }
        
        if (errorData.error === 'Google AI Studio not connected' || errorData.error === 'Google AI Studio not configured' || errorData.message?.includes('connect your Google AI Studio') || errorData.message?.includes('API key is not configured')) {
          throw new Error('Google AI Studio is not connected. Please add your API key in Settings > AI Integrations to use this service.')
        }
        
        if (errorData.error === 'API key decryption failed' || errorData.error === 'Encryption not configured') {
          throw new Error(errorData.message || 'There was an issue with your API key. Please remove and re-add it in Settings > AI Integrations.')
        }
        
        if (errorData.error === 'Google AI Studio API error' || 
            errorData.message?.includes('Google AI Studio') || 
            errorData.message?.includes('Rate limit exceeded') ||
            errorData.message?.includes('rate limit')) {
          let errorMessage = errorData.message || errorData.error || 'Google AI Studio API error'
          
          if (errorData.hint) {
            errorMessage += '\n\n' + errorData.hint
          }
          
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += '\n\nDetails: ' + JSON.stringify(errorData.details, null, 2)
          }
          
          throw new Error(errorMessage)
        }
        
        if (errorData.error === 'Hugging Face Inference API error' || errorData.message?.includes('Hugging Face')) {
          let errorMessage = errorData.message || errorData.error || 'Hugging Face API error'
          
          if (errorData.hint) {
            errorMessage += '\n\n' + errorData.hint
          }
          
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += '\n\nDetails: ' + JSON.stringify(errorData.details, null, 2)
          }
          
          throw new Error(errorMessage)
        }
        
        if (errorData.error === 'Image generation service not configured') {
          let errorMessage = errorData.message || errorData.error
          
          if (errorData.setupInstructions) {
            errorMessage += '\n\nPlease configure Google AI Studio in Settings > AI Integrations to generate images.'
          }
          
          throw new Error(errorMessage)
        }
        
        const fullErrorMessage = errorData.message || errorData.error || 'Failed to generate image'
        const errorHint = errorData.hint ? '\n\n' + errorData.hint : ''
        throw new Error(fullErrorMessage + errorHint)
      }

      const data = await response.json()
      
      if (data.imageUrl || data.url) {
        setGeneratedImage(data.imageUrl || data.url)
        fetchLimits()
        fetchPrompts()
        fetchHistory()
      } else {
        throw new Error('No image URL in response. The API may have returned an unexpected format.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image'
      console.error('Image generation error:', err)
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = `ai-generated-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleEditImage = async () => {
    if (!generatedImage || !editPrompt.trim()) return

    setIsEditingImage(true)
    setError(null)

    try {
      const { token } = useAuthStore.getState()
      if (!token) {
        setError('You must be logged in to edit images.')
        return
      }

      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        try {
          const editResponse = await fetch('/api/ai/nanobanana/edit-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageBase64: base64,
              imageMimeType: 'image/png',
              editPrompt: editPrompt.trim(),
            }),
          })

          if (!editResponse.ok) {
            const errorData = await editResponse.json()
            throw new Error(errorData.error || errorData.message || 'Failed to edit image')
          }

          const editData = await editResponse.json()
          
          setEditHistory(prev => [...prev, { prompt: editPrompt, imageUrl: generatedImage }])
          setGeneratedImage(editData.imageUrl || editData.image_url)
          setEditPrompt('')
          setIsEditing(false)
        } catch (editError) {
          const errorMessage = editError instanceof Error ? editError.message : 'Failed to edit image'
          setError(errorMessage)
        } finally {
          setIsEditingImage(false)
        }
      }
      
      reader.onerror = () => {
        setError('Failed to read image for editing')
        setIsEditingImage(false)
      }
      
      reader.readAsDataURL(blob)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit image'
      setError(errorMessage)
      setIsEditingImage(false)
    }
  }

  const handleSaveToLibrary = async () => {
    if (!generatedImage) return

    setIsSavingToLibrary(true)
    setError(null)

    try {
      const { token } = useAuthStore.getState()
      if (!token) {
        setError('You must be logged in to save images.')
        return
      }

      const img = new Image()
      img.src = generatedImage
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const response = await fetch(generatedImage)
      const blob = await response.blob()
      
      const fileName = prompt.trim().substring(0, 50).replace(/[^a-z0-9]/gi, '_') || 'ai-generated-image'
      
      const saveResponse = await fetch('/api/media-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: `${fileName}.png`,
          fileUrl: generatedImage,
          fileSize: blob.size,
          mimeType: 'image/png',
          width: img.width,
          height: img.height,
          title: prompt.trim().substring(0, 100) || 'AI Generated Image',
          description: `Generated with style: ${style}, size: ${size}`,
          tags: [style, 'ai-generated'],
          category: 'social-media',
          source: 'ai-generated',
          originalPrompt: prompt,
          editHistory: editHistory.length > 0 ? editHistory.map(e => ({ prompt: e.prompt })) : undefined,
        }),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(errorData.error || errorData.message || 'Failed to save to media library')
      }

      setSavedToLibrary(true)
      setTimeout(() => setSavedToLibrary(false), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to media library'
      setError(errorMessage)
    } finally {
      setIsSavingToLibrary(false)
    }
  }

  const handleCopyImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 2000)
      } else {
        await navigator.clipboard.writeText(generatedImage)
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy image:', err)
      try {
        await navigator.clipboard.writeText(generatedImage)
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr)
        alert('Failed to copy image. Please try downloading it instead.')
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Image Studio</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create custom images for your social media posts using AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limits != null && (
            <span className="text-sm text-gray-600 dark:text-gray-400" title={`Resets ${new Date(limits.resetAt).toLocaleString()}`}>
              {limits.remaining} / {limits.limit} images today
            </span>
          )}
          <Link href={`/marketing/${tenantId}/Social-Media`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Social Media</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Image Generation</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Describe the image you want to create. Be specific for best results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Description *
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A modern business professional working on a laptop in a bright office, professional photography style"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tip: Include style, subject, colors, and mood for better results
                </p>
              </div>

              <div>
                <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avoid (optional)
                </label>
                <select
                  id="negativePrompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  {NEGATIVE_PROMPT_PRESETS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="self-hosted">PayAid Image Generator (self-hosted)</option>
                  <option value="google-ai-studio">Google AI Studio</option>
                  <option value="huggingface">Hugging Face (cloud)</option>
                </select>
                <p className="mt-1 text-xs">
                  {provider === 'auto' && <span className="text-gray-500 dark:text-gray-400">Uses your self-hosted generator first if configured, then Google or Hugging Face</span>}
                  {provider === 'google-ai-studio' && (
                    <>
                      {isCheckingConnection ? (
                        <span className="text-gray-500 dark:text-gray-400">Checking API key status...</span>
                      ) : googleConnected ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">✅ Google AI Studio (Configured) - Ready to generate images</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Google AI Studio (Not Configured) - Add your key in Settings &gt; AI Integrations</span>
                      )}
                    </>
                  )}
                  {provider === 'self-hosted' && <span className="text-gray-500 dark:text-gray-400">Your own image worker (no API key, no quota). Set IMAGE_WORKER_URL on the server.</span>}
                  {provider === 'huggingface' && <span className="text-gray-500 dark:text-gray-400">Hugging Face cloud API (platform key)</span>}
                </p>
                {provider === 'google-ai-studio' && !isCheckingConnection && !googleConnected && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                      ⚠️ Google AI Studio API key is not configured
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      Each tenant must use their own API key. Get your free key from Google AI Studio and add it below.
                    </p>
                    <Link href={`/settings/ai`}>
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Add API Key in Settings
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style
                  </label>
                  <select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="realistic">Realistic</option>
                    <option value="artistic">Artistic</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="vintage">Vintage</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size / Platform
                  </label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    {PLATFORM_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                  <div className="font-semibold mb-2">
                    {(error.includes('Google AI Studio') || 
                      error.includes('Rate limit exceeded') || 
                      error.includes('rate limit') ||
                      (error.includes('Too many requests') && error.includes('Google')))
                      ? '⚠️ Google AI Studio API Error'
                      : (error.includes('Hugging Face') && !error.includes('fallback to Hugging Face'))
                      ? '⚠️ PayAid AI Image Generation Error'
                      : '⚠️ Setup Required'}
                  </div>
                  <div className="whitespace-pre-line text-xs font-mono bg-red-100 dark:bg-red-800 p-2 rounded mb-2 max-h-40 overflow-y-auto">
                    {error}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mb-3">
                    💡 <strong>Check your server terminal logs</strong> for detailed error information from {
                      (error.includes('Google AI Studio') || error.includes('Rate limit exceeded') || error.includes('rate limit'))
                        ? 'Google AI Studio API'
                        : error.includes('Hugging Face')
                        ? 'PayAid AI Image Generation'
                        : 'the API'
                    }.
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700 flex gap-2 flex-wrap">
                    {(error.includes('Google AI Studio') || error.includes('connect your Google')) && (
                      <Link href={`/settings/ai`}>
                        <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                          Connect Google AI Studio
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                    Generating...
                  </>
                ) : (
                  'Generate Image'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Image */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Generated Image</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Your AI-generated image will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Generating your image...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take 10-30 seconds</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden relative group">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={handleCopyImage}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md"
                      title={imageCopied ? "Image copied!" : "Copy image"}
                    >
                      {imageCopied ? (
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">✨ AI-Enhanced Prompt</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Your prompt was automatically enhanced by AI to generate better results.
                  </div>
                </div>
                
                {/* Image Editing Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit Image</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(!isEditing)
                        if (!isEditing) {
                          setEditPrompt('')
                        }
                      }}
                      className="dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {isEditing ? 'Cancel' : '✏️ Edit with AI'}
                    </Button>
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-3 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div>
                        <label htmlFor="editPrompt" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          What would you like to change?
                        </label>
                        <textarea
                          id="editPrompt"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="e.g., Change the background to a beach, add more vibrant colors, make it more professional"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px]"
                          disabled={isEditingImage}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Describe the changes you want. Only those changes will be made, the rest of the image stays the same.
                        </p>
                      </div>
                      <Button
                        onClick={handleEditImage}
                        disabled={!editPrompt.trim() || isEditingImage}
                        className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                        size="sm"
                      >
                        {isEditingImage ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                            Editing...
                          </>
                        ) : (
                          'Apply Changes'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleDownload} className="flex-1 min-w-[120px] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                    Download
                  </Button>
                  <Link href={generatedImage ? `/marketing/${tenantId}/Social-Media/Create-Post?imageUrl=${encodeURIComponent(generatedImage)}` : '#'} className="flex-1 min-w-[120px]">
                    <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" disabled={!generatedImage}>
                      Use in post
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSaveToLibrary}
                    variant="outline"
                    className="flex-1 min-w-[120px] dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    disabled={isSavingToLibrary || savedToLibrary}
                  >
                    {isSavingToLibrary ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400 mr-2 inline-block"></span>
                        Saving...
                      </>
                    ) : savedToLibrary ? (
                      '✓ Saved to Library'
                    ) : (
                      'Save to Library'
                    )}
                  </Button>
                  <Button
                    onClick={handleCopyImage}
                    variant="outline"
                    className="flex-1 min-w-[100px] dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {imageCopied ? '✓ Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedImage(null)
                      setPrompt('')
                      setIsEditing(false)
                      setEditPrompt('')
                      setEditHistory([])
                      setSavedToLibrary(false)
                    }}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🎨</div>
                  <p>No image generated yet</p>
                  <p className="text-sm mt-1">Fill in the form and click &quot;Generate Image&quot;</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent & saved prompts */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Recent &amp; saved prompts</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Click a prompt to use it. Saved prompts are pinned for quick access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promptsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Recent</h3>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {recentPrompts.length === 0 ? (
                    <li className="text-xs text-gray-500 dark:text-gray-400">No recent prompts yet</li>
                  ) : (
                    recentPrompts.slice(0, 10).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setPrompt(item.prompt)}
                          className="text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 w-full truncate"
                          title={item.prompt}
                        >
                          {item.prompt.length > 50 ? item.prompt.slice(0, 50) + '…' : item.prompt}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Saved</h3>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {savedPrompts.length === 0 ? (
                    <li className="text-xs text-gray-500 dark:text-gray-400">No saved prompts</li>
                  ) : (
                    savedPrompts.slice(0, 10).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setPrompt(item.prompt)}
                          className="text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 w-full truncate"
                          title={item.prompt}
                        >
                          {item.prompt.length > 50 ? item.prompt.slice(0, 50) + '…' : item.prompt}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation history (last 20) */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Generation history</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Last 20 image generations for your account. Click a prompt to reuse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : genHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No generations yet. Create your first image above.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {genHistory.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                  {item.imageUrl && (
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-gray-200 dark:bg-gray-600"
                    >
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrompt(item.prompt)}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 truncate"
                    title={item.prompt}
                  >
                    {item.prompt.length > 40 ? item.prompt.slice(0, 40) + '…' : item.prompt}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✅ <strong>Be specific:</strong> Include details about colors, style, mood, and composition</li>
            <li>✅ <strong>Mention the subject:</strong> Clearly describe what you want in the image</li>
            <li>✅ <strong>Specify style:</strong> Use terms like &quot;photorealistic&quot;, &quot;illustration&quot;, &quot;minimalist&quot;</li>
            <li>✅ <strong>Include context:</strong> Mention background, setting, or environment</li>
            <li>✅ <strong>Use examples:</strong> Reference styles like &quot;in the style of [artist/photographer]&quot;</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
