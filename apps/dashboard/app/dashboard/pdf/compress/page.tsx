'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileDown, Download } from 'lucide-react'

export default function PDFCompressPage() {
  const [file, setFile] = useState<File | null>(null)
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setOriginalSize(selectedFile.size)
    }
  }

  const handleCompress = async () => {
    if (!file) {
      alert('Please select a PDF file')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('level', compressionLevel)

      const response = await fetch('/api/pdf/compress', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to compress PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setCompressedPdfUrl(url)
      setCompressedSize(blob.size)
    } catch (error) {
      console.error('Error compressing PDF:', error)
      alert('Failed to compress PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (compressedPdfUrl) {
      const a = document.createElement('a')
      a.href = compressedPdfUrl
      a.download = `compressed-${file?.name || 'file.pdf'}`
      a.click()
    }
  }

  const reductionPercentage = originalSize > 0
    ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
        <p className="mt-2 text-gray-600">
          Reduce PDF file size while maintaining quality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select PDF File</CardTitle>
          <CardDescription>
            Upload a PDF file to compress and reduce its size
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Select a PDF file to compress</p>
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
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {file && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compression Level</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="low"
                      checked={compressionLevel === 'low'}
                      onChange={(e) => setCompressionLevel(e.target.value as 'low')}
                    />
                    <span>Low (Better Quality)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="medium"
                      checked={compressionLevel === 'medium'}
                      onChange={(e) => setCompressionLevel(e.target.value as 'medium')}
                    />
                    <span>Medium (Balanced)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="high"
                      checked={compressionLevel === 'high'}
                      onChange={(e) => setCompressionLevel(e.target.value as 'high')}
                    />
                    <span>High (Smaller Size)</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Compress PDF
                  </>
                )}
              </Button>

              {compressedPdfUrl && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <p className="text-green-800 font-medium">PDF compressed successfully!</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Original Size:</p>
                      <p className="font-medium">{(originalSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Compressed Size:</p>
                      <p className="font-medium">{(compressedSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Size Reduction:</p>
                    <p className="font-medium text-green-600">{reductionPercentage}%</p>
                  </div>
                  <Button onClick={handleDownload} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Compressed PDF
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

