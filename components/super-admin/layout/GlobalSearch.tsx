'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Building2, Users, CreditCard, FileText, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

interface SearchResult {
  type: 'tenant' | 'user' | 'invoice' | 'contact' | 'transaction'
  id: string
  title: string
  subtitle?: string
  href: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const searchDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/super-admin/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchDebounce)
  }, [query])

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'tenant':
        return Building2
      case 'user':
        return Users
      case 'invoice':
        return CreditCard
      case 'contact':
        return Users
      case 'transaction':
        return CreditCard
      default:
        return FileText
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative flex-1 max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search merchants, users, transactions... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => {
                const Icon = getIcon(result.type)
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">
                      {result.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
