/**
 * Form Embed Component
 * Displays embed code and preview for forms
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check } from 'lucide-react'

interface FormEmbedProps {
  formSlug: string
  formName: string
}

export function FormEmbed({ formSlug, formName }: FormEmbedProps) {
  const [copied, setCopied] = useState(false)

  const embedCode = `<script src="https://your-domain.com/forms/${formSlug}/embed.js"></script>`
  const iframeCode = `<iframe src="https://your-domain.com/forms/${formSlug}/embed" width="100%" height="600" frameborder="0"></iframe>`
  const directUrl = `https://your-domain.com/forms/${formSlug}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Embed Form</CardTitle>
          <CardDescription>Copy and paste this code to embed the form on your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">JavaScript Embed (Recommended)</Label>
            <div className="flex gap-2">
              <Input value={embedCode} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(embedCode)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">iFrame Embed</Label>
            <div className="flex gap-2">
              <Input value={iframeCode} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(iframeCode)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Direct URL</Label>
            <div className="flex gap-2">
              <Input value={directUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(directUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
