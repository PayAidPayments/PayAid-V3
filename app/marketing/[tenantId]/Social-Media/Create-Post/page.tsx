'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyButton } from '@/components/ui/copy-button'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function CreatePostPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('facebook')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedPost(null)

    try {
      const response = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          tone,
          length,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate post')
      }

      const data = await response.json()
      setGeneratedPost(data.post || data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadMediaLibrary = async () => {
    setIsLoadingMedia(true)
    try {
      const response = await fetch('/api/media-library?category=social-media&limit=20', {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setMediaLibrary(data.media || [])
      }
    } catch (error) {
      console.error('Failed to load media library:', error)
    } finally {
      setIsLoadingMedia(false)
    }
  }

  useEffect(() => {
    if (showMediaLibrary) {
      loadMediaLibrary()
    }
  }, [showMediaLibrary])

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowMediaLibrary(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Post Generation</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create engaging social media posts using AI
          </p>
        </div>
        <Link href={`/marketing/${tenantId}/Social-Media`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Social Media</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Post Generation</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Describe what you want to post about. The AI will create engaging content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post Topic / Description *
                </label>
                <textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Announce our new product launch, share a customer success story, promote a special offer"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Describe what you want to post about or the message you want to convey
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Length
                  </label>
                  <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image (Optional)
                </label>
                <div className="space-y-2">
                  {selectedImage ? (
                    <div className="relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMediaLibrary(true)}
                        className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        📚 Choose from Library
                      </Button>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload-input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          onClick={() => {
                            const input = document.getElementById('image-upload-input') as HTMLInputElement
                            input?.click()
                          }}
                        >
                          📤 Upload Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Library Modal */}
              {showMediaLibrary && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
                  <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="dark:text-gray-100">Select Image from Library</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMediaLibrary(false)}
                          className="dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          ✕
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[60vh]">
                      {isLoadingMedia ? (
                        <PageLoading message="Loading images..." fullScreen={false} />
                      ) : mediaLibrary.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                          {mediaLibrary.map((media) => (
                            <div
                              key={media.id}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                              onClick={() => handleImageSelect(media.fileUrl)}
                            >
                              <img
                                src={media.fileUrl}
                                alt={media.title || media.fileName}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2">
                                <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
                                  {media.title || media.fileName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <p>No images in library yet</p>
                          <p className="text-sm mt-2">
                            <Link href={`/marketing/${tenantId}/Social-Media/Create-Image`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              Generate an image
                            </Link> or upload one
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                    Generating...
                  </>
                ) : (
                  'Generate Post'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Post */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Generated Post</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Your AI-generated post will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Generating your post...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few seconds</p>
                </div>
              </div>
            ) : generatedPost ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[200px] relative group">
                  <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 pr-8">{generatedPost}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton
                      text={generatedPost}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    text={generatedPost}
                    variant="default"
                    size="default"
                    showText={true}
                    className="flex-1 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  />
                  <Link href={`/marketing/${tenantId}/Social-Media/Schedule?content=${encodeURIComponent(generatedPost)}&imageUrl=${selectedImage ? encodeURIComponent(selectedImage) : ''}`}>
                    <Button variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      📅 Schedule Post
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedPost(null)
                      setTopic('')
                      setSelectedImage(null)
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
                  <div className="text-4xl mb-2">✍️</div>
                  <p>No post generated yet</p>
                  <p className="text-sm mt-1">Fill in the form and click &quot;Generate Post&quot;</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Tips for Better Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✅ <strong>Be clear:</strong> Describe what you want to communicate</li>
            <li>✅ <strong>Include context:</strong> Mention your business, product, or service</li>
            <li>✅ <strong>Specify goal:</strong> Is it to inform, promote, engage, or educate?</li>
            <li>✅ <strong>Choose platform:</strong> Different platforms have different best practices</li>
            <li>✅ <strong>Adjust tone:</strong> Match the tone to your brand and audience</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
