'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Merge, Scissors, Archive, RefreshCw, Upload, Download } from 'lucide-react'

export default function PDFToolsPage() {
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools')

  const pdfTools = [
    {
      id: 'reader',
      name: 'PDF Reader',
      description: 'View, annotate, and highlight PDF documents',
      icon: FileText,
      color: 'bg-blue-500',
      href: '/dashboard/pdf/reader'
    },
    {
      id: 'editor',
      name: 'PDF Editor',
      description: 'Edit text, fill forms, and modify PDF content',
      icon: FileText,
      color: 'bg-green-500',
      href: '/dashboard/pdf/editor'
    },
    {
      id: 'merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDF files into one',
      icon: Merge,
      color: 'bg-purple-500',
      href: '/dashboard/pdf/merge'
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Extract pages or split PDF by pages',
      icon: Scissors,
      color: 'bg-orange-500',
      href: '/dashboard/pdf/split'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: Archive,
      color: 'bg-red-500',
      href: '/dashboard/pdf/compress'
    },
    {
      id: 'convert',
      name: 'Convert PDF',
      description: 'Convert PDF to Word, Excel, Images, or HTML',
      icon: RefreshCw,
      color: 'bg-indigo-500',
      href: '/dashboard/pdf/convert'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PDF Tools</h1>
        <p className="mt-2 text-gray-600">
          Complete PDF solution - Read, edit, merge, split, compress, and convert PDFs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tools'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tools
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'files'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My PDFs
        </button>
      </div>

      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card
                key={tool.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.location.href = tool.href}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${tool.color} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'files' && (
        <Card>
          <CardHeader>
            <CardTitle>My PDF Files</CardTitle>
            <CardDescription>Manage your PDF documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No PDF files yet</p>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

