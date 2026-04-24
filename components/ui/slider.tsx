'use client'

import * as React from 'react'

type SliderProps = {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
}: SliderProps) {
  const current = Array.isArray(value) && value.length > 0 ? value[0] : min

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      disabled={disabled}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={className}
      aria-label="slider"
    />
  )
}

