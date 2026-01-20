'use client'

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
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Let the anchor tag navigate naturally - don't prevent default
  }

  // Use image if available
  if (logoImageUrl) {
    return (
      <a href={href} className={`flex items-center space-x-2 ${className} cursor-pointer`} onClick={handleClick}>
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
      </a>
    )
  }
  
  // Use text variant if specified or as fallback
  if (variant === 'text') {
    return (
      <a href={href} className={`flex items-center space-x-2 ${className} cursor-pointer`} onClick={handleClick}>
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
      </a>
    )
  }
  
  // Default to SVG
  return (
    <a href={href} className={`flex items-center space-x-2 ${className} cursor-pointer`} onClick={handleClick}>
      <PayAidLogo height={height} />
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          V3
        </span>
      )}
    </a>
  )
}

