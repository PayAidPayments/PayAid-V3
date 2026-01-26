'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, Paperclip, X } from 'lucide-react'

interface EmailComposeDialogProps {
  trigger?: React.ReactNode
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  contactId?: string
  dealId?: string
  onSent?: () => void
}

interface EmailAccount {
  id: string
  email: string
  displayName?: string
  provider?: string
  isOAuth?: boolean
  oAuthConnected?: boolean
}

export function EmailComposeDialog({
  trigger,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  contactId,
  dealId,
  onSent,
}: EmailComposeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [formData, setFormData] = useState({
    to: defaultTo,
    cc: '',
    bcc: '',
    subject: defaultSubject,
    body: defaultBody,
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const queryClient = useQueryClient()

  // Fetch email accounts
  const { data: accountsData } = useQuery<{ accounts: EmailAccount[] }>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const response = await apiRequest('/api/email/accounts')
      if (!response.ok) throw new Error('Failed to fetch email accounts')
      return response.json()
    },
  })

  const accounts = accountsData?.accounts || []
  const activeAccount = accounts.find((a) => a.isOAuth && a.oAuthConnected) || accounts[0]

  // Set default account when accounts load
  if (activeAccount && !selectedAccountId) {
    setSelectedAccountId(activeAccount.id)
  }

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId) {
        throw new Error('Please select an email account')
      }

      // Convert attachments to base64
      const attachmentPromises = attachments.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        return {
          content: base64,
          filename: file.name,
          type: file.type,
        }
      })

      const attachmentData = await Promise.all(attachmentPromises)

      const response = await apiRequest('/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          accountId: selectedAccountId,
          to: formData.to,
          cc: formData.cc || undefined,
          bcc: formData.bcc || undefined,
          subject: formData.subject,
          html: formData.body,
          contactId,
          dealId,
          attachments: attachmentData.length > 0 ? attachmentData : undefined,
          injectTracking: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['email-messages'] })
      setIsOpen(false)
      setFormData({ to: '', cc: '', bcc: '', subject: '', body: '' })
      setAttachments([])
      onSent?.()
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const defaultTrigger = (
    <Button>
      <Send className="mr-2 h-4 w-4" />
      Compose Email
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send an email from your connected account. All emails are automatically tracked and linked to contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Account Selection */}
          {accounts.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName || account.email}
                    {account.isOAuth && account.oAuthConnected && ' (OAuth)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* To */}
          <div>
            <label className="block text-sm font-medium mb-1">To *</label>
            <Input
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium mb-1">CC</label>
            <Input
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              placeholder="cc@example.com"
            />
          </div>

          {/* BCC */}
          <div>
            <label className="block text-sm font-medium mb-1">BCC</label>
            <Input
              value={formData.bcc}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
              placeholder="bcc@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: BCC crm@payaid.store to auto-log this email
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-1">Message *</label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Type your message here..."
              rows={10}
              required
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              HTML is supported. Tracking pixel and links will be automatically added.
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Add Attachment
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {sendEmailMutation.isError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {sendEmailMutation.error instanceof Error
                ? sendEmailMutation.error.message
                : 'Failed to send email'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !formData.to || !formData.subject || !formData.body}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
