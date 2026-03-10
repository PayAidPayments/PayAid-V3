'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import {
  FileSpreadsheet,
  Search,
  Plus,
  LayoutGrid,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SHEET_TEMPLATES,
  getDefaultNameForTemplate,
  getTemplateById,
  getCategoryLabel,
  type TemplateCategory,
  type SheetTemplate,
} from '@/lib/spreadsheet/templates'

const CATEGORY_ORDER: TemplateCategory[] = [
  'recommended',
  'finance',
  'sales',
  'hr',
  'operations',
  'analytics',
  'personal',
]

export default function SpreadsheetTemplatesPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return SHEET_TEMPLATES
    const q = searchQuery.toLowerCase().trim()
    return SHEET_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const byCategory = useMemo(() => {
    const map = new Map<TemplateCategory, SheetTemplate[]>()
    for (const cat of CATEGORY_ORDER) {
      const inCat = filteredTemplates.filter((t) => t.category === cat)
      if (inCat.length) map.set(cat, inCat)
    }
    return map
  }, [filteredTemplates])

  const handleUseTemplate = async (templateId: string) => {
    const template = getTemplateById(templateId)
    if (!template || !token) return
    const name = getDefaultNameForTemplate(template)
    try {
      const res = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, data: template.data }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create spreadsheet')
      }
      const sheet = await res.json()
      router.push(`/spreadsheet/${tenantId}/Spreadsheets/${sheet.id}`)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to create spreadsheet')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-8 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Templates
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Start from a template – GST, payroll, P&L, cashflow, and more.
              </p>
            </div>
            <Link href={`/spreadsheet/${tenantId}/Spreadsheets/create`}>
              <Button size="sm" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Blank spreadsheet
              </Button>
            </Link>
          </div>
          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-10">
        {byCategory.size === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No templates match &quot;{searchQuery}&quot;. Try a different search.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          </div>
        ) : (
          Array.from(byCategory.entries()).map(([category, templates]) => (
            <section key={category}>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                {category === 'recommended' && (
                  <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                )}
                {getCategoryLabel(category)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all p-4 flex flex-col"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white mt-3"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      Use template
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
