'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Always default to light mode (script already set it)
    if (typeof document !== 'undefined') {
      // Ensure dark class is removed (script should have done this, but double-check)
      document.documentElement.classList.remove('dark')
      // Force light mode
      setThemeState('light')
      localStorage.setItem('theme', 'light')
    } else {
      // SSR fallback - default to light
      setThemeState('light')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Only update DOM if theme actually changed (prevents flash)
    const root = document.documentElement
    const currentlyDark = root.classList.contains('dark')
    
    if (theme === 'dark' && !currentlyDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else if (theme === 'light' && currentlyDark) {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else if (theme === 'light' && !currentlyDark) {
      // Ensure localStorage is synced even if class is already correct
      localStorage.setItem('theme', 'light')
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

