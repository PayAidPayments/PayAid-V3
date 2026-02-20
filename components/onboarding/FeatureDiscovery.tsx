'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X, HelpCircle } from 'lucide-react'

interface FeatureTip {
  id: string
  target: string // CSS selector or element ID
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const featureTips: FeatureTip[] = [
  {
    id: 'email-sync',
    target: '[data-feature="email-sync"]',
    title: 'Email Sync',
    content: 'Connect your email to automatically log all sent and received emails to contacts and deals.',
    position: 'right',
  },
  {
    id: 'lead-scoring',
    target: '[data-feature="lead-scoring"]',
    title: 'AI Lead Scoring',
    content: 'Leads are automatically scored from 0-100. Focus on hot leads (70+) for better conversion.',
    position: 'top',
  },
  {
    id: 'deal-rot',
    target: '[data-feature="deal-rot"]',
    title: 'Deal Rot Detection',
    content: 'Get alerts when deals haven\'t moved in a while. Keep your pipeline healthy!',
    position: 'bottom',
  },
  {
    id: 'automation',
    target: '[data-feature="automation"]',
    title: 'Workflow Automation',
    content: 'Create automations to save time. Auto-assign leads, send follow-ups, and more.',
    position: 'left',
  },
]

export function FeatureDiscovery() {
  const [currentTip, setCurrentTip] = useState<number | null>(null)
  const [dismissedTips, setDismissedTips] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed tips from localStorage
    const dismissed = localStorage.getItem('dismissed-feature-tips')
    if (dismissed) {
      setDismissedTips(JSON.parse(dismissed))
    }

    // Show first undismissed tip
    const dismissedArray: string[] = dismissed ? JSON.parse(dismissed) : []
    const firstUndismissed = featureTips.findIndex(
      (tip) => !dismissedArray.includes(tip.id)
    )
    if (firstUndismissed !== -1) {
      setTimeout(() => setCurrentTip(firstUndismissed), 1000)
    }
  }, [])

  const handleDismiss = (tipId: string) => {
    const newDismissed = [...dismissedTips, tipId]
    setDismissedTips(newDismissed)
    localStorage.setItem('dismissed-feature-tips', JSON.stringify(newDismissed))
    setCurrentTip(null)

    // Show next tip
    const nextIndex = featureTips.findIndex(
      (tip, index) => index > (currentTip || 0) && !newDismissed.includes(tip.id)
    )
    if (nextIndex !== -1) {
      setTimeout(() => setCurrentTip(nextIndex), 500)
    }
  }

  const handleNext = () => {
    const nextIndex = featureTips.findIndex(
      (tip, index) => index > (currentTip || 0) && !dismissedTips.includes(tip.id)
    )
    if (nextIndex !== -1) {
      setCurrentTip(nextIndex)
    } else {
      setCurrentTip(null)
    }
  }

  if (currentTip === null || dismissedTips.includes(featureTips[currentTip].id)) {
    return null
  }

  const tip = featureTips[currentTip]
  const targetElement = document.querySelector(tip.target)

  if (!targetElement) {
    return null
  }

  const rect = targetElement.getBoundingClientRect()
  const position = {
    top: tip.position === 'bottom' ? rect.bottom + 10 : tip.position === 'top' ? rect.top - 200 : rect.top,
    left: tip.position === 'right' ? rect.right + 10 : tip.position === 'left' ? rect.left - 300 : rect.left,
  }

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold">{tip.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss(tip.id)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-600 mb-3">{tip.content}</p>
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDismiss(tip.id)}
        >
          Dismiss
        </Button>
        <Button size="sm" onClick={handleNext}>
          Next Tip
        </Button>
      </div>
    </div>
  )
}
