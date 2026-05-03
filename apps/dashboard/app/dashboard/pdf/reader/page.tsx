'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Download } from 'lucide-react'

export default function PDFReaderPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPdfUrl(url)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PDF Reader</h1>
        <p className="mt-2 text-gray-600">
          View, annotate, and highlight PDF documents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open PDF File</CardTitle>
          <CardDescription>
            Upload a PDF file to view and annotate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pdfUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Select a PDF file to open</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button type="button" variant="outline">
                  Select PDF File
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{file?.name}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPdfUrl(null)
                  }}
                >
                  Close
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px]"
                  title="PDF Viewer"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

