'use client'

import React from 'react'
import Image from 'next/image'

interface PayAidLogoProps {
  className?: string
  height?: number | string
  width?: number | string
  useImage?: boolean
  imageUrl?: string
}

export function PayAidLogo({ 
  className = '', 
  height = 32, 
  width = 'auto',
  useImage = false,
  imageUrl
}: PayAidLogoProps) {
  // If image URL is provided, use it
  if (useImage && imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt="PayAid V3 Logo" 
        height={typeof height === 'number' ? height : undefined}
        width={typeof width === 'number' ? width : undefined}
        className={className}
        style={{ 
          height: typeof height === 'string' ? height : `${height}px`,
          width: width === 'auto' ? 'auto' : typeof width === 'string' ? width : `${width}px`,
          objectFit: 'contain',
          maxWidth: '100%',
          display: 'block'
        }}
        onError={(e) => {
          // Fallback to SVG if image fails to load
          console.warn('Logo image failed to load, using fallback')
        }}
      />
    )
  }

  // SVG logo matching the exact design
  const numericHeight = typeof height === 'number' ? height : 32
  const aspectRatio = 6.25 // Approximate aspect ratio for "PayAid-V3" text
  
  return (
    <svg
      viewBox="0 0 250 40"
      height={numericHeight}
      width={width === 'auto' ? numericHeight * aspectRatio : width}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      {/* Pay - Deep Purple */}
      <text
        x="0"
        y="28"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fill="#53328A"
        letterSpacing="0"
      >
        Pay
      </text>

      {/* Hand Icon - Purple, above "A" in "Aid" */}
      <g transform="translate(52, -4)">
        {/* Simplified hand icon - cupping/reaching gesture */}
        <path
          d="M 10 2 L 10 8 Q 10 10 12 10 L 14 10 Q 16 10 16 8 L 16 2 Q 16 0 14 0 L 12 0 Q 10 0 10 2 Z"
          fill="#53328A"
        />
        <path
          d="M 8 6 L 8 10 Q 8 12 10 12 L 12 12 Q 14 12 14 10 L 14 6 Z"
          fill="#53328A"
        />
        <path
          d="M 6 10 L 6 14 Q 6 16 8 16 L 10 16 Q 12 16 12 14 L 12 10 Z"
          fill="#53328A"
        />
        <path
          d="M 4 14 L 4 18 Q 4 20 6 20 L 8 20 Q 10 20 10 18 L 10 14 Z"
          fill="#53328A"
        />
        {/* Wrist/base */}
        <rect x="6" y="20" width="6" height="2" fill="#53328A" rx="0.5" />
      </g>

      {/* Aid - Bright Yellow */}
      <text
        x="72"
        y="28"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fill="#F5C700"
        letterSpacing="0"
      >
        Aid
      </text>

      {/* Credit Card Icon - Yellow, above "id" in "Aid" */}
      <g transform="translate(112, -4)">
        {/* Card body - rounded rectangle */}
        <rect
          x="0"
          y="2"
          width="18"
          height="12"
          rx="1.5"
          fill="#F5C700"
        />
        {/* Chip area - small rectangle on upper left */}
        <rect
          x="2"
          y="4"
          width="5"
          height="4"
          rx="0.5"
          fill="#414143"
        />
        {/* Card number lines */}
        <rect
          x="2"
          y="9"
          width="14"
          height="1.5"
          rx="0.5"
          fill="#414143"
        />
        <rect
          x="2"
          y="11.5"
          width="10"
          height="1.5"
          rx="0.5"
          fill="#414143"
        />
      </g>

      {/* Dash - Split purple/yellow */}
      <line
        x1="138"
        y1="20"
        x2="142"
        y2="20"
        stroke="#53328A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="142"
        y1="20"
        x2="146"
        y2="20"
        stroke="#F5C700"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* V - Deep Purple */}
      <text
        x="152"
        y="28"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fill="#53328A"
        letterSpacing="0"
      >
        V
      </text>

      {/* 3 - Bright Yellow */}
      <text
        x="172"
        y="28"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fill="#F5C700"
        letterSpacing="0"
      >
        3
      </text>
    </svg>
  )
}
