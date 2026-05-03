'use client'

import { cn } from '@/lib/utils/cn'
import { getModuleIconConfig } from '@/lib/config/module-icons'

const ICON_SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

const INNER_ICON_SIZE = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

type AppIconSize = keyof typeof ICON_SIZE

interface AppIconProps {
  moduleId: string
  size?: AppIconSize
  className?: string
}

/** Rounded-square app badge (App Store / Play Store style). One symbol, strong contrast. */
export function AppIcon({ moduleId, size = 'md', className }: AppIconProps) {
  const config = getModuleIconConfig(moduleId)
  const { Icon, bgFrom, bgTo } = config
  const isRupee = moduleId === 'finance'

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-2xl shadow-sm bg-gradient-to-br',
        bgFrom,
        bgTo,
        ICON_SIZE[size],
        className
      )}
    >
      {isRupee ? (
        <span className={cn('font-bold text-white', INNER_ICON_SIZE[size])} style={{ lineHeight: 1 }}>₹</span>
      ) : (
        <Icon className={cn('text-white', INNER_ICON_SIZE[size])} strokeWidth={2.5} />
      )}
    </div>
  )
}
