import { ModuleGate } from '@/components/modules/ModuleGate'
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatChannel {
  id: string
  name: string
  description?: string
  isPrivate: boolean
  topic?: string
  purpose?: string
  _count?: {
    messages: number
  }
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    displayName: string
    avatar?: string
    user: {
      id: string
      name?: string
      email: string
      avatar?: string
    }
  }
  attachments: any[]
  reactions: any[]
}

function ChatPage() {
  const queryClient = useQueryClient()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  // Get workspace
  const { data: workspaceData } = useQuery<{ workspace: any }>({
    queryKey: ['chat-workspace'],
    queryFn: async () => {
      const response = await apiRequest('/api/chat/workspaces')
      if (!response.ok) throw new Error('Failed to fetch workspace')
      return response.json()
    },
  })

  const workspace = workspaceData?.workspace
  const channels = workspace?.channels || []

  // Get messages for selected channel
  const { data: messagesData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['chat-messages', selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return { messages: [] }
      const response = await apiRequest(`/api/chat/channels/${selectedChannelId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
    enabled: !!selectedChannelId,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const messages = messagesData?.messages || []
  const selectedChannel = channels.find((c: ChatChannel) => c.id === selectedChannelId)

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedChannelId) throw new Error('No channel selected')
      const response = await apiRequest(`/api/chat/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
      setMessageContent('')
    },
  })

  const createChannelMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('/api/chat/channels', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create channel')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-workspace'] })
      setSelectedChannelId(data.id)
      setShowCreateChannel(false)
      setNewChannelName('')
    },
  })

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id)
    }
  }, [channels, selectedChannelId])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageContent.trim() && selectedChannelId) {
      sendMessageMutation.mutate(messageContent.trim())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Chat</h1>
          <p className="mt-2 text-gray-600">
            Communicate with your team in real-time
          </p>
        </div>
        <Button onClick={() => setShowCreateChannel(true)}>Create Channel</Button>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newChannelName.trim()) {
                  createChannelMutation.mutate(newChannelName.trim())
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Channel Name *</label>
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., sales, marketing, general"
                  required
                />
              </div>
              {createChannelMutation.isError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {createChannelMutation.error instanceof Error
                    ? createChannelMutation.error.message
                    : 'Failed to create channel'}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={createChannelMutation.isPending}>
                  {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateChannel(false)
                    setNewChannelName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* Channels Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channels</CardTitle>
            <CardDescription>{channels.length} channels</CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-350px)]">
            <div className="space-y-1">
              {channels.map((channel: ChatChannel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedChannelId === channel.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>#{channel.name}</span>
                    {channel._count?.messages !== undefined && (
                      <span className="text-xs text-gray-500">
                        {channel._count.messages}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <div className="lg:col-span-3 flex flex-col">
          {selectedChannel ? (
            <>
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>#{selectedChannel.name}</CardTitle>
                  {selectedChannel.description && (
                    <CardDescription>{selectedChannel.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {message.sender.user.name?.[0]?.toUpperCase() ||
                            message.sender.user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.sender.displayName || message.sender.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {message.content}
                          </p>
                          {message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  📎 {att.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                          {message.reactions.length > 0 && (
                            <div className="mt-2 flex gap-1">
                              {message.reactions.map((reaction) => (
                                <span
                                  key={reaction.id}
                                  className="px-2 py-1 bg-gray-100 rounded text-xs"
                                >
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Message Input */}
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={`Message #${selectedChannel.name}`}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button type="submit" disabled={sendMessageMutation.isPending || !messageContent.trim()}>
                      {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                  {sendMessageMutation.isError && (
                    <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {sendMessageMutation.error instanceof Error
                        ? sendMessageMutation.error.message
                        : 'Failed to send message'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p>Select a channel to start chatting</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


export default function Page() {
  return (
    <ModuleGate module="communication">
      <ChatPage />
    </ModuleGate>
  )
}
