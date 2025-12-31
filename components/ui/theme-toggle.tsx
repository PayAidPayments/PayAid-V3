'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("relative", className)}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className={cn(
        "h-5 w-5 transition-all",
        theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )} />
      <Moon className={cn(
        "absolute h-5 w-5 transition-all",
        theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

