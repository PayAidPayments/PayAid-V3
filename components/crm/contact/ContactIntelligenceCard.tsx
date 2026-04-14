'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, ShieldAlert, TrendingUp } from 'lucide-react'

interface ContactIntelligenceCardProps {
  contact: any
  onOpenNurture?: () => void
  onRescore?: () => void
  isRescoring?: boolean
}

export const ContactIntelligenceCard: React.FC<ContactIntelligenceCardProps> = ({
  contact,
  onOpenNurture,
  onRescore,
  isRescoring = false,
}) => {
  const score = Number(contact?.leadScore ?? 0)
  const stage = contact?.stage || (contact?.type === 'lead' ? 'prospect' : contact?.type === 'customer' ? 'customer' : 'contact')
  const health = contact?.churnRisk ? 'At risk' : score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Needs attention'
  const riskCue = contact?.churnRisk
    ? 'Churn risk detected. Prioritize a check-in and value recap.'
    : contact?.likelyToBuy
      ? 'Buying intent is high. Push for a commercial next step.'
      : 'No strong risk signal. Keep a steady follow-up cadence.'

  return (
    <section
      data-testid="contact-intelligence-card"
      className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            Contact Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Lifecycle, fit, and risk cues in one view
          </p>
        </div>
        <Badge variant="outline" className="capitalize">{stage}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-2.5">
          <div className="text-xs text-slate-500 dark:text-gray-400">Fit score</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{score || '-'}{score ? '/100' : ''}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-2.5">
          <div className="text-xs text-slate-500 dark:text-gray-400">Contact health</div>
          <div className="mt-1 font-semibold text-slate-900 dark:text-gray-100">{health}</div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 p-3 text-xs text-slate-600 dark:text-gray-300 space-y-2">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-amber-500" />
          <span>{riskCue}</span>
        </div>
        <div className="flex items-start gap-2">
          <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-emerald-500" />
          <span>Recommended next step: create a follow-up task or send a personalized outreach.</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={onOpenNurture}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Nurture
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={onRescore}
          disabled={isRescoring}
          title={isRescoring ? 'Rescoring…' : undefined}
        >
          {isRescoring ? 'Rescoring…' : 'Rescore'}
        </Button>
      </div>
    </section>
  )
}
