'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Table,
  FileEdit,
  Presentation,
  Folder,
  Video,
  FileText,
  FileDown,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const TOOLS = [
  {
    slug: 'sheets',
    name: 'PayAid Sheets',
    description: 'Smart spreadsheets with formulas, charts, and collaboration',
    icon: Table,
    href: 'sheets',
    color: 'from-purple-500 to-teal-500',
    bgLight: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    slug: 'docs',
    name: 'PayAid Docs',
    description: 'Create and edit documents with rich text and formatting',
    icon: FileEdit,
    href: 'docs',
    color: 'from-blue-500 to-indigo-500',
    bgLight: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    slug: 'slides',
    name: 'PayAid Slides',
    description: 'Build and present slideshows with present mode',
    icon: Presentation,
    href: 'slides',
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    slug: 'drive',
    name: 'PayAid Drive',
    description: 'Store and organize files and folders',
    icon: Folder,
    href: 'drive',
    color: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    slug: 'meet',
    name: 'PayAid Meet',
    description: 'Start or join video meetings',
    icon: Video,
    href: 'meet',
    color: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    slug: 'pdf',
    name: 'PayAid PDF',
    description: 'View, create, merge, and split PDFs',
    icon: FileText,
    href: 'pdf',
    color: 'from-slate-500 to-slate-600',
    bgLight: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  {
    slug: 'builder',
    name: 'Document Builder',
    description: 'Generate invoices and proposals from CRM & Finance data',
    icon: FileDown,
    href: 'builder',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
] as const

export default function ProductivityHomePage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white">
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
                <Sparkles className="w-8 h-8 text-indigo-200" />
                Productivity
              </h1>
              <p className="text-purple-100 text-lg mb-6 max-w-xl">
                Choose a tool to get started: documents, spreadsheets, presentations, files, meetings, PDFs, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool cards */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          What would you like to do?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const url =
              tool.href === 'builder'
                ? `/productivity/${tenantId}/builder`
                : `/productivity/${tenantId}/${tool.href}`
            return (
              <Link
                key={tool.slug}
                href={url}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div
                    className={`w-12 h-12 rounded-xl ${tool.bgLight} flex items-center justify-center shrink-0 mb-3`}
                  >
                    <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 mt-3 group-hover:gap-2 transition-all">
                    Open <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
