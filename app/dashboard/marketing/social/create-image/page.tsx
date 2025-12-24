'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function CreateImagePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('1024x1024')
  const [provider, setProvider] = useState<string>('auto') // 'auto', 'google-ai-studio', 'self-hosted' (free options only)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)

  // Check Google AI Studio API key configuration status
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
            // Check if API key is configured (not OAuth integration)
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

    // Check authentication before making request
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
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          size,
          provider, // Include the selected provider
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle unauthorized errors
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.')
          // Clear auth state and redirect to login
          useAuthStore.getState().logout()
          router.push('/login')
          return
        }
        
        // Handle clarifying questions for vague prompts
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
        
        // Handle Google AI Studio not connected error
        if (errorData.error === 'Google AI Studio not connected' || errorData.error === 'Google AI Studio not configured' || errorData.message?.includes('connect your Google AI Studio') || errorData.message?.includes('API key is not configured')) {
          throw new Error('Google AI Studio is not connected. Please add your API key in Settings > AI Integrations to use this service.')
        }
        
        // Handle API key decryption errors
        if (errorData.error === 'API key decryption failed' || errorData.error === 'Encryption not configured') {
          throw new Error(errorData.message || 'There was an issue with your API key. Please remove and re-add it in Settings > AI Integrations.')
        }
        
        // Handle Google AI Studio specific errors FIRST (before Hugging Face check)
        // Check for Google AI Studio errors first to avoid false positives
        if (errorData.error === 'Google AI Studio API error' || 
            errorData.message?.includes('Google AI Studio') || 
            errorData.message?.includes('Rate limit exceeded') ||
            errorData.message?.includes('rate limit')) {
          let errorMessage = errorData.message || errorData.error || 'Google AI Studio API error'
          
          // Include hint if available
          if (errorData.hint) {
            errorMessage += '\n\n' + errorData.hint
          }
          
          // Include details in dev mode
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += '\n\nDetails: ' + JSON.stringify(errorData.details, null, 2)
          }
          
          throw new Error(errorMessage)
        }
        
        // Handle Hugging Face specific errors
        if (errorData.error === 'Hugging Face Inference API error' || errorData.message?.includes('Hugging Face')) {
          let errorMessage = errorData.message || errorData.error || 'Hugging Face API error'
          
          // Include hint if available
          if (errorData.hint) {
            errorMessage += '\n\n' + errorData.hint
          }
          
          // Include details in dev mode
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += '\n\nDetails: ' + JSON.stringify(errorData.details, null, 2)
          }
          
          throw new Error(errorMessage)
        }
        
        // If it's a configuration error, show helpful setup instructions
        if (errorData.error === 'Image generation service not configured' || errorData.error === 'Self-hosted AI service unavailable') {
          let errorMessage = errorData.message || errorData.error
          
          // Show self-hosted setup if gateway is configured
          if (errorData.hint && errorData.hint.includes('docker-compose')) {
            errorMessage += '\n\n' + errorData.hint
            errorMessage += '\n\nCheck service logs: docker logs payaid-text-to-image'
          } else if (errorData.setupInstructions) {
            // Show external API setup instructions
            const setupInfo = errorData.setupInstructions
            errorMessage += '\n\n'
            
            if (setupInfo?.selfHosted) {
              errorMessage += 'Self-Hosted Setup (Free):\n'
              errorMessage += setupInfo.selfHosted.steps.join('\n') + '\n\n'
            }
            
            errorMessage += 'Or connect Google AI Studio in Settings > AI Integrations (Free).'
          }
          
          throw new Error(errorMessage)
        }
        
        // Generic error - show full message
        const fullErrorMessage = errorData.message || errorData.error || 'Failed to generate image'
        const errorHint = errorData.hint ? '\n\n' + errorData.hint : ''
        throw new Error(fullErrorMessage + errorHint)
      }

      const data = await response.json()
      
      if (data.imageUrl || data.url) {
        setGeneratedImage(data.imageUrl || data.url)
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

  const [imageCopied, setImageCopied] = useState(false)

  const handleCopyImage = async () => {
    if (!generatedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      
      // Copy image to clipboard using Clipboard API
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 2000)
      } else {
        // Fallback: copy image URL as text
        await navigator.clipboard.writeText(generatedImage)
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy image:', err)
      // Fallback: copy image URL as text
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Image Generation</h1>
          <p className="mt-2 text-gray-600">
            Create custom images for your social media posts using AI
          </p>
        </div>
        <Link href="/dashboard/marketing/social">
          <Button variant="outline">Back to Social Media</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Image Generation</CardTitle>
            <CardDescription>
              Describe the image you want to create. Be specific for best results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Image Description *
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A modern business professional working on a laptop in a bright office, professional photography style"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tip: Include style, subject, colors, and mood for better results
                </p>
              </div>

              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="google-ai-studio">Google AI Studio (Free)</option>
                  <option value="huggingface">Hugging Face (Free - Cloud)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {provider === 'auto' && 'Will try Google AI Studio first, then Hugging Face (cloud-based)'}
                  {provider === 'google-ai-studio' && (
                    <>
                      {isCheckingConnection ? (
                        'Checking API key status...'
                      ) : googleConnected ? (
                        '✅ API key configured - Ready to generate images'
                      ) : (
                        '⚠️ API key not configured - Add your key in Settings > AI Integrations'
                      )}
                    </>
                  )}
                  {provider === 'huggingface' && 'Uses Hugging Face Inference API (cloud-based, free tier available)'}
                </p>
                {provider === 'google-ai-studio' && !isCheckingConnection && !googleConnected && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 mb-2">
                      ⚠️ Google AI Studio API key is not configured
                    </p>
                    <p className="text-xs text-yellow-700 mb-3">
                      Each tenant must use their own API key. Get your free key from Google AI Studio and add it below.
                    </p>
                    <Link href="/dashboard/settings/ai">
                      <Button variant="outline" size="sm" className="w-full">
                        Add API Key in Settings
                      </Button>
                    </Link>
                  </div>
                )}
                {provider === 'self-hosted' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Self-Hosted Setup:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>Set USE_AI_GATEWAY=true in .env</li>
                      <li>Start services: docker-compose -f docker-compose.ai-services.yml up -d</li>
                      <li>Wait for models to download (30-60 min first time)</li>
                      <li>Check status: docker-compose -f docker-compose.ai-services.yml ps</li>
                    </ul>
                    <a 
                      href="/AI_SERVICES_DEPLOYMENT.md" 
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      📖 View detailed setup guide →
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="1024x1024">Square (1024x1024)</option>
                    <option value="1024x1792">Portrait (1024x1792)</option>
                    <option value="1792x1024">Landscape (1792x1024)</option>
                  </select>
                </div>
              </div>

                      {error && (
                        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                          <div className="font-semibold mb-2">
                            {(error.includes('Google AI Studio') || 
                              error.includes('Rate limit exceeded') || 
                              error.includes('rate limit') ||
                              (error.includes('Too many requests') && error.includes('Google')))
                              ? '⚠️ Google AI Studio API Error'
                              : (error.includes('Hugging Face') && !error.includes('fallback to Hugging Face'))
                              ? '⚠️ Hugging Face API Error'
                              : '⚠️ Setup Required'}
                          </div>
                          <div className="whitespace-pre-line text-xs font-mono bg-red-100 p-2 rounded mb-2 max-h-40 overflow-y-auto">
                            {error}
                          </div>
                          <div className="text-xs text-red-700 mb-3">
                            💡 <strong>Check your server terminal logs</strong> for detailed error information from {
                              (error.includes('Google AI Studio') || error.includes('Rate limit exceeded') || error.includes('rate limit'))
                                ? 'Google AI Studio API'
                                : error.includes('Hugging Face')
                                ? 'Hugging Face API'
                                : 'the API'
                            }.
                          </div>
                          <div className="mt-3 pt-3 border-t border-red-200 flex gap-2 flex-wrap">
                            {(error.includes('Google AI Studio') || error.includes('connect your Google')) && (
                              <Link href="/dashboard/settings/ai">
                                <Button variant="outline" size="sm">
                                  Connect Google AI Studio
                                </Button>
                              </Link>
                            )}
                            {(error.includes('self-hosted') || error.includes('USE_AI_GATEWAY') || error.includes('docker-compose')) && (
                              <a 
                                href="/AI_SERVICES_DEPLOYMENT.md" 
                                target="_blank"
                                className="text-blue-600 hover:underline text-xs self-center"
                              >
                                📖 View self-hosted setup guide
                              </a>
                            )}
                            {(error.includes('Google AI Studio') || error.includes('Rate limit exceeded') || error.includes('quota exhausted')) && (
                              <div className="text-xs text-red-600">
                                <strong>Next steps:</strong><br/>
                                {error.includes('quota exhausted') ? (
                                  <>
                                    1. Check your quota usage at <a href="https://ai.dev/usage?tab=rate-limit" target="_blank" className="text-blue-600 hover:underline">https://ai.dev/usage?tab=rate-limit</a><br/>
                                    2. Wait for quota reset (usually daily/monthly)<br/>
                                    3. Use &quot;Auto&quot; provider to automatically fallback to Hugging Face (free tier available)<br/>
                                    4. Consider upgrading your Google AI Studio plan if needed
                                  </>
                                ) : (
                                  <>
                                    1. Wait a few moments and try again (rate limits reset quickly)<br/>
                                    2. Check your Google AI Studio usage at <a href="https://aistudio.google.com" target="_blank" className="text-blue-600 hover:underline">https://aistudio.google.com</a><br/>
                                    3. If persistent, try using &quot;Auto&quot; provider (will fallback to Hugging Face)
                                  </>
                                )}
                              </div>
                            )}
                            {error.includes('Hugging Face') && !error.includes('Google AI Studio') && (
                              <div className="text-xs text-red-600">
                                <strong>Next steps:</strong><br/>
                                1. Check server terminal for full error details<br/>
                                2. Verify model name in .env: HUGGINGFACE_IMAGE_MODEL<br/>
                                3. Try a different model if current one fails
                              </div>
                            )}
                            {!error.includes('self-hosted') && !error.includes('Hugging Face') && (
                              <a 
                                href="/GOOGLE_AI_STUDIO_SETUP.md" 
                                target="_blank"
                                className="text-blue-600 hover:underline text-xs self-center"
                              >
                                📖 View detailed setup guide
                              </a>
                            )}
                          </div>
                        </div>
                      )}

              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
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
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>
              Your AI-generated image will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating your image...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden relative group">
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
                      className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 shadow-md"
                      title={imageCopied ? "Image copied!" : "Copy image"}
                    >
                      {imageCopied ? (
                        <svg
                          className="w-4 h-4 text-green-600"
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
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="font-semibold mb-1">✨ AI-Enhanced Prompt</div>
                  <div className="text-gray-600">
                    Your prompt was automatically enhanced by AI to generate better results.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    Download Image
                  </Button>
                  <Button
                    onClick={handleCopyImage}
                    variant="outline"
                    className="flex-1"
                  >
                    {imageCopied ? '✓ Copied!' : 'Copy Image'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedImage(null)
                      setPrompt('')
                    }}
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎨</div>
                  <p>No image generated yet</p>
                  <p className="text-sm mt-1">Fill in the form and click &quot;Generate Image&quot;</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
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
