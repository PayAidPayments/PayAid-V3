'use client'

import { useState } from 'react'
import { Sparkles, Mail, MessageSquare, Copy, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface AIAssistCardProps {
  contact: any
  tenantId: string
  onEnriched?: () => void
}

export const AIAssistCard: React.FC<AIAssistCardProps> = ({ contact, tenantId, onEnriched }) => {
  const [intent, setIntent] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'email' | 'whatsapp' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const { token } = useAuthStore()

  const handleEnrich = async () => {
    if (!token) {
      alert('Please log in to use AI enrichment')
      return
    }

    setIsEnriching(true)
    try {
      const response = await fetch('/api/crm/contacts/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: contact.id,
          tenantId,
        }),
      })

      if (response.ok) {
        if (onEnriched) onEnriched()
        alert('Contact enriched successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to enrich contact')
      }
    } catch (error) {
      console.error('Enrichment error:', error)
      alert('Failed to enrich contact. Please try again.')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleGenerate = async (type: 'email' | 'whatsapp') => {
    if (!intent.trim()) {
      alert('Please describe your intent for the message')
      return
    }

    if (!token) {
      alert('Please log in to use AI outreach')
      return
    }

    setIsGenerating(true)
    setMessageType(type)
    try {
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          contactId: contact.id,
          tenantId,
          intent,
          context: {
            contactName: contact.name,
            company: contact.company,
            recentActivity: contact.interactions?.[0]?.type || 'none',
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedMessage(data.message || data.content)
      } else {
        const error = await response.json()
        alert(error.error || `Failed to generate ${type} message`)
      }
    } catch (error) {
      console.error(`Generate ${type} error:`, error)
      alert(`Failed to generate ${type} message. Please try again.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage)
      alert('Copied to clipboard!')
    }
  }

  const handleSend = () => {
    if (!generatedMessage) return

    if (messageType === 'email' && contact.email) {
      window.location.href = `mailto:${contact.email}?subject=Follow up&body=${encodeURIComponent(generatedMessage)}`
    } else if (messageType === 'whatsapp' && contact.phone) {
      const phone = contact.phone.replace(/\D/g, '')
      const message = encodeURIComponent(generatedMessage)
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Assist</h2>
      
      {/* Enrich Contact */}
      <div className="space-y-2">
        <button
          onClick={handleEnrich}
          disabled={isEnriching}
          className="w-full rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" />
          {isEnriching ? 'Enriching...' : 'Enrich Contact'}
        </button>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Find LinkedIn, website, fill missing fields
        </p>
      </div>

      {/* Generate Message */}
      <div className="border-t border-slate-100 dark:border-gray-700 pt-3 space-y-2">
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g., Follow up on the pricing proposal"
          className="w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs px-3 py-2 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate('email')}
            disabled={isGenerating || !intent.trim()}
            className="flex-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Mail className="w-3 h-3" />
            Email
          </button>
          <button
            onClick={() => handleGenerate('whatsapp')}
            disabled={isGenerating || !intent.trim()}
            className="flex-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold py-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* Generated Message */}
      {generatedMessage && (
        <div className="border-t border-slate-100 dark:border-gray-700 pt-3 space-y-2">
          <div className="p-2 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
            <p className="text-xs text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
              {generatedMessage}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              onClick={handleSend}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
            >
              <Send className="w-3 h-3" />
              {messageType === 'email' ? 'Insert into email' : 'Send WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
