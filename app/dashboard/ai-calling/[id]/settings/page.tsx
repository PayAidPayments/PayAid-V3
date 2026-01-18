'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FAQ {
  question: string
  answer: string
}

interface AICallingBot {
  id: string
  name: string
  phoneNumber: string
  greeting?: string
  faqKnowledgeBase: FAQ[]
  isActive: boolean
}

export default function AICallingBotSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string

  const [greeting, setGreeting] = useState('')
  const [faqs, setFaqs] = useState<FAQ[]>([])

  const { data, isLoading } = useQuery<{ bot: AICallingBot }>({
    queryKey: ['ai-calling-bot', botId],
    queryFn: async () => {
      const response = await fetch(`/api/ai-calling/${botId}`)
      if (!response.ok) throw new Error('Failed to fetch bot')
      return response.json()
    },
  })

  useEffect(() => {
    if (data?.bot) {
      setGreeting(data.bot.greeting || '')
      setFaqs(Array.isArray(data.bot.faqKnowledgeBase) ? data.bot.faqKnowledgeBase : [])
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (data: { greeting: string; faqs: FAQ[] }) => {
      const response = await fetch(`/api/ai-calling/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          greeting: data.greeting,
          faqKnowledgeBase: data.faqs,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update bot')
      }
      return response.json()
    },
    onSuccess: () => {
      alert('Bot settings updated successfully!')
    },
  })

  const addFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }])
  }

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs]
    updated[index] = { ...updated[index], [field]: value }
    setFaqs(updated)
  }

  const handleSave = () => {
    updateMutation.mutate({ greeting, faqs })
  }

  if (isLoading) {
    return <PageLoading message="Loading bot settings..." fullScreen={false} />
  }

  const bot = data?.bot

  if (!bot) {
    return <div>Bot not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bot.name} - Settings</h1>
            <p className="mt-2 text-gray-600">Configure your AI calling bot</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Greeting Message</CardTitle>
            <CardDescription>The message played when a call is answered</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hello! Thank you for calling. How can I help you today?"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phone Number</CardTitle>
            <CardDescription>Twilio phone number for this bot</CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={bot.phoneNumber} readOnly className="bg-gray-50" />
            <p className="text-xs text-gray-500 mt-2">
              Configure this in your Twilio account
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ Knowledge Base</CardTitle>
              <CardDescription>
                Questions and answers the bot can use to respond to callers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addFAQ}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No FAQs added yet. Click "Add FAQ" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">FAQ {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFAQ(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Question</label>
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                          placeholder="What are your business hours?"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Answer</label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="We're open Monday to Friday, 9 AM to 6 PM."
                          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

