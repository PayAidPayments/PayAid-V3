/**
 * Unified Email Sync Service
 * Handles email synchronization for both Gmail and Outlook
 * - Fetches inbound emails
 * - Logs outbound emails
 * - Links emails to contacts and deals
 * - Creates activity records
 */

import { prisma } from '@/lib/db/prisma'
import { getEncryptionService } from '@/lib/security/encryption'
import { linkEmailToCRM, updateEmailMessageWithContact } from '@/lib/email-helpers/link-to-crm'
import { parseEmail } from '@/lib/workflow/email-parser'
import { injectEmailTracking } from './tracking-injector'

export interface EmailSyncResult {
  synced: number
  linked: number
  created: number
  errors: number
}

export interface ParsedEmail {
  fromEmail: string
  fromName?: string
  toEmails: string[]
  ccEmails?: string[]
  subject: string
  body: string
  htmlBody?: string
  receivedAt: Date
  messageId: string
  threadId?: string
  attachments?: Array<{ name: string; contentId: string; size: number }>
}

/**
 * Get decrypted access token for email account
 */
async function getDecryptedAccessToken(account: any): Promise<string> {
  const credentials = account.providerCredentials as any
  if (!credentials?.accessToken) {
    throw new Error('No access token found. Please re-authenticate.')
  }

  // Decrypt token if it's encrypted
  const encryptionService = getEncryptionService()
  try {
    // Try to decrypt (if encrypted)
    return encryptionService.decrypt(credentials.accessToken)
  } catch {
    // If decryption fails, assume it's plaintext (backward compatibility)
    return credentials.accessToken
  }
}

/**
 * Refresh Gmail access token if expired
 */
async function refreshGmailToken(account: any): Promise<string> {
  const credentials = account.providerCredentials as any
  const encryptionService = getEncryptionService()

  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available. Please re-authenticate.')
  }

  const refreshToken = credentials.refreshToken.startsWith('iv:')
    ? encryptionService.decrypt(credentials.refreshToken)
    : credentials.refreshToken

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Gmail token')
  }

  const tokens = await tokenResponse.json()
  const newAccessToken = tokens.access_token
  const expiresIn = tokens.expires_in || 3600

  // Encrypt and update stored credentials
  const encryptedAccessToken = encryptionService.encrypt(newAccessToken)
  const updatedCredentials = {
    ...credentials,
    accessToken: encryptedAccessToken,
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
 * Refresh Outlook access token if expired
 */
async function refreshOutlookToken(account: any): Promise<string> {
  const credentials = account.providerCredentials as any
  const encryptionService = getEncryptionService()

  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available. Please re-authenticate.')
  }

  const refreshToken = credentials.refreshToken.startsWith('iv:')
    ? encryptionService.decrypt(credentials.refreshToken)
    : credentials.refreshToken

  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Outlook token')
  }

  const tokens = await tokenResponse.json()
  const newAccessToken = tokens.access_token
  const expiresIn = tokens.expires_in || 3600

  // Encrypt and update stored credentials
  const encryptedAccessToken = encryptionService.encrypt(newAccessToken)
  const updatedCredentials = {
    ...credentials,
    accessToken: encryptedAccessToken,
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
 * Get valid access token (refresh if needed)
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
    if (account.provider === 'gmail') {
      return await refreshGmailToken(account)
    } else if (account.provider === 'outlook') {
      return await refreshOutlookToken(account)
    }
  }

  // Return decrypted token
  return await getDecryptedAccessToken(account)
}

/**
 * Parse Gmail message into our format
 */
function parseGmailMessage(messageData: any): ParsedEmail {
  const headers = messageData.payload?.headers || []
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const from = getHeader('from')
  const to = getHeader('to')
  const cc = getHeader('cc')
  const subject = getHeader('subject')
  const date = getHeader('date')
  const messageId = getHeader('message-id')
  const inReplyTo = getHeader('in-reply-to')

  // Parse from address
  const fromMatch = from.match(/(.+?)\s*<(.+?)>/) || [null, from, from]
  const fromName = fromMatch[1]?.trim() || ''
  const fromEmail = fromMatch[2]?.trim() || from

  // Extract body text
  let bodyText = ''
  let htmlBody = ''
  
  if (messageData.payload?.body?.data) {
    bodyText = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8')
  } else if (messageData.payload?.parts) {
    for (const part of messageData.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }
  }

  return {
    fromEmail,
    fromName: fromName || undefined,
    toEmails: to ? to.split(',').map((e: string) => e.trim()) : [],
    ccEmails: cc ? cc.split(',').map((e: string) => e.trim()) : [],
    subject,
    body: bodyText,
    htmlBody: htmlBody || undefined,
    receivedAt: date ? new Date(date) : new Date(),
    messageId: messageId || messageData.id,
    threadId: messageData.threadId,
  }
}

/**
 * Parse Outlook message into our format
 */
