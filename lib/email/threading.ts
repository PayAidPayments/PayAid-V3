/**
 * Email Threading Service
 * Groups related emails into threads based on subject, in-reply-to, and references
 */

import { prisma } from '@/lib/db/prisma'

export interface EmailThread {
  threadId: string
  subject: string
  messages: Array<{
    id: string
    messageId: string
    fromEmail: string
    fromName?: string
    subject: string
    receivedAt: Date
    isRead: boolean
    snippet?: string
  }>
  unreadCount: number
  lastMessageAt: Date
}

/**
 * Generate thread ID from email subject
 * Removes "Re:", "Fwd:", etc. and normalizes
 */
export function generateThreadId(subject: string): string {
  // Remove common prefixes
  const normalized = subject
    .replace(/^(Re|Fwd|Fw):\s*/i, '')
    .replace(/\[.*?\]/g, '') // Remove brackets
    .trim()
    .toLowerCase()

  // Create hash-like ID from normalized subject
  // In production, use a proper hash function
  return `thread_${normalized.substring(0, 50).replace(/\s+/g, '_')}`
}

/**
 * Group emails into threads
 */
export async function groupEmailsIntoThreads(
  accountId: string,
  folderId?: string
): Promise<EmailThread[]> {
  const where: any = {
    accountId,
  }

  if (folderId) {
    where.folderId = folderId
  }

  // Get all emails
  const messages = await prisma.emailMessage.findMany({
    where,
    orderBy: { receivedAt: 'asc' },
    select: {
      id: true,
      messageId: true,
      threadId: true,
      inReplyTo: true,
      fromEmail: true,
      fromName: true,
      subject: true,
      body: true,
      receivedAt: true,
      isRead: true,
    },
  })

  // Group by thread
  const threadMap = new Map<string, EmailThread>()

  for (const message of messages) {
    // Determine thread ID
    let threadId = message.threadId

    if (!threadId) {
      // Try to find parent thread by in-reply-to
      if (message.inReplyTo) {
        const parentMessage = messages.find((m) => m.messageId === message.inReplyTo)
        if (parentMessage?.threadId) {
          threadId = parentMessage.threadId
        }
      }

      // If still no thread ID, generate from subject
      if (!threadId) {
        threadId = generateThreadId(message.subject)
      }
    }

    // Get or create thread
    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, {
        threadId,
        subject: message.subject.replace(/^(Re|Fwd|Fw):\s*/i, '').trim(),
        messages: [],
        unreadCount: 0,
        lastMessageAt: message.receivedAt,
      })
    }

    const thread = threadMap.get(threadId)!

    // Add message to thread
    thread.messages.push({
      id: message.id,
      messageId: message.messageId,
      fromEmail: message.fromEmail,
      fromName: message.fromName || undefined,
      subject: message.subject,
      receivedAt: message.receivedAt,
      isRead: message.isRead,
      snippet: message.body?.substring(0, 100) || undefined,
    })

    if (!message.isRead) {
      thread.unreadCount++
    }

    // Update last message date
    if (message.receivedAt > thread.lastMessageAt) {
      thread.lastMessageAt = message.receivedAt
    }
  }

  // Update thread IDs in database
  for (const [threadId, thread] of threadMap.entries()) {
    for (const msg of thread.messages) {
      await prisma.emailMessage.update({
        where: { id: msg.id },
        data: { threadId },
      })
    }
  }

  // Sort threads by last message date (newest first)
  return Array.from(threadMap.values()).sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  )
}

/**
 * Get thread for a specific message
 */
export async function getEmailThread(
  messageId: string,
  tenantId: string
): Promise<EmailThread | null> {
  const message = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: {
      account: {
        select: { tenantId: true },
      },
    },
  })

  if (!message || message.account.tenantId !== tenantId) {
    return null
  }

  const threadId = message.threadId || generateThreadId(message.subject)

  // Get all messages in thread
  const threadMessages = await prisma.emailMessage.findMany({
    where: {
      accountId: message.accountId,
      threadId,
    },
    orderBy: { receivedAt: 'asc' },
    select: {
      id: true,
      messageId: true,
      fromEmail: true,
      fromName: true,
      subject: true,
      body: true,
      receivedAt: true,
      isRead: true,
    },
  })

  if (threadMessages.length === 0) {
    return null
  }

  return {
    threadId,
    subject: message.subject.replace(/^(Re|Fwd|Fw):\s*/i, '').trim(),
    messages: threadMessages.map((msg) => ({
      id: msg.id,
      messageId: msg.messageId,
      fromEmail: msg.fromEmail,
      fromName: msg.fromName || undefined,
      subject: msg.subject,
      receivedAt: msg.receivedAt,
      isRead: msg.isRead,
      snippet: msg.body?.substring(0, 100) || undefined,
    })),
    unreadCount: threadMessages.filter((m) => !m.isRead).length,
    lastMessageAt: threadMessages[threadMessages.length - 1].receivedAt,
  }
}
