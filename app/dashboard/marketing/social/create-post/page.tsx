'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyButton } from '@/components/ui/copy-button'
import { useAuthStore } from '@/lib/stores/auth'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function CreatePostPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('facebook')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Image selection state
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

  const handleCopy = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost)
      alert('Post copied to clipboard!')
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Convert to data URL for preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Post Generation</h1>
          <p className="mt-2 text-gray-600">
            Create engaging social media posts using AI
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
            <CardTitle>Post Generation</CardTitle>
            <CardDescription>
              Describe what you want to post about. The AI will create engaging content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Topic / Description *
                </label>
                <textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Announce our new product launch, share a customer success story, promote a special offer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  required
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Describe what you want to post about or the message you want to convey
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                    Length
                  </label>
                  <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (Optional)
                </label>
                <div className="space-y-2">
                  {selectedImage ? (
                    <div className="relative border border-gray-200 rounded-lg overflow-hidden">
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
                        className="flex-1"
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
                          className="w-full"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Select Image from Library</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMediaLibrary(false)}
                        >
                          ✕
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[60vh]">
                      {isLoadingMedia ? (
                        <div className="text-center py-12">Loading images...</div>
                      ) : mediaLibrary.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                          {mediaLibrary.map((media) => (
                            <div
                              key={media.id}
                              className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => handleImageSelect(media.fileUrl)}
                            >
                              <img
                                src={media.fileUrl}
                                alt={media.title || media.fileName}
                                className="w-full h-32 object-cover"
                              />
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">
                                  {media.title || media.fileName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No images in library yet</p>
                          <p className="text-sm mt-2">
                            <Link href="/dashboard/marketing/social/create-image" className="text-blue-600 hover:underline">
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
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full"
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
        <Card>
          <CardHeader>
            <CardTitle>Generated Post</CardTitle>
            <CardDescription>
              Your AI-generated post will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating your post...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </div>
              </div>
            ) : generatedPost ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px] relative group">
                  <p className="whitespace-pre-wrap text-gray-900 pr-8">{generatedPost}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton
                      text={generatedPost}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    text={generatedPost}
                    variant="default"
                    size="default"
                    showText={true}
                    className="flex-1"
                  />
                  <Link href={`/dashboard/marketing/social/schedule?content=${encodeURIComponent(generatedPost)}&imageUrl=${selectedImage ? encodeURIComponent(selectedImage) : ''}`}>
                    <Button variant="outline" className="flex-1">
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
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
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
      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
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
