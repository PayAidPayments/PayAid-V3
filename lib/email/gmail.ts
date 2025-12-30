/**
 * Gmail API Integration
 * 
 * Handles Gmail API operations:
 * - OAuth token management
 * - Inbox sync
 * - Send emails
 * - Reply to emails
 * 
 * Note: Full functionality requires @googleapis/gmail package
 * Install with: npm install @googleapis/gmail
 */

import { prisma } from '@/lib/db/prisma'

export interface GmailAccount {
  id: string
  email: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}

/**
 * Refresh Gmail access token if expired
 */
async function refreshGmailToken(account: any): Promise<string> {
  const credentials = account.providerCredentials as any
  
  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available. Please re-authenticate.')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Gmail token')
  }

  const tokens = await tokenResponse.json()
  const newAccessToken = tokens.access_token
  const expiresIn = tokens.expires_in || 3600

  // Update stored credentials
  const updatedCredentials = {
    ...credentials,
    accessToken: newAccessToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  }

  await prisma.emailAccount.update({
    where: { id: account.id },
    data: {
      providerCredentials: updatedCredentials as any,
    },
  })

  return newAccessToken
}

/**
 * Get valid Gmail access token (refresh if needed)
 */
async function getValidAccessToken(account: any): Promise<string> {
  const credentials = account.providerCredentials as any
  
  if (!credentials?.accessToken) {
    throw new Error('No access token found. Please re-authenticate.')
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = credentials.expiresAt ? new Date(credentials.expiresAt) : null
  const now = new Date()
  const buffer = 5 * 60 * 1000 // 5 minutes

  if (expiresAt && expiresAt.getTime() - buffer < now.getTime()) {
    // Token expired or about to expire, refresh it
    return await refreshGmailToken(account)
  }

  return credentials.accessToken
}

/**
 * Initialize Gmail API client
 * Returns account with valid access token
 */
export async function getGmailClient(accountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('Gmail account not found')
  }

  if (account.provider !== 'gmail') {
    throw new Error('Account is not a Gmail account')
  }

  // Get valid access token
  const accessToken = await getValidAccessToken(account)

  return {
    account,
    accessToken,
    // Gmail API base URL
    apiBaseUrl: 'https://gmail.googleapis.com/gmail/v1',
  }
}

/**
 * Sync inbox messages from Gmail
 */
