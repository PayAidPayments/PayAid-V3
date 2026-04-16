/**
 * Form Embed Component
 * Displays embed code and preview for forms
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy } from 'lucide-react'
import { CopyAction, COPY_ACTION_PRESETS } from '@/components/ui/copy-action'

interface FormEmbedProps {
  formSlug: string
  formName: string
}

export function FormEmbed({ formSlug, formName }: FormEmbedProps) {
  const embedCode = `<script src="https://your-domain.com/forms/${formSlug}/embed.js"></script>`
  const iframeCode = `<iframe src="https://your-domain.com/forms/${formSlug}/embed" width="100%" height="600" frameborder="0"></iframe>`
  const directUrl = `https://your-domain.com/forms/${formSlug}`

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
              <CopyAction
                textToCopy={embedCode}
                successMessage="JavaScript embed code copied to clipboard."
                label="Copy"
                copiedLabel="Copied"
                icon={<Copy className="h-4 w-4" />}
                buttonProps={{ variant: 'outline', size: 'sm' }}
                {...COPY_ACTION_PRESETS.compactSettings}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">iFrame Embed</Label>
            <div className="flex gap-2">
              <Input value={iframeCode} readOnly className="font-mono text-sm" />
              <CopyAction
                textToCopy={iframeCode}
                successMessage="Iframe embed code copied to clipboard."
                label="Copy"
                copiedLabel="Copied"
                icon={<Copy className="h-4 w-4" />}
                buttonProps={{ variant: 'outline', size: 'sm' }}
                {...COPY_ACTION_PRESETS.compactSettings}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Direct URL</Label>
            <div className="flex gap-2">
              <Input value={directUrl} readOnly className="font-mono text-sm" />
              <CopyAction
                textToCopy={directUrl}
                successMessage="Direct URL copied to clipboard."
                label="Copy"
                copiedLabel="Copied"
                icon={<Copy className="h-4 w-4" />}
                buttonProps={{ variant: 'outline', size: 'sm' }}
                {...COPY_ACTION_PRESETS.compactSettings}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
