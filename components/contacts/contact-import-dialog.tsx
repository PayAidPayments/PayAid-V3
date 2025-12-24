'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/auth'
import { useQuery } from '@tanstack/react-query'

interface ContactImportDialogProps {
  onClose: () => void
  onSuccess: () => void
}

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function ContactImportDialog({ onClose, onSuccess }: ContactImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [additionalTags, setAdditionalTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch segments
  const { data: segmentsData } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await fetch('/api/marketing/segments', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch segments')
      return response.json()
    },
  })

  const segments = segmentsData?.segments || []

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase()
      if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        setFile(selectedFile)
        setUploadResult(null)
      } else {
        alert('Please select a CSV or XLSX file')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedSegments.length > 0) {
        formData.append('segmentIds', selectedSegments.join(','))
      }
      if (additionalTags.trim()) {
        formData.append('tags', additionalTags.trim())
      }

      const { token } = useAuthStore.getState()
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          ...result,
        })
        if (result.imported > 0) {
          // Auto-close after 3 seconds if successful
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 3000)
        }
      } else {
        setUploadResult({
          success: false,
          error: result.error || 'Failed to import contacts',
          details: result.details,
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <CardTitle>Import Contacts</CardTitle>
          <CardDescription>
            Upload a CSV or XLSX file to import contacts and tag them to segments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File (CSV or XLSX)
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span> (
                {(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* File Format Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Expected File Format</h4>
            <p className="text-xs text-blue-800 mb-2">
              Your file should have a header row with columns (case-insensitive):
            </p>
            <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
              <li>
                <strong>Required:</strong> name (or &quot;Contact Name&quot;, &quot;Full Name&quot;)
              </li>
              <li>
                <strong>Optional:</strong> email, phone, company, type, status, source, address,
                city, state, postalCode, country, tags, notes
              </li>
            </ul>
          </div>

          {/* Segment Selection */}
          {segments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag to Segments (Optional)
              </label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {segments.length === 0 ? (
                  <p className="text-sm text-gray-500">No segments available</p>
                ) : (
                  <div className="space-y-2">
                    {segments.map((segment: any) => (
                      <label
                        key={segment.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSegments.includes(segment.id)}
                          onChange={() => toggleSegment(segment.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {segment.name}
                          {segment.contactCount !== undefined && (
                            <span className="text-gray-500 ml-2">
                              ({segment.contactCount} contacts)
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Tags (Optional)
            </label>
            <input
              type="text"
              value={additionalTags}
              onChange={(e) => setAdditionalTags(e.target.value)}
              placeholder="e.g., imported, newsletter, vip (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              These tags will be added to all imported contacts
            </p>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={`p-4 rounded-md ${
                uploadResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {uploadResult.success ? (
                <div>
                  <h4 className="font-medium text-green-900 mb-2">✅ Import Successful!</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>Imported: {uploadResult.imported} contacts</li>
                    {uploadResult.skipped > 0 && (
                      <li>Skipped (duplicates): {uploadResult.skipped} rows</li>
                    )}
                    {uploadResult.errors > 0 && (
                      <li className="text-orange-700">
                        Errors: {uploadResult.errors} rows (see details below)
                      </li>
                    )}
                    <li>Total rows processed: {uploadResult.totalRows}</li>
                  </ul>
                  {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-orange-800 mb-1">Error Details:</p>
                      <ul className="text-xs text-orange-700 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {uploadResult.errorDetails.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-green-700 mt-2">
                    This dialog will close automatically in a few seconds...
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">❌ Import Failed</h4>
                  <p className="text-sm text-red-800">{uploadResult.error}</p>
                  {uploadResult.details && (
                    <p className="text-xs text-red-700 mt-1">{uploadResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isUploading ? 'Uploading...' : 'Import Contacts'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
