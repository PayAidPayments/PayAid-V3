/**
 * Internal WhatsApp send for HR bot – two-way reply without marketing license.
 * Uses same WAHA backend as /api/whatsapp/messages/send.
 */

import { prisma } from '@/lib/db/prisma'
import axios from 'axios'

export async function sendWhatsAppReply(conversationId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { account: true, session: true },
    })
    if (!conversation?.session?.providerSessionId || !conversation.account.wahaBaseUrl || !conversation.account.wahaApiKey) {
      return { ok: false, error: 'Missing session or WAHA config' }
    }
    const identity = await prisma.whatsappContactIdentity.findFirst({
      where: { contactId: conversation.contactId },
    })
    if (!identity) return { ok: false, error: 'No contact number' }
    const toNumber = identity.whatsappNumber
    const fromNumber = conversation.session.phoneNumber || ''

    const wahaResponse = await axios.post(
      `${conversation.account.wahaBaseUrl}/api/instances/${conversation.session.providerSessionId}/messages`,
      { to: toNumber, body: text },
      {
        headers: { Authorization: `Bearer ${conversation.account.wahaApiKey}` },
        timeout: 10000,
      }
    )
    const whatsappMessageId = wahaResponse.data?.messageId || wahaResponse.data?.id || ''

    await prisma.whatsappMessage.create({
      data: {
        conversationId,
        sessionId: conversation.sessionId!,
        direction: 'out',
        messageType: 'text',
        whatsappMessageId,
        fromNumber,
        toNumber,
        text,
        status: 'sent',
        sentAt: new Date(),
      },
    })
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastDirection: 'out' },
    })
    await prisma.whatsappSession.update({
      where: { id: conversation.sessionId! },
      data: { dailySentCount: { increment: 1 }, lastSeenAt: new Date() },
    })
    return { ok: true }
  } catch (e: any) {
    console.error('HR WhatsApp send error:', e?.message || e)
    return { ok: false, error: e?.message || 'Send failed' }
  }
}