function parseOutlookMessage(messageData: any): ParsedEmail {
  return {
    fromEmail: messageData.from?.emailAddress?.address || '',
    fromName: messageData.from?.emailAddress?.name,
    toEmails: (messageData.toRecipients || []).map((r: any) => r.emailAddress.address),
    ccEmails: (messageData.ccRecipients || []).map((r: any) => r.emailAddress.address),
    subject: messageData.subject || '',
    body: messageData.body?.content || '',
    htmlBody: messageData.body?.contentType === 'html' ? messageData.body.content : undefined,
    receivedAt: messageData.receivedDateTime ? new Date(messageData.receivedDateTime) : new Date(),
    messageId: messageData.id,
    threadId: messageData.conversationId,
  }
}

/**
 * Link email to contact and deal
 */
async function linkEmailToContactAndDeal(
  tenantId: string,
  parsedEmail: ParsedEmail,
  emailMessageId: string
): Promise<{ contactId: string | null; dealId: string | null }> {
  let contactId: string | null = null
  let dealId: string | null = null

  try {
    // Link to contact
    const linkResult = await linkEmailToCRM(tenantId, {
      accountId: '', // Not needed for linking
      fromEmail: parsedEmail.fromEmail,
      fromName: parsedEmail.fromName,
      subject: parsedEmail.subject,
      body: parsedEmail.body,
      htmlBody: parsedEmail.htmlBody,
      receivedAt: parsedEmail.receivedAt,
      messageId: parsedEmail.messageId,
    })

    contactId = linkResult.contactId

    if (contactId && emailMessageId) {
      await updateEmailMessageWithContact(emailMessageId, contactId)
    }

    // Try to link to deal by searching subject/body for deal names
    if (contactId) {
      const deals = await prisma.deal.findMany({
        where: {
          tenantId,
          contactId,
        },
        take: 5,
      })

      // Check if subject or body mentions deal name
      for (const deal of deals) {
        const dealNameLower = deal.name.toLowerCase()
        const subjectLower = parsedEmail.subject.toLowerCase()
        const bodyLower = parsedEmail.body.toLowerCase()

        if (subjectLower.includes(dealNameLower) || bodyLower.includes(dealNameLower)) {
          dealId = deal.id
          break
        }
      }
    }
  } catch (error) {
    console.error('Error linking email to contact/deal:', error)
  }

  return { contactId, dealId }
}

/**
 * Create interaction/activity record for email
 */
async function logEmailActivity(
  tenantId: string,
  contactId: string | null,
  parsedEmail: ParsedEmail,
  direction: 'inbound' | 'outbound'
): Promise<void> {
  if (!contactId) return

  try {
    await prisma.interaction.create({
      data: {
        contactId,
        type: 'email',
        subject: parsedEmail.subject,
        notes: `Email ${direction}: ${parsedEmail.body.substring(0, 500)}`,
        createdAt: parsedEmail.receivedAt,
      },
    })
  } catch (error) {
    console.error('Error logging email activity:', error)
  }
}

/**
 * Sync Gmail inbox
 */
async function syncGmailInbox(accountId: string, maxResults: number = 50): Promise<EmailSyncResult> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account || account.provider !== 'gmail') {
    throw new Error('Gmail account not found')
  }

  const accessToken = await getValidAccessToken(account)
  const result: EmailSyncResult = { synced: 0, linked: 0, created: 0, errors: 0 }

  try {
    // Fetch messages from Gmail API
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
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

    // Process each message
    for (const messageRef of messages) {
      try {
        // Fetch full message
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageRef.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!messageResponse.ok) {
          result.errors++
          continue
        }

        const messageData = await messageResponse.json()
        const parsedEmail = parseGmailMessage(messageData)

        // Check if message already exists
        const existingMessage = await prisma.emailMessage.findFirst({
          where: {
            accountId: account.id,
            messageId: parsedEmail.messageId,
          },
        })

        if (existingMessage) {
          continue // Skip already synced messages
        }

        // Create email message
        const emailMessage = await prisma.emailMessage.create({
          data: {
            accountId: account.id,
            folderId: inboxFolder.id,
            messageId: parsedEmail.messageId,
            subject: parsedEmail.subject,
            body: parsedEmail.body,
            fromEmail: parsedEmail.fromEmail,
            fromName: parsedEmail.fromName,
            toEmails: parsedEmail.toEmails,
            ccEmails: parsedEmail.ccEmails || [],
            receivedAt: parsedEmail.receivedAt,
            threadId: parsedEmail.threadId,
            isRead: false,
          },
        })

        result.synced++

        // Link to contact and deal
        const { contactId, dealId } = await linkEmailToContactAndDeal(
          account.tenantId,
          parsedEmail,
          emailMessage.id
        )

        if (contactId) {
          result.linked++
          await logEmailActivity(account.tenantId, contactId, parsedEmail, 'inbound')
        }
      } catch (error) {
        console.error(`Error syncing Gmail message ${messageRef.id}:`, error)
        result.errors++
      }
    }

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    })

    return result
  } catch (error) {
    console.error('Gmail inbox sync error:', error)
    throw error
  }
}

/**
 * Sync Outlook inbox
 */
