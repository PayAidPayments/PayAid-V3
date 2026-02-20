'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface EntityAIPanelProps {
  entityType: 'prospects' | 'contacts' | 'customers' | 'deals'
}

export const EntityAIPanel: React.FC<EntityAIPanelProps> = ({ entityType }) => {
  const [aiQuery, setAiQuery] = useState('')

  const suggestions = {
    prospects: [
      'Show prospects with the highest AI score this week',
      'Highlight stalled prospects with no activity in 14+ days',
      'List prospects with highest conversion probability',
      'Find prospects ready to move to contact stage',
      'Show prospects from top-performing sources',
    ],
    contacts: [
      'Show contacts with highest engagement this month',
      'List contacts who need follow-up this week',
      'Find contacts at risk of churning',
      'Show contacts with most recent activity',
      'Highlight contacts ready for upsell opportunities',
    ],
    customers: [
      'Show top customers at risk this month',
      'List customers to upsell this week',
      'Find customers with declining engagement',
      'Show customers with highest lifetime value',
      'Highlight customers ready for expansion',
    ],
    deals: [
      'Show deals likely to close this month',
      'List deals at risk of slipping',
      'Find deals with highest probability',
      'Show deals needing immediate attention',
      'Highlight deals with best win potential',
    ],
  }

  const handleAskAI = () => {
    if (!aiQuery.trim()) return
    // TODO: Implement AI query handler
    console.log(`[AI] Query for ${entityType}:`, aiQuery)
    setAiQuery('')
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">AI Suggestions</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
          Insights are based on recent activity, scores and pipeline performance.
        </p>
      </div>

      <ul className="space-y-2 text-xs text-slate-700 dark:text-gray-300">
        {suggestions[entityType].slice(0, 5).map((suggestion, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 dark:border-gray-700 pt-3">
        <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">
          Ask AI about {entityType}
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder={`e.g., Which ${entityType} should I focus on today?`}
            className="flex-1 rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-xs
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAskAI}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
