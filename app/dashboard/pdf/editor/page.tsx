'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Save } from 'lucide-react'

export default function PDFEditorPage() {
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

  const handleSave = async () => {
    // PDF editing functionality would be implemented here
    // This would require a PDF editing library like PDF-lib or similar
    alert('PDF editing functionality will be implemented with PDF editing library')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PDF Editor</h1>
        <p className="mt-2 text-gray-600">
          Edit text, fill forms, and modify PDF content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit PDF File</CardTitle>
          <CardDescription>
            Upload a PDF file to edit text and fill forms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pdfUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Select a PDF file to edit</p>
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{file?.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
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
              </div>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px]"
                  title="PDF Editor"
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Full PDF editing functionality (text editing, form filling) 
                  will be implemented with a PDF editing library. Currently, you can view the PDF.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