export async function syncGmailInbox(accountId: string) {
  const client = await getGmailClient(accountId)
  const { account, accessToken } = client

  try {
    // Fetch messages from Gmail API
    const response = await fetch(
      `${client.apiBaseUrl}/users/me/messages?maxResults=50&q=in:inbox`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messages = data.messages || []

    // Fetch full message details and store in database
    for (const messageRef of messages.slice(0, 20)) { // Limit to 20 for performance
      try {
        const messageResponse = await fetch(
          `${client.apiBaseUrl}/users/me/messages/${messageRef.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!messageResponse.ok) continue

        const messageData = await messageResponse.json()
        
        // Extract email headers
        const headers = messageData.payload?.headers || []
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

        const from = getHeader('from')
        const to = getHeader('to')
        const subject = getHeader('subject')
        const date = getHeader('date')
        const messageId = getHeader('message-id')

        // Extract body text
        let bodyText = ''
        if (messageData.payload?.body?.data) {
          bodyText = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8')
        } else if (messageData.payload?.parts) {
          for (const part of messageData.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8')
              break
            }
          }
        }

        // Get or create Inbox folder
        let inboxFolder = await prisma.emailFolder.findFirst({
          where: {
            accountId: account.id,
            type: 'inbox',
          },
        })

        if (!inboxFolder) {
          inboxFolder = await prisma.emailFolder.create({
            data: {
              accountId: account.id,
              name: 'Inbox',
              type: 'inbox',
            },
          })
        }

        // Check if message already exists
        const existingMessage = await prisma.emailMessage.findFirst({
          where: {
            accountId: account.id,
            messageId: messageId || messageRef.id,
          },
        })

        if (existingMessage) {
          // Update existing message
          await prisma.emailMessage.update({
            where: { id: existingMessage.id },
            data: {
              subject,
              body: bodyText,
              fromEmail: from,
              toEmails: to ? [to] : [],
              receivedAt: date ? new Date(date) : new Date(),
            },
          })
        } else {
          // Create new message
          await prisma.emailMessage.create({
            data: {
              accountId: account.id,
              folderId: inboxFolder.id,
              messageId: messageId || messageRef.id,
              subject,
              body: bodyText,
              fromEmail: from,
              toEmails: to ? [to] : [],
              receivedAt: date ? new Date(date) : new Date(),
              isRead: false,
              isStarred: false,
            },
          })
        }
      } catch (error) {
        console.error(`Error syncing message ${messageRef.id}:`, error)
      }
    }

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    })

    return { synced: messages.length }
  } catch (error) {
    console.error('Gmail inbox sync error:', error)
    throw error
  }
}

/**
 * Send email via Gmail
 */
export async function sendGmailEmail(
  accountId: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    cc?: string
    bcc?: string
    replyTo?: string
  }
) {
  const client = await getGmailClient(accountId)
  const { account, accessToken } = client

  // Create email message in RFC 2822 format
  const messageLines = [
    `To: ${to}`,
    options?.cc ? `Cc: ${options.cc}` : '',
    options?.bcc ? `Bcc: ${options.bcc}` : '',
    options?.replyTo ? `Reply-To: ${options.replyTo}` : '',
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].filter(Boolean)

  const rawMessage = messageLines.join('\r\n')
  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  try {
    // Send via Gmail API
    const response = await fetch(
      `${client.apiBaseUrl}/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gmail send failed: ${errorData}`)
    }

    const messageData = await response.json()

    // Get or create Sent folder
    let sentFolder = await prisma.emailFolder.findFirst({
      where: {
        accountId: account.id,
        type: 'sent',
      },
    })

    if (!sentFolder) {
      sentFolder = await prisma.emailFolder.create({
        data: {
          accountId: account.id,
          name: 'Sent',
          type: 'sent',
        },
      })
    }

    // Store in sent folder
    await prisma.emailMessage.create({
      data: {
        accountId: account.id,
        folderId: sentFolder.id,
        messageId: messageData.id || `sent_${Date.now()}`,
        subject,
        body,
        fromEmail: account.email,
        toEmails: [to],
        receivedAt: new Date(),
        sentAt: new Date(),
        isRead: true,
        isStarred: false,
      },
    })

    return { messageId: messageData.id, success: true }
  } catch (error) {
    console.error('Gmail send error:', error)
    throw error
  }
}

/**
 * Reply to email via Gmail
 */
export async function replyGmailEmail(
  accountId: string,
  messageId: string,
  replyBody: string
) {
  const client = await getGmailClient(accountId)
  const { account, accessToken } = client

  try {
    // Get original message
    const messageResponse = await fetch(
      `${client.apiBaseUrl}/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!messageResponse.ok) {
      throw new Error('Failed to fetch original message')
    }

    const originalMessage = await messageResponse.json()
    const headers = originalMessage.payload?.headers || []
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    const originalFrom = getHeader('from')
    const originalSubject = getHeader('subject')
    const originalMessageId = getHeader('message-id')
    const originalTo = getHeader('to')

    // Create reply message
    const replySubject = originalSubject.startsWith('Re:') 
      ? originalSubject 
      : `Re: ${originalSubject}`

    const messageLines = [
      `To: ${originalFrom}`,
      `In-Reply-To: ${originalMessageId}`,
      `References: ${originalMessageId}`,
      `Subject: ${replySubject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      replyBody,
    ].filter(Boolean)

    const rawMessage = messageLines.join('\r\n')
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send reply via Gmail API
    const sendResponse = await fetch(
      `${client.apiBaseUrl}/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
          threadId: originalMessage.threadId,
        }),
      }
    )

    if (!sendResponse.ok) {
      const errorData = await sendResponse.text()
      throw new Error(`Gmail reply failed: ${errorData}`)
    }

    const replyData = await sendResponse.json()

    // Get or create Sent folder
    let sentFolder = await prisma.emailFolder.findFirst({
      where: {
        accountId: account.id,
        type: 'sent',
      },
    })

    if (!sentFolder) {
      sentFolder = await prisma.emailFolder.create({
        data: {
          accountId: account.id,
          name: 'Sent',
          type: 'sent',
        },
      })
    }

    // Store in sent folder
    await prisma.emailMessage.create({
      data: {
        accountId: account.id,
        folderId: sentFolder.id,
        messageId: replyData.id || `reply_${Date.now()}`,
        subject: replySubject,
        body: replyBody,
        fromEmail: account.email,
        toEmails: [originalFrom],
        receivedAt: new Date(),
        sentAt: new Date(),
        inReplyTo: originalMessageId,
        threadId: originalMessage.threadId || undefined,
        isRead: true,
        isStarred: false,
      },
    })

    return { messageId: replyData.id, success: true }
  } catch (error) {
    console.error('Gmail reply error:', error)
    throw error
  }
}
