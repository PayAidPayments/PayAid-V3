'use client'

import { useState } from 'react'
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

interface GeminiSetupWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export default function GeminiSetupWizard({ onComplete, onCancel }: GeminiSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult('Please enter an API key')
      setStatus('error')
      return
    }

    setStatus('testing')
    setTestResult(null)

    try {
      const response = await fetch('/api/ai/integrations/google-ai-studio/test', {
        method: 'POST',
        headers: getAuthHeaders(), // Include Authorization header
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (!response.ok) {
        // Handle HTTP errors (like 401 Unauthorized from our middleware)
        if (response.status === 401) {
          setStatus('error')
          setTestResult('❌ You are not logged in. Please refresh the page and try again.')
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        setStatus('error')
        setTestResult(`❌ ${errorData.error || errorData.message || `Error: ${response.status} ${response.statusText}`}`)
        return
      }

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setTestResult('✅ API key verified! Saving securely...')
        
        // Save the key automatically after successful test
        try {
          const saveResponse = await fetch('/api/settings/tenant', {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              googleAiStudioApiKey: apiKey.trim(),
            }),
          })

          if (saveResponse.ok) {
            // Auto-advance to step 3 after saving
            setTimeout(() => {
              setStep(3)
            }, 1000)
          } else {
            let errorData: any = {}
            try {
              const text = await saveResponse.text()
              errorData = text ? JSON.parse(text) : {}
            } catch (e) {
              errorData = { error: `HTTP ${saveResponse.status}: ${saveResponse.statusText}` }
            }
            
            const errorMessage = errorData.error || errorData.message || `Failed to save API key (${saveResponse.status})`
            const errorDetails = errorData.details ? ` - ${errorData.details}` : ''
            const errorHint = errorData.hint ? ` (${errorData.hint})` : ''
            
            setTestResult(`❌ ${errorMessage}${errorDetails}${errorHint}`)
            setStatus('error')
            console.error('Save API key error:', {
              status: saveResponse.status,
              statusText: saveResponse.statusText,
              error: errorData,
            })
          }
        } catch (saveError) {
          console.error('Save API key exception:', saveError)
          setTestResult(`❌ Failed to save API key: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`)
          setStatus('error')
        }
      } else {
        setStatus('error')
        setTestResult(`❌ ${data.error || 'Invalid API key. Please check and try again.'}`)
      }
    } catch (error) {
      setStatus('error')
      setTestResult('❌ Error testing API key. Please check your internet connection and try again.')
    }
  }

  // Step 1: Instructions
  const StepOne = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          Step 1: Get Your Free API Key
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          Google gives you free Gemini 2.5 Flash credits. We&apos;ll use YOUR credits on YOUR behalf.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 font-semibold">1</span>
          <div>
            <p className="font-medium">Open Google AI Studio</p>
            <p className="text-sm text-gray-600 mb-2">
              Click the link below (opens in new tab)
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Open Google AI Studio
              <span className="ml-1">↗</span>
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 font-semibold">2</span>
          <div>
            <p className="font-medium">Click &quot;Create API Key&quot;</p>
            <p className="text-sm text-gray-600">
              You&apos;ll see a button in the top-right area of the page. Click it to generate your key.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 font-semibold">3</span>
          <div>
            <p className="font-medium">Copy the API Key</p>
            <p className="text-sm text-gray-600 mb-2">
              You&apos;ll see a long key that starts with <code className="bg-gray-100 px-2 py-1 rounded text-xs">AIza...</code>
            </p>
            <p className="text-xs text-gray-500">
              💡 Tip: The key will be hidden after you copy it, so make sure to copy it now!
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 font-semibold">4</span>
          <div>
            <p className="font-medium">Ready to paste?</p>
            <p className="text-sm text-gray-600 mb-3">
              Once you&apos;ve copied your API key, click the button below to continue.
            </p>
            <Button
              onClick={() => setStep(2)}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              I&apos;ve copied my key →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Step 2: Paste Key & Test
  const StepTwo = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">✅ Step 2: Paste Your Key Here</h3>
        <p className="text-sm text-green-800">
          Your API key will be encrypted and stored securely. We never share it.
        </p>
      </div>

      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
          Paste Your API Key
        </label>
        <Input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your Google API key here (starts with AIza...)"
          className="w-full font-mono text-sm"
          disabled={status === 'testing'}
        />
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          🔒 Your key will be encrypted before storing
        </p>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-lg text-sm ${
            status === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {testResult}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => {
            setStep(1)
            setApiKey('')
            setTestResult(null)
            setStatus('idle')
          }}
          variant="outline"
          className="flex-1"
        >
          ← Back
        </Button>
        <Button
          onClick={handleTestKey}
          disabled={!apiKey.trim() || status === 'testing'}
          className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
        >
          {status === 'testing' ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
              Testing...
            </>
          ) : (
            '✨ Test & Save'
          )}
        </Button>
      </div>
    </div>
  )

  // Step 3: Success
  const StepThree = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="font-semibold text-green-900 mb-2">Connected!</h3>
        <p className="text-sm text-green-800">
          Your Google Gemini 2.5 Flash is now linked. You can create images for free!
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-blue-900">What&apos;s next?</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Your free Google credits are active
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Create unlimited images (up to your free tier)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            No additional setup needed
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            All images created with YOUR credits
          </li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard/marketing/social/create-image" className="w-full">
          <Button
            className="w-full bg-green-500 text-white hover:bg-green-600 font-medium"
          >
            Go to Image Generation →
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Link Your Google Gemini
        </CardTitle>
        <CardDescription>
          Connect your Google AI Studio account to use free image generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        {step === 1 && <StepOne />}
        {step === 2 && <StepTwo />}
        {step === 3 && <StepThree />}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <span className="text-yellow-600 text-xl flex-shrink-0">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Why do we need this?</p>
            <p className="mt-1">
              Google gives you free image generation credits. By linking your account, we use YOUR credits instead of PayAid paying for everyone. This keeps our platform affordable for all founders.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