async function syncOutlookInbox(accountId: string, maxResults: number = 50): Promise<EmailSyncResult> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account || account.provider !== 'outlook') {
    throw new Error('Outlook account not found')
  }

  const accessToken = await getValidAccessToken(account)
  const result: EmailSyncResult = { synced: 0, linked: 0, created: 0, errors: 0 }

  try {
    // Fetch messages from Microsoft Graph API
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${maxResults}&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messages = data.value || []

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

    // Process each message
    for (const messageData of messages) {
      try {
        const parsedEmail = parseOutlookMessage(messageData)

        // Check if message already exists
        const existingMessage = await prisma.emailMessage.findFirst({
          where: {
            accountId: account.id,
            messageId: parsedEmail.messageId,
          },
        })

        if (existingMessage) {
          continue // Skip already synced messages
        }

        // Create email message
        const emailMessage = await prisma.emailMessage.create({
          data: {
            accountId: account.id,
            folderId: inboxFolder.id,
            messageId: parsedEmail.messageId,
            subject: parsedEmail.subject,
            body: parsedEmail.body,
            fromEmail: parsedEmail.fromEmail,
            fromName: parsedEmail.fromName,
            toEmails: parsedEmail.toEmails,
            ccEmails: parsedEmail.ccEmails || [],
            receivedAt: parsedEmail.receivedAt,
            threadId: parsedEmail.threadId,
            isRead: messageData.isRead || false,
          },
        })

        result.synced++

        // Link to contact and deal
        const { contactId, dealId } = await linkEmailToContactAndDeal(
          account.tenantId,
          parsedEmail,
          emailMessage.id
        )

        if (contactId) {
          result.linked++
          await logEmailActivity(account.tenantId, contactId, parsedEmail, 'inbound')
        }
      } catch (error) {
        console.error(`Error syncing Outlook message ${messageData.id}:`, error)
        result.errors++
      }
    }

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    })

    return result
  } catch (error) {
    console.error('Outlook inbox sync error:', error)
    throw error
  }
}

/**
 * Log outbound email (when sent via CRM)
 */
export async function logOutboundEmail(
  accountId: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    cc?: string
    bcc?: string
    contactId?: string
    dealId?: string
    htmlBody?: string
    injectTracking?: boolean
  }
): Promise<string> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('Email account not found')
  }

  try {
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

    // Inject tracking if enabled
    let finalHtmlBody = options?.htmlBody || body
    if (options?.injectTracking !== false) {
      // Create message ID first for tracking
      const messageId = `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Inject tracking into HTML
      if (options?.htmlBody) {
        finalHtmlBody = injectEmailTracking(options.htmlBody, messageId, options?.contactId)
      } else {
        // Convert plain text to HTML and inject tracking
        finalHtmlBody = injectEmailTracking(
          `<html><body>${body.replace(/\n/g, '<br>')}</body></html>`,
          messageId,
          options?.contactId
        )
      }
    }

    // Create email message record
    const emailMessage = await prisma.emailMessage.create({
      data: {
        accountId: account.id,
        folderId: sentFolder.id,
        messageId: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject,
        body: options?.htmlBody ? undefined : body, // Store plain text if no HTML
        htmlBody: finalHtmlBody, // Store HTML with tracking
        fromEmail: account.email,
        toEmails: [to],
        ccEmails: options?.cc ? [options.cc] : [],
        receivedAt: new Date(),
        sentAt: new Date(),
        isRead: true,
        contactId: options?.contactId,
      },
    })

    // Link to contact if provided
    if (options?.contactId) {
      const parsedEmail: ParsedEmail = {
        fromEmail: account.email,
        fromName: account.displayName || undefined,
        toEmails: [to],
        subject,
        body,
        receivedAt: new Date(),
        messageId: emailMessage.messageId,
      }

      await logEmailActivity(account.tenantId, options.contactId, parsedEmail, 'outbound')
    }

    // Return the HTML body with tracking injected (for sending)
    return finalHtmlBody
  } catch (error) {
    console.error('Error logging outbound email:', error)
    throw error
  }
}

/**
 * Sync email inbox (unified for Gmail and Outlook)
 */
export async function syncEmailInbox(
  accountId: string,
  maxResults: number = 50
): Promise<EmailSyncResult> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('Email account not found')
  }

  if (account.provider === 'gmail') {
    return await syncGmailInbox(accountId, maxResults)
  } else if (account.provider === 'outlook') {
    return await syncOutlookInbox(accountId, maxResults)
  } else {
    throw new Error(`Unsupported email provider: ${account.provider}`)
  }
}

/**
 * Sync all email accounts for a tenant
 */
export async function syncAllEmailAccounts(tenantId: string): Promise<EmailSyncResult[]> {
  const accounts = await prisma.emailAccount.findMany({
    where: {
      tenantId,
      isActive: true,
      provider: {
        in: ['gmail', 'outlook'],
      },
    },
  })

  const results: EmailSyncResult[] = []

  for (const account of accounts) {
    try {
      const result = await syncEmailInbox(account.id)
      results.push(result)
    } catch (error) {
      console.error(`Error syncing account ${account.id}:`, error)
      results.push({ synced: 0, linked: 0, created: 0, errors: 1 })
    }
  }

  return results
}
