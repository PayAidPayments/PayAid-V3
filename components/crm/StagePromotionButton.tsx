'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useTerms } from '@/lib/terminology/use-terms'

interface StagePromotionButtonProps {
  contactId: string
  currentStage: 'prospect' | 'contact' | 'customer'
  onPromoted?: () => void
}

export function StagePromotionButton({ contactId, currentStage, onPromoted }: StagePromotionButtonProps) {
  const [isPromoting, setIsPromoting] = useState(false)
  const { token } = useAuthStore()
  const { term } = useTerms()

  const getNextStage = (): 'contact' | 'customer' | null => {
    if (currentStage === 'prospect') return 'contact'
    if (currentStage === 'contact') return 'customer'
    return null
  }

  const nextStage = getNextStage()

  if (!nextStage) {
    return (
      <span className="text-sm text-gray-500 flex items-center gap-1">
        <Check className="w-4 h-4" />
        {term('customer')}
      </span>
    )
  }

  const handlePromote = async () => {
    if (!token) {
      alert('Please log in to promote contacts')
      return
    }

    setIsPromoting(true)
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: nextStage }),
      })

      if (response.ok) {
        if (onPromoted) {
          onPromoted()
        } else {
          window.location.reload()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to promote contact')
      }
    } catch (error) {
      console.error('Promote contact error:', error)
      alert('Failed to promote contact')
    } finally {
      setIsPromoting(false)
    }
  }

  const getButtonText = () => {
    if (nextStage === 'contact') return `Promote to ${term('contact')}`
    if (nextStage === 'customer') return `Promote to ${term('customer')}`
    return 'Promote'
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePromote}
      disabled={isPromoting}
      className="flex items-center gap-1"
    >
      {isPromoting ? (
        'Promoting...'
      ) : (
        <>
          {getButtonText()}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </Button>
  )
}

