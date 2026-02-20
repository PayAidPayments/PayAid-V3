'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Target, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface ProspectAIPanelProps {
  contact: any
  tenantId: string
}

export const ProspectAIPanel: React.FC<ProspectAIPanelProps> = ({ contact, tenantId }) => {
  const [fitScore, setFitScore] = useState<number | null>(null)
  const [fitExplanation, setFitExplanation] = useState<string>('')
  const [suggestedSteps, setSuggestedSteps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useAuthStore()

  useEffect(() => {
    const fetchFitScore = async () => {
      if (!token || !contact) return

      setIsLoading(true)
      try {
        // Call AI endpoint to get prospect fit score and suggestions
        const response = await fetch('/api/ai/prospect-fit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            contactId: contact.id,
            tenantId,
            contactData: {
              name: contact.name,
              company: contact.company,
              email: contact.email,
              phone: contact.phone,
              industry: contact.industry,
              leadScore: contact.leadScore,
              stage: contact.stage,
              source: contact.source,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setFitScore(data.fitScore || null)
          setFitExplanation(data.explanation || '')
          setSuggestedSteps(data.suggestedSteps || [])
        } else {
          // Fallback: calculate basic fit score from lead score
          if (contact.leadScore !== undefined && contact.leadScore !== null) {
            setFitScore(contact.leadScore)
            setFitExplanation('Fit score based on lead scoring algorithm')
            setSuggestedSteps([
              contact.leadScore > 70 ? 'Schedule discovery call' : 'Send qualification email',
              contact.leadScore > 50 ? 'Move to next stage' : 'Continue nurturing',
            ])
          }
        }
      } catch (error) {
        console.error('Error fetching fit score:', error)
        // Fallback
        if (contact.leadScore !== undefined && contact.leadScore !== null) {
          setFitScore(contact.leadScore)
          setFitExplanation('Fit score based on lead scoring')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchFitScore()
  }, [contact, tenantId, token])

  const getFitScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-500'
    if (score >= 70) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getFitScoreLabel = (score: number | null) => {
    if (!score) return 'Unknown'
    if (score >= 70) return 'High Fit'
    if (score >= 50) return 'Medium Fit'
    return 'Low Fit'
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Prospect Fit</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          AI analysis of how well this prospect matches your ideal customer profile (ICP).
        </p>
      </div>

      {/* Fit Score Badge */}
      {fitScore !== null && (
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg ${getFitScoreColor(fitScore)} text-white text-sm font-semibold flex items-center gap-1`}>
            <TrendingUp className="w-3 h-3" />
            {fitScore}% - {getFitScoreLabel(fitScore)}
          </div>
        </div>
      )}

      {/* Fit Explanation */}
      {fitExplanation && (
        <div className="p-2 bg-slate-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-slate-700 dark:text-gray-300">{fitExplanation}</p>
        </div>
      )}

      {/* Suggested Next Steps */}
      {suggestedSteps.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 mb-2">Suggested Next Steps</p>
          <ul className="space-y-1.5">
            {suggestedSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-600 dark:text-gray-400">
                <Target className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-500" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-gray-700 space-y-1.5">
        <button className="w-full text-left px-2 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3" />
          Move to next stage
        </button>
        <button className="w-full text-left px-2 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          Disqualify prospect
        </button>
      </div>
    </div>
  )
}
