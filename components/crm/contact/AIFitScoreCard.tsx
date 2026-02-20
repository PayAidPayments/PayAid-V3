'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface AIFitScoreCardProps {
  contact: any
  tenantId: string
}

export const AIFitScoreCard: React.FC<AIFitScoreCardProps> = ({ contact, tenantId }) => {
  const [fitScore, setFitScore] = useState<number | null>(null)
  const [fitReasons, setFitReasons] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useAuthStore()

  useEffect(() => {
    const fetchFitScore = async () => {
      if (!token || !contact) return

      setIsLoading(true)
      try {
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
          setFitScore(data.fitScore || contact.leadScore || null)
          setFitReasons(data.reasons || data.explanation ? [data.explanation] : [])
        } else {
          // Fallback: use lead score
          if (contact.leadScore !== undefined && contact.leadScore !== null) {
            setFitScore(contact.leadScore)
            setFitReasons(['Based on lead scoring algorithm'])
          }
        }
      } catch (error) {
        console.error('Error fetching fit score:', error)
        if (contact.leadScore !== undefined && contact.leadScore !== null) {
          setFitScore(contact.leadScore)
          setFitReasons(['Based on lead scoring'])
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
    if (score >= 50) return 'bg-amber-500'
    return 'bg-orange-500'
  }

  const getFitScoreLabel = (score: number | null) => {
    if (!score) return 'Unknown'
    if (score >= 70) return 'High Fit'
    if (score >= 50) return 'Medium Fit'
    return 'Low Fit'
  }

  const score = fitScore ?? contact.leadScore ?? 0

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Fit Score</h2>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      
      {score > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-gray-100">{score}%</span>
            <span className="text-sm text-slate-600 dark:text-gray-400">– {getFitScoreLabel(score)}</span>
          </div>
          
          {/* Horizontal bar gauge */}
          <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${getFitScoreColor(score)} transition-all duration-300`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>

          {/* Reasons */}
          {fitReasons.length > 0 && (
            <ul className="space-y-1 pt-1">
              {fitReasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="text-xs text-slate-600 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      
      <p className="text-xs text-slate-500 dark:text-gray-500 pt-1 border-t border-amber-200 dark:border-amber-800">
        Based on stage, activity and deal history
      </p>
    </div>
  )
}
