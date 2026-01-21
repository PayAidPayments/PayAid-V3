'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5

export default function NewAICampaignPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const { token } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  const [campaignName, setCampaignName] = useState('')
  const [industry, setIndustry] = useState('')
  const [gender, setGender] = useState('female')
  const [ageRange, setAgeRange] = useState('25-35')
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [characterImage, setCharacterImage] = useState<string | null>(null)
  const [generatingCharacter, setGeneratingCharacter] = useState(false)

  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productImage, setProductImage] = useState<string | null>(null)

  const [scriptId, setScriptId] = useState<string | null>(null)
  const [scriptVariations, setScriptVariations] = useState<any[]>([])
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number | null>(null)
  const [generatingScript, setGeneratingScript] = useState(false)

  const [videoStyle, setVideoStyle] = useState<'testimonial' | 'demo' | 'problem-solution'>('testimonial')
  const [cta, setCta] = useState('')

  const [videoId, setVideoId] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)

  const [campaignId, setCampaignId] = useState<string | null>(null)

  const handleStep1Next = async () => {
    if (!token) return

    setLoading(true)
    try {
      const campaignRes = await fetch('/api/ai-influencer/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName || undefined,
          industry: industry || undefined,
        }),
      })

      const campaignData = await campaignRes.json()
      if (!campaignRes.ok) throw new Error(campaignData.error || 'Failed to create campaign')
      setCampaignId(campaignData.campaign.id)

      setGeneratingCharacter(true)
      const charRes = await fetch('/api/ai-influencer/characters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: campaignData.campaign.id,
          industry: industry || undefined,
          gender,
          ageRange,
        }),
      })

      const charData = await charRes.json()
      if (!charRes.ok) throw new Error(charData.error || 'Failed to generate character')

      setCharacterId(charData.character.id)
      setCharacterImage(charData.character.imageUrl)
      setStep(2)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
      setGeneratingCharacter(false)
    }
  }

  const handleStep2Next = () => {
    if (!productName) {
      alert('Please enter a product name')
      return
    }
    setStep(3)
  }

  const handleStep3Next = async () => {
    if (!token || !campaignId) return
    if (selectedScriptIndex === null) {
      alert('Please select a script variation')
      return
    }

    setGeneratingScript(true)
    try {
      const scriptRes = await fetch('/api/ai-influencer/scripts/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          productName,
          productDescription: productDescription || undefined,
          tone: 'casual',
        }),
      })

      const scriptData = await scriptRes.json()
      if (!scriptRes.ok) throw new Error(scriptData.error || 'Failed to generate script')

      setScriptId(scriptData.script.id)
      setScriptVariations(scriptData.script.variations || [])
      setSelectedScriptIndex(0)
      setStep(4)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGeneratingScript(false)
    }
  }

  const handleGenerateScript = async () => {
    if (!token || !campaignId || !productName) {
      alert('Please fill in product details first')
      return
    }

    setGeneratingScript(true)
    try {
      const scriptRes = await fetch('/api/ai-influencer/scripts/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          productName,
          productDescription: productDescription || undefined,
          tone: 'casual',
        }),
      })

      const scriptData = await scriptRes.json()
      if (!scriptRes.ok) throw new Error(scriptData.error || 'Failed to generate script')

      setScriptId(scriptData.script.id)
      setScriptVariations(scriptData.script.variations || [])
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGeneratingScript(false)
    }
  }

  const handleStep4Next = () => {
    setStep(5)
  }

  const handleGenerateVideo = async () => {
    if (!token || !campaignId || !characterId || !scriptId) return

    setGeneratingVideo(true)
    try {
      const videoRes = await fetch('/api/ai-influencer/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          characterId,
          scriptId,
          style: videoStyle,
          cta: cta || undefined,
        }),
      })

      const videoData = await videoRes.json()
      if (!videoRes.ok) throw new Error(videoData.error || 'Failed to generate video')

      setVideoId(videoData.video.id)
      alert('Video generation started! This is a placeholder - full video pipeline will be implemented.')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setGeneratingVideo(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 dark:text-gray-300 dark:hover:bg-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create AI Influencer Video</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Follow the steps to create your video</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 5 && (
              <div
                className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600 dark:bg-blue-700' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Character */}
      {step === 1 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Step 1: Create Campaign & Generate Character</CardTitle>
            <CardDescription className="dark:text-gray-400">Set up your campaign and generate an AI influencer character</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Campaign Name (Optional)</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="My Product Launch"
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Industry (Optional)</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Fashion, Tech, Food, etc."
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Age Range</label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                >
                  <option value="18-25">18-25</option>
                  <option value="25-35">25-35</option>
                  <option value="35-45">35-45</option>
                  <option value="45+">45+</option>
                </select>
              </div>
            </div>
            {characterImage && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Generated Character:</p>
                <img src={characterImage} alt="Character" className="w-32 h-32 object-cover rounded-lg" />
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleStep1Next} disabled={loading || generatingCharacter} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {generatingCharacter ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product */}
      {step === 2 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Step 2: Product Details</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter information about the product you&apos;re promoting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product Name *</label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Amazing Product"
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product Description (Optional)</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md min-h-[100px]"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep2Next} disabled={!productName} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Script */}
      {step === 3 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Step 3: Generate Script</CardTitle>
            <CardDescription className="dark:text-gray-400">AI will create 3 script variations for you to choose from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scriptVariations.length === 0 ? (
              <div className="text-center py-8">
                <Button onClick={handleGenerateScript} disabled={generatingScript} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  {generatingScript ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Scripts...
                    </>
                  ) : (
                    'Generate Scripts'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scriptVariations.map((variation: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedScriptIndex === index ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700'
                    }`}
                    onClick={() => setSelectedScriptIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium capitalize mb-2 text-gray-900 dark:text-gray-100">{variation.type || 'Script'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{variation.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Duration: ~{variation.duration || 30}s</p>
                      </div>
                      {selectedScriptIndex === index && (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep3Next} disabled={selectedScriptIndex === null} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Style */}
      {step === 4 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Step 4: Video Style</CardTitle>
            <CardDescription className="dark:text-gray-400">Choose the style and call-to-action for your video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Video Style</label>
              <div className="grid grid-cols-3 gap-4">
                {(['testimonial', 'demo', 'problem-solution'] as const).map((style) => (
                  <div
                    key={style}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      videoStyle === style ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700'
                    }`}
                    onClick={() => setVideoStyle(style)}
                  >
                    <p className="font-medium capitalize text-gray-900 dark:text-gray-100">{style.replace('-', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Call-to-Action (Optional)</label>
              <Input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Buy now, Link in bio, etc."
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep4Next} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Generate Video */}
      {step === 5 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Step 5: Generate Video</CardTitle>
            <CardDescription className="dark:text-gray-400">Review your selections and generate the final video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <p className="text-gray-900 dark:text-gray-100"><strong>Character:</strong> {gender} {ageRange}</p>
              <p className="text-gray-900 dark:text-gray-100"><strong>Product:</strong> {productName}</p>
              <p className="text-gray-900 dark:text-gray-100"><strong>Style:</strong> {videoStyle}</p>
              {selectedScriptIndex !== null && scriptVariations[selectedScriptIndex] && (
                <p className="text-gray-900 dark:text-gray-100"><strong>Script:</strong> {scriptVariations[selectedScriptIndex].text.substring(0, 100)}...</p>
              )}
            </div>
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Note: Full video generation pipeline (face detection, lip-sync, FFmpeg) will be implemented in Phase 2.
                This is a placeholder implementation.
              </p>
              <Button onClick={handleGenerateVideo} disabled={generatingVideo} size="lg" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {generatingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  'Generate Video'
                )}
              </Button>
            </div>
            {videoId && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200">Video generation started! Video ID: {videoId}</p>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => router.push(`/marketing/${tenantId}/AI-Influencer`)} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Finish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
