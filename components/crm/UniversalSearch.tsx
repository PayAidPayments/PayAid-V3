'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Briefcase, CheckSquare, Mail, Phone, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth'

interface SearchResult {
  id: string
  type: 'contact' | 'deal' | 'task' | 'email' | 'call' | 'quote'
  title: string
  subtitle?: string
  icon: React.ReactNode
  url: string
}

interface UniversalSearchProps {
  tenantId: string
  isOpen: boolean
  onClose: () => void
}

export function UniversalSearch({ tenantId, isOpen, onClose }: UniversalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { token } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchData = async () => {
      setLoading(true)
      try {
        // Search contacts
        const contactsRes = await fetch(`/api/crm/contacts?search=${encodeURIComponent(query)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const contactsData = await contactsRes.json()
        const contacts: SearchResult[] = (contactsData.contacts || []).map((c: any) => ({
          id: c.id,
          type: 'contact' as const,
          title: c.name || c.email,
          subtitle: c.company,
          icon: <User className="w-4 h-4" />,
          url: `/crm/${tenantId}/AllPeople?contactId=${c.id}`,
        }))

        // Search deals
        const dealsRes = await fetch(`/api/crm/deals?search=${encodeURIComponent(query)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const dealsData = await dealsRes.json()
        const deals: SearchResult[] = (dealsData.deals || []).map((d: any) => ({
          id: d.id,
          type: 'deal' as const,
          title: d.name,
          subtitle: `₹${d.value?.toLocaleString('en-IN') || 0}`,
          icon: <Briefcase className="w-4 h-4" />,
          url: `/crm/${tenantId}/Deals/${d.id}`,
        }))

        // Search tasks
        const tasksRes = await fetch(`/api/crm/tasks?search=${encodeURIComponent(query)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const tasksData = await tasksRes.json()
        const tasks: SearchResult[] = (tasksData.tasks || []).map((t: any) => ({
          id: t.id,
          type: 'task' as const,
          title: t.title,
          subtitle: t.contact?.name,
          icon: <CheckSquare className="w-4 h-4" />,
          url: `/crm/${tenantId}/Tasks?taskId=${t.id}`,
        }))

        setResults([...contacts, ...deals, ...tasks])
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchData, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, tenantId, token])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          router.push(results[selectedIndex].url)
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, router, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Search contacts, deals, tasks..."
              className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.url)
                      onClose()
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      idx === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-gray-600 dark:text-gray-400">{result.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">{result.type}</div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="px-4 py-8 text-center text-gray-500">No results found</div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                Start typing to search...
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
