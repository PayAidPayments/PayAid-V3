'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Code, Plus, X } from 'lucide-react'

interface EmailTemplateEditorProps {
  htmlContent: string
  textContent?: string
  subject: string
  variables?: string[]
  onHtmlChange: (html: string) => void
  onTextChange?: (text: string) => void
  onSubjectChange: (subject: string) => void
  onVariablesChange?: (variables: string[]) => void
}

export function EmailTemplateEditor({
  htmlContent,
  textContent = '',
  subject,
  variables = [],
  onHtmlChange,
  onTextChange,
  onSubjectChange,
  onVariablesChange,
}: EmailTemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split')
  const [newVariable, setNewVariable] = useState('')
  const [previewData, setPreviewData] = useState<Record<string, string>>({})

  // Auto-detect variables from content
  useEffect(() => {
    const detectedVars = new Set<string>()
    const regex = /\{\{(\w+)\}\}/g
    let match

    // Check HTML content
    while ((match = regex.exec(htmlContent)) !== null) {
      detectedVars.add(match[1])
    }

    // Check subject
    while ((match = regex.exec(subject)) !== null) {
      detectedVars.add(match[1])
    }

    // Check text content
    if (textContent) {
      while ((match = regex.exec(textContent)) !== null) {
        detectedVars.add(match[1])
      }
    }

    if (onVariablesChange && detectedVars.size > 0) {
      const newVars = Array.from(detectedVars)
      if (JSON.stringify(newVars.sort()) !== JSON.stringify([...variables].sort())) {
        onVariablesChange(newVars)
      }
    }
  }, [htmlContent, subject, textContent])

  // Initialize preview data with sample values
  useEffect(() => {
    const sampleData: Record<string, string> = {}
    variables.forEach((varName) => {
      if (!previewData[varName]) {
        sampleData[varName] = `Sample ${varName}`
      }
    })
    if (Object.keys(sampleData).length > 0) {
      setPreviewData((prev) => ({ ...prev, ...sampleData }))
    }
  }, [variables])

  const insertVariable = (variableName: string, target: 'html' | 'text' | 'subject' = 'html') => {
    const varString = `{{${variableName}}}`
    if (target === 'html') {
      const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = htmlContent.substring(0, start) + varString + htmlContent.substring(end)
        onHtmlChange(newContent)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + varString.length, start + varString.length)
        }, 0)
      }
    } else if (target === 'text' && onTextChange) {
      const textarea = document.getElementById('textContent') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = (textContent || '').substring(0, start) + varString + (textContent || '').substring(end)
        onTextChange(newContent)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + varString.length, start + varString.length)
        }, 0)
      }
    } else if (target === 'subject') {
      const input = document.getElementById('subject') as HTMLInputElement
      if (input) {
        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const newSubject = subject.substring(0, start) + varString + subject.substring(end)
        onSubjectChange(newSubject)
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(start + varString.length, start + varString.length)
        }, 0)
      }
    }
  }

  const addVariable = () => {
    const varName = newVariable.trim().replace(/[{}]/g, '')
    if (varName && !variables.includes(varName) && onVariablesChange) {
      onVariablesChange([...variables, varName])
      setNewVariable('')
    }
  }

  const removeVariable = (varName: string) => {
    if (onVariablesChange) {
      onVariablesChange(variables.filter((v) => v !== varName))
    }
  }

  const renderPreview = (content: string) => {
    let rendered = content
    variables.forEach((varName) => {
      const value = previewData[varName] || `{{${varName}}}`
      rendered = rendered.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value)
    })
    return rendered
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            Split View
          </Button>
          <Button
            type="button"
            variant={viewMode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('code')}
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </Button>
          <Button
            type="button"
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Variables Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="Variable name (e.g., firstName)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVariable()
                  }
                }}
              />
              <Button type="button" onClick={addVariable} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {variables.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((varName) => (
                    <div
                      key={varName}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      <span>{`{{${varName}}}`}</span>
                      <button
                        type="button"
                        onClick={() => removeVariable(varName)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variables.map((varName) => (
                    <Button
                      key={varName}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(varName, 'html')}
                    >
                      Insert in HTML
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor/Preview Area */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTML Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">HTML Content</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="htmlContent"
                value={htmlContent}
                onChange={(e) => onHtmlChange(e.target.value)}
                rows={20}
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder="<html>...</html>"
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div
                  dangerouslySetInnerHTML={{ __html: renderPreview(htmlContent) }}
                  className="email-preview"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Preview Data:</p>
                {variables.map((varName) => (
                  <div key={varName} className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-24">{varName}:</label>
                    <Input
                      value={previewData[varName] || ''}
                      onChange={(e) =>
                        setPreviewData((prev) => ({ ...prev, [varName]: e.target.value }))
                      }
                      placeholder={`Sample ${varName}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'code' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">HTML Code</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="htmlContent"
              value={htmlContent}
              onChange={(e) => onHtmlChange(e.target.value)}
              rows={30}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="<html>...</html>"
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Subject:</p>
                <div className="p-3 bg-gray-50 rounded border">
                  {renderPreview(subject)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">HTML Content:</p>
                <div className="border border-gray-200 rounded p-4 bg-white">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderPreview(htmlContent) }}
                    className="email-preview"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Preview Data:</p>
                {variables.map((varName) => (
                  <div key={varName} className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-24">{varName}:</label>
                    <Input
                      value={previewData[varName] || ''}
                      onChange={(e) =>
                        setPreviewData((prev) => ({ ...prev, [varName]: e.target.value }))
                      }
                      placeholder={`Sample ${varName}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plain Text Content */}
      {onTextChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plain Text Content (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="textContent"
              value={textContent}
              onChange={(e) => onTextChange(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Plain text version of the email..."
            />
            {variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {variables.map((varName) => (
                  <Button
                    key={varName}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(varName, 'text')}
                  >
                    Insert {`{{${varName}}}`}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

