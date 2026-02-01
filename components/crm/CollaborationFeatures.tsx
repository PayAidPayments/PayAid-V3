'use client'

import { useState } from 'react'
import { AtSign, Users, MessageSquare, Share2, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Mention {
  id: string
  userId: string
  userName: string
  position: number
}

interface Comment {
  id: string
  text: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  mentions?: Mention[]
  timestamp: Date
  isInternal?: boolean
}

interface CollaborationFeaturesProps {
  tenantId: string
  recordId: string
  recordType: 'contact' | 'deal' | 'task'
  comments?: Comment[]
  onAddComment: (text: string, mentions: string[], isInternal: boolean) => Promise<void>
}

export function CollaborationFeatures({
  tenantId,
  recordId,
  recordType,
  comments = [],
  onAddComment,
}: CollaborationFeaturesProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showMentions, setShowMentions] = useState(false)

  const handleMention = (text: string, cursorPos: number) => {
    const beforeCursor = text.substring(0, cursorPos)
    const afterCursor = text.substring(cursorPos)
    const lastAt = beforeCursor.lastIndexOf('@')
    
    if (lastAt !== -1 && (cursorPos === lastAt + 1 || beforeCursor.substring(lastAt + 1).match(/^[a-zA-Z0-9]*$/))) {
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    
    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1])
    }
    
    await onAddComment(newComment, mentions, isInternal)
    setNewComment('')
    setIsInternal(false)
  }

  return (
    <div className="space-y-6">
      {/* Comments Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Notes
        </h3>

        {/* Add Comment */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="internal"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="internal" className="text-sm cursor-pointer flex items-center gap-1">
              {isInternal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Internal note (not visible to customer)
            </Label>
          </div>
          <Textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value)
              handleMention(e.target.value, e.target.selectionStart)
            }}
            placeholder="Add a comment... Use @ to mention team members"
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Tip: Use @username to mention team members
            </p>
            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 border rounded-lg ${
                comment.isInternal
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{comment.author.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {comment.isInternal && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Internal
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.text.split(/(@\w+)/g).map((part, idx) => {
                  if (part.startsWith('@')) {
                    return (
                      <Badge key={idx} variant="secondary" className="mx-1">
                        <AtSign className="w-3 h-3 mr-1" />
                        {part.substring(1)}
                      </Badge>
                    )
                  }
                  return part
                })}
              </p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Shared Views */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Shared Views
        </h3>
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share filtered views with your team members
          </p>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share Current View
          </Button>
        </div>
      </div>
    </div>
  )
}
