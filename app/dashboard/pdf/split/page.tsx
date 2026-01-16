'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Scissors, Download } from 'lucide-react'

export default function PDFSplitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [splitMode, setSplitMode] = useState<'pages' | 'range'>('pages')
  const [pageNumbers, setPageNumbers] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [splitPdfs, setSplitPdfs] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

  const handleSplit = async () => {
    if (!file) {
      alert('Please select a PDF file')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', splitMode)
      formData.append('pages', pageNumbers)

      const response = await fetch('/api/pdf/split', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to split PDF')

      const data = await response.json()
      setSplitPdfs(data.urls || [])
    } catch (error) {
      console.error('Error splitting PDF:', error)
      alert('Failed to split PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Split PDF</h1>
        <p className="mt-2 text-gray-600">
          Extract pages or split PDF by page ranges
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select PDF File</CardTitle>
          <CardDescription>
            Upload a PDF file to split into multiple files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Select a PDF file to split</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button as="span" variant="outline">
                Select PDF File
              </Button>
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-600">{file.name}</p>
            )}
          </div>

          {file && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Split Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="pages"
                      checked={splitMode === 'pages'}
                      onChange={(e) => setSplitMode(e.target.value as 'pages')}
                    />
                    <span>Split by Pages (e.g., 1,3,5-10)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="range"
                      checked={splitMode === 'range'}
                      onChange={(e) => setSplitMode(e.target.value as 'range')}
                    />
                    <span>Split by Range (e.g., 1-5, 6-10)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {splitMode === 'pages' ? 'Page Numbers' : 'Page Ranges'}
                </label>
                <Input
                  value={pageNumbers}
                  onChange={(e) => setPageNumbers(e.target.value)}
                  placeholder={splitMode === 'pages' ? '1,3,5-10' : '1-5,6-10'}
                />
                <p className="text-xs text-gray-500">
                  {splitMode === 'pages'
                    ? 'Enter page numbers separated by commas, or ranges like 5-10'
                    : 'Enter page ranges separated by commas (e.g., 1-5, 6-10)'}
                </p>
              </div>

              <Button
                onClick={handleSplit}
                disabled={!pageNumbers || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    Split PDF
                  </>
                )}
              </Button>

              {splitPdfs.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 mb-2">
                    PDF split successfully! ({splitPdfs.length} files created)
                  </p>
                  <div className="space-y-2">
                    {splitPdfs.map((url, index) => (
                      <Button
                        key={index}
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `split-${index + 1}.pdf`
                          a.click()
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Part {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

