'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EmailMessage {
  id: string
  fromEmail: string
  fromName?: string
  toEmails: string[]
  subject: string
  body?: string
  htmlBody?: string
  isRead: boolean
  isStarred: boolean
  receivedAt: string
  folder: {
    id: string
    name: string
    type: string
  }
}

export default function WebMailPage() {
  const queryClient = useQueryClient()
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: '',
  })

  // Get email accounts
  const { data: accountsData } = useQuery<{ accounts: any[] }>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const response = await apiRequest('/api/email/accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      return response.json()
    },
  })

  const accounts = accountsData?.accounts || []
  const currentAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : accounts[0]

  // Get folders
  const { data: foldersData } = useQuery<{ folders: any[] }>({
    queryKey: ['email-folders', currentAccount?.id],
    queryFn: async () => {
      if (!currentAccount?.id) return { folders: [] }
      const response = await apiRequest(`/api/email/folders?accountId=${currentAccount.id}`)
      if (!response.ok) throw new Error('Failed to fetch folders')
      return response.json()
    },
    enabled: !!currentAccount?.id,
  })

  const folders = foldersData?.folders || []
  const currentFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)
    : folders.find((f) => f.type === 'inbox')

  // Get messages
  const { data: messagesData } = useQuery<{ messages: EmailMessage[] }>({
    queryKey: ['email-messages', currentAccount?.id, currentFolder?.id],
    queryFn: async () => {
      if (!currentAccount?.id || !currentFolder?.id) return { messages: [] }
      const response = await apiRequest(
        `/api/email/messages?accountId=${currentAccount.id}&folderId=${currentFolder.id}`
      )
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    enabled: !!currentAccount?.id && !!currentFolder?.id,
  })

  const messages = messagesData?.messages || []

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof composeData) => {
      if (!currentAccount?.id) throw new Error('No account selected')
      const response = await apiRequest('/api/email/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          accountId: currentAccount.id,
          to: data.to.split(',').map((e) => e.trim()),
          cc: data.cc ? data.cc.split(',').map((e) => e.trim()) : undefined,
          subject: data.subject,
          body: data.body,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] })
      setShowCompose(false)
      setComposeData({ to: '', cc: '', subject: '', body: '' })
    },
  })

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Web Mail</h1>
          <p className="mt-2 text-gray-600">Access your email from anywhere</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No email accounts found</p>
            <p className="text-sm mt-2">Create an email account first</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Web Mail</h1>
          <p className="mt-2 text-gray-600">Access and manage your emails</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>Compose</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{folder.name}</span>
                    {folder._count?.messages > 0 && (
                      <span className="text-xs text-gray-500">
                        {folder._count.messages}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Area - Messages */}
        <div className="lg:col-span-2">
          {showCompose ? (
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendEmailMutation.mutate(composeData)
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">To *</label>
                    <Input
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                      placeholder="recipient@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CC</label>
                    <Input
                      value={composeData.cc}
                      onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject *</label>
                    <Input
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      placeholder="Email subject"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message *</label>
                    <textarea
                      value={composeData.body}
                      onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md min-h-[200px]"
                      placeholder="Type your message here..."
                      required
                    />
                  </div>
                  {sendEmailMutation.isError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {sendEmailMutation.error instanceof Error
                        ? sendEmailMutation.error.message
                        : 'Failed to send email'}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={sendEmailMutation.isPending}>
                      {sendEmailMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCompose(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentFolder?.name || 'Inbox'} ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No messages in this folder</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50 border-gray-200'
                        } ${!message.isRead ? 'bg-white font-medium' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {message.fromName || message.fromEmail}
                              </span>
                              {message.isStarred && <span>⭐</span>}
                            </div>
                            <p className="text-sm text-gray-900 mb-1">{message.subject}</p>
                            {message.body && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {message.body.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 ml-4">
                            {new Date(message.receivedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Message View */}
        {selectedMessage && !showCompose && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-medium">
                    {selectedMessage.fromName || selectedMessage.fromEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-medium">{selectedMessage.toEmails.join(', ')}</p>
                </div>
                <div className="pt-4 border-t">
                  {selectedMessage.htmlBody ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                      className="prose prose-sm max-w-none"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                  )}
                </div>
                <div className="pt-4 border-t text-xs text-gray-500">
                  Received: {new Date(selectedMessage.receivedAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
