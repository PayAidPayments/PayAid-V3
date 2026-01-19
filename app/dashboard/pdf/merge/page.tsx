'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Merge, Download } from 'lucide-react'

export default function PDFMergePage() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf')
    setFiles(prev => [...prev, ...pdfFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })

      const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to merge PDFs')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setMergedPdfUrl(url)
    } catch (error) {
      console.error('Error merging PDFs:', error)
      alert('Failed to merge PDFs. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (mergedPdfUrl) {
      const a = document.createElement('a')
      a.href = mergedPdfUrl
      a.download = 'merged.pdf'
      a.click()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Merge PDFs</h1>
        <p className="mt-2 text-gray-600">
          Combine multiple PDF files into one document
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select PDF Files</CardTitle>
          <CardDescription>
            Upload 2 or more PDF files to merge them in order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Drag and drop PDF files here, or click to select</p>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button type="button" variant="outline">
                Select PDF Files
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Selected Files ({files.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Merge className="w-4 h-4 mr-2" />
                Merge PDFs
              </>
            )}
          </Button>

          {mergedPdfUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 mb-2">PDFs merged successfully!</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Merged PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

