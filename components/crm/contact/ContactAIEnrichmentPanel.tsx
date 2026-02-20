'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface ContactAIEnrichmentPanelProps {
  contact: any
  tenantId: string
  onEnriched?: () => void
}

export const ContactAIEnrichmentPanel: React.FC<ContactAIEnrichmentPanelProps> = ({
  contact,
  tenantId,
  onEnriched,
}) => {
  const [isEnriching, setIsEnriching] = useState(false)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [enrichmentStatus, setEnrichmentStatus] = useState<'basic' | 'enriched' | 'failed'>('basic')
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
        const data = await response.json()
        setSuggestions(data.suggestions || {})
        setEnrichmentStatus('enriched')
        if (onEnriched) onEnriched()
      } else {
        const error = await response.json()
        setEnrichmentStatus('failed')
        alert(error.error || 'Failed to enrich contact')
      }
    } catch (error) {
      console.error('Enrichment error:', error)
      setEnrichmentStatus('failed')
      alert('Failed to enrich contact. Please try again.')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleAcceptSuggestion = async (field: string, value: any) => {
    if (!token) return

    try {
      const response = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          [field]: value,
        }),
      })

      if (response.ok) {
        // Remove from suggestions
        setSuggestions((prev: any) => {
          const next = { ...prev }
          delete next[field]
          return Object.keys(next).length > 0 ? next : null
        })
        if (onEnriched) onEnriched()
      } else {
        alert('Failed to update field')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update field')
    }
  }

  const handleRejectSuggestion = (field: string) => {
    setSuggestions((prev: any) => {
      const next = { ...prev }
      delete next[field]
      return Object.keys(next).length > 0 ? next : null
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Enrichment</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          Use AI to complete missing fields from public sources (LinkedIn, company website, etc.).
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          enrichmentStatus === 'enriched' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : enrichmentStatus === 'failed'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {enrichmentStatus === 'enriched' ? 'Enriched' : enrichmentStatus === 'failed' ? 'Failed' : 'Basic'}
        </span>
      </div>

      {/* Enrich Button */}
      <button
        onClick={handleEnrich}
        disabled={isEnriching}
        className="w-full rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-3 h-3" />
        {isEnriching ? 'Enriching...' : 'Enrich Contact with AI'}
      </button>

      {/* Suggestions */}
      {suggestions && Object.keys(suggestions).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">Suggested Fields</p>
          {Object.entries(suggestions).map(([field, value]: [string, any]) => (
            <div key={field} className="p-2 bg-slate-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-gray-300 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5 truncate">
                    {String(value)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptSuggestion(field, value)}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                    title="Accept"
                  >
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(field)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                    title="Reject"
                  >
                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
