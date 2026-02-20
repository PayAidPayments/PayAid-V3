'use client'

import React from 'react'

interface HealthScoreVisualizationProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function HealthScoreVisualization({ score, size = 'md' }: HealthScoreVisualizationProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      <div className={`text-2xl font-bold ${getColor(score)}`}>
        {score.toFixed(0)}
      </div>
    </div>
  )
}
