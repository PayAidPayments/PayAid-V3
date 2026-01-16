'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageLoading } from '@/components/ui/loading'

export default function NewVoiceAgentPage() {
  const router = useRouter()
  const params = useParams()
  const { token, isAuthenticated, fetchUser } = useAuthStore()
  const tenantId = params.tenantId as string
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'en',
    systemPrompt: '',
    voiceId: '',
  })

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for zustand to hydrate from localStorage
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Try multiple ways to get token
      let authToken = token
      
      if (!authToken && typeof window !== 'undefined') {
        // Try localStorage directly
        authToken = localStorage.getItem('token') || localStorage.getItem('auth-token')
        
        // Try to get from auth store persistence (zustand persist)
        try {
          const authStore = localStorage.getItem('auth-storage')
          if (authStore) {
            const parsed = JSON.parse(authStore)
            authToken = parsed?.state?.token || authToken
            console.log('[NewVoiceAgent] Found token in auth-storage:', !!authToken)
          }
        } catch (e) {
          console.warn('[NewVoiceAgent] Could not parse auth storage:', e)
        }
      }
      
      console.log('[NewVoiceAgent] Auth check:', {
        hasToken: !!token,
        hasAuthToken: !!authToken,
        isAuthenticated,
        localStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('token')) : []
      })
      
      // If we have a token but store doesn't, try to fetch user to populate store
      if (authToken && !token) {
        console.log('[NewVoiceAgent] Token found in localStorage but not in store, fetching user...')
        try {
          await fetchUser()
        } catch (e) {
          console.warn('[NewVoiceAgent] Failed to fetch user:', e)
        }
      }
      
      // If still no token and not authenticated, redirect to login
      if (!authToken && !isAuthenticated) {
        console.warn('[NewVoiceAgent] No token found, redirecting to login')
        alert('You must be logged in to create a voice agent. Redirecting to login...')
        router.push('/login')
        return
      }
      
      setCheckingAuth(false)
    }
    
    checkAuth()
  }, [token, isAuthenticated, fetchUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get token from auth store or localStorage as fallback
    let authToken = token
    
    if (!authToken && typeof window !== 'undefined') {
      // Try multiple localStorage keys
      authToken = localStorage.getItem('token') || 
                  localStorage.getItem('auth-token') ||
                  (() => {
                    try {
                      const authStore = localStorage.getItem('auth-storage')
                      if (authStore) {
                        const parsed = JSON.parse(authStore)
                        return parsed?.state?.token
                      }
                    } catch (e) {
                      return null
                    }
                    return null
                  })()
    }
    
    // Check authentication
    if (!authToken) {
      alert('You must be logged in to create a voice agent. Please log in and try again.')
      router.push('/login')
      return
    }
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter an agent name')
      return
    }
    
    if (!formData.language) {
      alert('Please select a language')
      return
    }
    
    if (!formData.systemPrompt.trim()) {
      alert('Please enter a system prompt')
      return
    }
    
    setLoading(true)

    console.log('[NewVoiceAgent] Creating agent with token:', authToken ? 'Token present' : 'No token')
    
    try {
      const response = await fetch('/api/v1/voice-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          ...(formData.description.trim() && { description: formData.description.trim() }),
          language: formData.language,
          systemPrompt: formData.systemPrompt.trim(),
          ...(formData.voiceId.trim() && { voiceId: formData.voiceId.trim() }),
        }),
      })
      
      console.log('[NewVoiceAgent] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        // Show success message
        alert('Voice agent created successfully!')
        router.push(`/voice-agents/${tenantId}/Home`)
      } else {
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.')
          router.push('/login')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error Response:', errorData)
        
        // Show detailed validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((d: any) => 
            `${d.path?.join('.') || 'field'}: ${d.message}`
          ).join('\n')
          alert(`Validation Error:\n${errorMessages}`)
        } else {
          // Show the actual error message from the API
          const errorMessage = errorData.message || errorData.error || 'Failed to create agent'
          const fullMessage = errorData.details 
            ? `${errorMessage}\n\nDetails: ${errorData.details}` 
            : errorMessage
          alert(`Error: ${fullMessage}`)
        }
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to create agent: ${errorMessage}\n\nPlease check your connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (checkingAuth) {
    return <PageLoading message="Checking authentication..." fullScreen={true} />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href={`/voice-agents/${tenantId}/Home`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Voice Agent</CardTitle>
          <CardDescription>
            Configure your AI voice agent for automated calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Payment Reminder Agent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Calls customers for payment reminders"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              <select
                id="language"
                required
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="pa">Punjabi</option>
                <option value="bn">Bengali</option>
                <option value="ml">Malayalam</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt *</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                required
                placeholder="You are a friendly payment reminder bot. Be polite and professional."
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Define how the agent should behave during calls
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceId">Voice ID (Optional)</Label>
              <Input
                id="voiceId"
                value={formData.voiceId}
                onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                placeholder="hi_female or leave empty for default"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Agent'}
              </Button>
              <Link href={`/voice-agents/${tenantId}/Home`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

