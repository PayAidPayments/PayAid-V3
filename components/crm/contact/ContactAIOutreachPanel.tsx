'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Sparkles, Copy, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface ContactAIOutreachPanelProps {
  contact: any
  tenantId: string
}

export const ContactAIOutreachPanel: React.FC<ContactAIOutreachPanelProps> = ({
  contact,
  tenantId,
}) => {
  const [intent, setIntent] = useState('')
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null)
  const [generatedWhatsApp, setGeneratedWhatsApp] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { token } = useAuthStore()

  const handleGenerateEmail = async () => {
    if (!intent.trim()) {
      alert('Please describe your intent for the message')
      return
    }

    if (!token) {
      alert('Please log in to use AI outreach')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'email',
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
        setGeneratedEmail(data.message || data.content)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate email')
      }
    } catch (error) {
      console.error('Generate email error:', error)
      alert('Failed to generate email. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateWhatsApp = async () => {
    if (!intent.trim()) {
      alert('Please describe your intent for the message')
      return
    }

    if (!token) {
      alert('Please log in to use AI outreach')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'whatsapp',
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
        setGeneratedWhatsApp(data.message || data.content)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate WhatsApp message')
      }
    } catch (error) {
      console.error('Generate WhatsApp error:', error)
      alert('Failed to generate WhatsApp message. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const handleSendEmail = () => {
    if (generatedEmail) {
      // Open email composer with generated content
      window.location.href = `mailto:${contact.email}?subject=Follow up&body=${encodeURIComponent(generatedEmail)}`
    }
  }

  const handleSendWhatsApp = () => {
    if (generatedWhatsApp && contact.phone) {
      // Open WhatsApp with generated message
      const phone = contact.phone.replace(/\D/g, '')
      const message = encodeURIComponent(generatedWhatsApp)
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Outreach</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          Let AI draft personalized messages for this contact based on their history and deals.
        </p>
      </div>

      {/* Intent Input */}
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g., Follow up on the pricing proposal and ask if they have any questions."
        className="w-full rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs px-3 py-2 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Generate Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateEmail}
          disabled={isGenerating || !intent.trim()}
          className="flex-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Mail className="w-3 h-3" />
          Generate Email
        </button>
        <button
          onClick={handleGenerateWhatsApp}
          disabled={isGenerating || !intent.trim()}
          className="flex-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold py-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <MessageSquare className="w-3 h-3" />
          Generate WhatsApp
        </button>
      </div>

      {/* Generated Email */}
      {generatedEmail && (
        <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">Generated Email</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopyToClipboard(generatedEmail)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy"
              >
                <Copy className="w-3 h-3 text-slate-600 dark:text-gray-400" />
              </button>
              {contact.email && (
                <button
                  onClick={handleSendEmail}
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded transition-colors"
                  title="Send Email"
                >
                  <Send className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
            </div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-gray-700 rounded text-xs text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
            {generatedEmail}
          </div>
        </div>
      )}

      {/* Generated WhatsApp */}
      {generatedWhatsApp && (
        <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">Generated WhatsApp</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopyToClipboard(generatedWhatsApp)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy"
              >
                <Copy className="w-3 h-3 text-slate-600 dark:text-gray-400" />
              </button>
              {contact.phone && (
                <button
                  onClick={handleSendWhatsApp}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded transition-colors"
                  title="Send WhatsApp"
                >
                  <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </button>
              )}
            </div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-gray-700 rounded text-xs text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
            {generatedWhatsApp}
          </div>
        </div>
      )}
    </div>
  )
}
