'use client'

import { useState } from 'react'
// Swipeable functionality - using touch events directly for better compatibility
import { Trash2, Edit, Mail, Phone, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobile } from '@/lib/hooks/use-mobile'

interface MobileOptimizedListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  onSwipeLeft?: (item: T) => void
  onSwipeRight?: (item: T) => void
  onAction?: (item: T, action: string) => void
}

export function MobileOptimizedList<T extends { id: string }>({
  items,
  renderItem,
  onSwipeLeft,
  onSwipeRight,
  onAction,
}: MobileOptimizedListProps<T>) {
  const { isMobile } = useMobile()
  const [swipedItem, setSwipedItem] = useState<string | null>(null)

  if (!isMobile) {
    // Desktop: render normally
    return (
      <div className="space-y-2">
        {items.map((item) => renderItem(item))}
      </div>
    )
  }

  // Mobile: touch-optimized items with swipe gestures
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0]
    const startX = touch.clientX
    const startY = touch.clientY
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const diffX = touch.clientX - startX
      const diffY = touch.clientY - startY
      
      // Detect horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          onSwipeRight?.(items.find(i => i.id === itemId)!)
        } else {
          onSwipeLeft?.(items.find(i => i.id === itemId)!)
        }
        setSwipedItem(itemId)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          onTouchStart={(e) => handleTouchStart(e, item.id)}
          className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg border touch-pan-y"
        >
          <div className="flex items-center">
            <div className="flex-1 p-4">
              {renderItem(item)}
            </div>
            {swipedItem === item.id && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.(item, 'edit')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.(item, 'email')}
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.(item, 'call')}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onAction?.(item, 'delete')
                    setSwipedItem(null)
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
