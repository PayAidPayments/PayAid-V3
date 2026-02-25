'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Sparkles,
  Plus,
  Upload,
  FileSpreadsheet,
  Brain,
  Wand2,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SHEET_TEMPLATES,
  getDefaultNameForTemplate,
  getTemplateById,
} from '@/lib/spreadsheet/templates'

const RECOMMENDED_TEMPLATE_IDS = ['gst-invoice-log', 'cashflow-planner', 'salary-sheet']

interface SheetItem {
  id: string
  name: string
  updatedAt: string
}

export default function SpreadsheetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const [recentSheets, setRecentSheets] = useState<SheetItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/spreadsheets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { spreadsheets: [] }))
      .then((data) => {
        const list = (data.spreadsheets || []).slice(0, 4)
        setRecentSheets(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const recommendedTemplates = RECOMMENDED_TEMPLATE_IDS.map((id) => getTemplateById(id)).filter(
    Boolean
  ) as typeof SHEET_TEMPLATES

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
      if (!res.ok) throw new Error('Failed to create')
      const sheet = await res.json()
      router.push(`/spreadsheet/${tenantId}/Spreadsheets/${sheet.id}`)
    } catch (e) {
      console.error(e)
      alert('Failed to create spreadsheet')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-teal-500 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-teal-200" />
                Smart Spreadsheets
              </h1>
              <p className="text-purple-100 text-lg mb-6 max-w-xl">
                AI-powered sheets with formulas, charts, and real-time collaboration
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/spreadsheet/${tenantId}/Spreadsheets/create`}>
                  <Button className="bg-white text-purple-600 hover:bg-purple-50 border-0 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    New Spreadsheet
                  </Button>
                </Link>
                <Link href={`/spreadsheet/${tenantId}/Spreadsheets`}>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload .xlsx / .csv
                  </Button>
                </Link>
                <Link href={`/spreadsheet/${tenantId}/Templates`}>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                  >
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-sm shrink-0">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-teal-200 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">AI Insight</h3>
                  <p className="text-sm text-purple-100">
                    {recentSheets.length === 0
                      ? 'Create your first spreadsheet or pick a template to start in seconds.'
                      : `You have ${recentSheets.length} recent spreadsheet${recentSheets.length === 1 ? '' : 's'}. Top category: Finance & GST.`}
                  </p>
                  <Link
                    href={`/spreadsheet/${tenantId}/Templates`}
                    className="text-xs text-teal-200 hover:text-teal-100 mt-2 inline-flex items-center gap-1"
                  >
                    Try a template →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Files */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Recent Spreadsheets
          </h2>
          <Link
            href={`/spreadsheet/${tenantId}/Spreadsheets`}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : recentSheets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSheets.map((sheet) => (
              <Link
                key={sheet.id}
                href={`/spreadsheet/${tenantId}/Spreadsheets/${sheet.id}`}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {sheet.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Updated {new Date(sheet.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-purple-500" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No spreadsheets yet. Create one or use a template to get started.
            </p>
            <Link href={`/spreadsheet/${tenantId}/Spreadsheets/create`}>
              <Button className="mt-4 rounded-xl" size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Spreadsheet
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Recommended Templates */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedTemplates.map((template) => (
            <div
              key={template.id}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md overflow-hidden flex flex-col"
            >
              <div className="p-4 flex-1">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
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
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Link
          href={`/spreadsheet/${tenantId}/Templates`}
          className="inline-block mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          View all templates →
        </Link>
      </section>

      {/* AI Suggestions */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8 pb-12">
        <div className="rounded-2xl p-6 border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-950/20 dark:to-teal-950/20">
          <div className="flex items-start gap-4">
            <Wand2 className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                AI can help you with
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/spreadsheet/${tenantId}/Templates`}
                  className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    Generate Q1 Sales Report
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    From Sales Pipeline template
                  </p>
                </Link>
                <Link
                  href={`/spreadsheet/${tenantId}/Templates`}
                  className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    Create Budget vs Actual
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    From P&L or Cashflow template
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
