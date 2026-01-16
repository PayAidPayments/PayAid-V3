'use client'

import Link from 'next/link'
import { PayAidLogo } from './PayAidLogo'
import { brandConfig } from '@/lib/config/brand'

interface LogoProps {
  href?: string
  className?: string
  showText?: boolean
  height?: number | string
  variant?: 'svg' | 'text' | 'auto'
}

export function Logo({ 
  href = '/home', 
  className = '', 
  showText = false, 
  height = 32,
  variant = 'auto'
}: LogoProps) {
  // Check if logo image URL is configured
  const logoImageUrl = brandConfig.logo.imageUrl
  
  // Use image if available
  if (logoImageUrl) {
    return (
      <Link href={href} className={`flex items-center space-x-2 ${className}`}>
        <PayAidLogo 
          height={height} 
          useImage={true}
          imageUrl={logoImageUrl}
        />
        {showText && (
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            V3
          </span>
        )}
      </Link>
    )
  }
  
  // Use text variant if specified or as fallback
  if (variant === 'text') {
    return (
      <Link href={href} className={`flex items-center space-x-2 ${className}`}>
        <span className="text-2xl font-bold">
          <span className="text-[#53328A]">Pay</span>
          <span className="text-[#F5C700]">Aid</span>
          <span className="text-[#53328A]">-</span>
          <span className="text-[#53328A]">V</span>
          <span className="text-[#F5C700]">3</span>
        </span>
        {showText && (
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            V3
          </span>
        )}
      </Link>
    )
  }
  
  // Default to SVG
  return (
    <Link href={href} className={`flex items-center space-x-2 ${className}`}>
      <PayAidLogo height={height} />
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          V3
        </span>
      )}
    </Link>
  )
}

