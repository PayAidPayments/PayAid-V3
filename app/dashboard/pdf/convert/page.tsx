'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, RefreshCw, Download } from 'lucide-react'

export default function PDFConvertPage() {
  const [file, setFile] = useState<File | null>(null)
  const [convertTo, setConvertTo] = useState<'word' | 'excel' | 'image' | 'html'>('word')
  const [isProcessing, setIsProcessing] = useState(false)
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

  const handleConvert = async () => {
    if (!file) {
      alert('Please select a PDF file')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', convertTo)

      const response = await fetch('/api/pdf/convert', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to convert PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setConvertedFileUrl(url)
    } catch (error) {
      console.error('Error converting PDF:', error)
      alert('Failed to convert PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (convertedFileUrl) {
      const a = document.createElement('a')
      const extension = convertTo === 'word' ? 'docx' : convertTo === 'excel' ? 'xlsx' : convertTo === 'image' ? 'zip' : 'html'
      a.href = convertedFileUrl
      a.download = `${file?.name.replace('.pdf', '') || 'converted'}.${extension}`
      a.click()
    }
  }

  const formatOptions = [
    { value: 'word', label: 'Word Document (.docx)' },
    { value: 'excel', label: 'Excel Spreadsheet (.xlsx)' },
    { value: 'image', label: 'Images (.png/.jpg)' },
    { value: 'html', label: 'HTML Web Page' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Convert PDF</h1>
        <p className="mt-2 text-gray-600">
          Convert PDF to Word, Excel, Images, or HTML
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select PDF File</CardTitle>
          <CardDescription>
            Upload a PDF file to convert to another format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Select a PDF file to convert</p>
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
                <label className="text-sm font-medium">Convert To</label>
                <div className="grid grid-cols-2 gap-4">
                  {formatOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        convertTo === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={convertTo === option.value}
                        onChange={(e) => setConvertTo(e.target.value as any)}
                        className="hidden"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert PDF
                  </>
                )}
              </Button>

              {convertedFileUrl && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 mb-2">PDF converted successfully!</p>
                  <Button onClick={handleDownload} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Converted File
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

