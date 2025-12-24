# PayAid WhatsApp Module: Cursor AI Implementation Instructions
## Complete, Strict, No-Deviation Spec for Building Self-Hosted WhatsApp Integration

**Date:** December 20, 2025  
**Status:** Ready for Cursor Implementation  
**Investment:** ₹0 (completely free, self-hosted)  
**Gateway:** WAHA (WhatsApp HTTP API) - simplest open-source option  
**Tech Stack:** Node.js + Express + Prisma + PostgreSQL + Redis

---

# CRITICAL RULES FOR CURSOR

1. **NO THIRD-PARTY PAID SERVICES:**
   - Do NOT use Twilio, 360dialog, MessageBird, or any paid WhatsApp API.
   - Do NOT use Firebase, SendGrid, or other cloud services.
   - Use ONLY open-source and free tier services.

2. **COPY EXACT SCHEMA:**
   - Every model name, field name, type must match exactly.
   - Do NOT rename or modify fields without explicit permission.

3. **FOLLOW FILE STRUCTURE:**
   - Create files in exact paths specified.
   - Do NOT deviate from folder organization.

4. **NO HALLUCINATIONS:**
   - Do NOT invent new API endpoints.
   - Do NOT add features not listed.
   - Do NOT modify database relationships.

5. **PRODUCTION-READY CODE:**
   - All error handling must be present.
   - All validation must be present.
   - All security checks must be present.

---

# PART 1: DATABASE SCHEMA (Prisma)

## File: `prisma/schema.prisma`

Add these models AFTER your existing CRM models. Do NOT modify existing models.

```prisma
// ========================================
// WHATSAPP MODULE MODELS
// ========================================

// High-level WhatsApp business profile (per PayAid tenant)
model WhatsappAccount {
  id            String   @id @default(cuid())
  businessId    String
  business      Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // Channel type: 'web' = WAHA/Evolution (self-hosted), 'cloud' = Meta Cloud API (future)
  channelType   String   @default("web")

  // For 'web' channel (WAHA/Evolution)
  wahaBaseUrl   String?  // e.g., "http://localhost:3000"
  wahaApiKey    String?  // Encrypted, for authentication
  isWebConnected Boolean @default(false)

  // For 'cloud' channel (future - when you have funds)
  wabaId        String?
  phoneNumberId String?
  accessToken   String?  // Encrypted
  metaAppId     String?
  metaAppSecret String?  // Encrypted
  isCloudConnected Boolean @default(false)

  // Business metadata
  businessName  String?
  primaryPhone  String?
  status        String   @default("active") // 'active' | 'inactive' | 'error'
  errorMessage  String?

  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions      WhatsappSession[]
  templates     WhatsappTemplate[]
  conversations WhatsappConversation[]
}

// Each employee or shared number = one session to WAHA/Evolution
model WhatsappSession {
  id               String          @id @default(cuid())
  accountId        String
  account          WhatsappAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  employeeId       String?         // null if it's a shared team inbox
  employee         User?           @relation(fields: [employeeId], references: [id], onDelete: SetNull)

  // Session identifier in WAHA/Evolution
  providerSessionId String?        // session name/id from WAHA
  qrCodeUrl         String?        // last QR code for onboarding
  status            String         @default("pending_qr") // 'pending_qr' | 'connected' | 'disconnected' | 'error'

  // Device information
  deviceName        String?        // e.g., "Rohit's Phone"
  phoneNumber       String?        // WhatsApp number (E.164 format)
  lastSyncAt        DateTime?      // Last time WAHA synced with phone
  lastSeenAt        DateTime?      // Last time session was active

  // Daily counters (reset at midnight UTC)
  dailySentCount    Int            @default(0)
  dailyRecvCount    Int            @default(0)
  dailyResetAt      DateTime?      // Timestamp of last daily reset

  // Configuration
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  conversations     WhatsappConversation[]
  messages          WhatsappMessage[]

  @@unique([accountId, providerSessionId])
  @@index([accountId])
  @@index([employeeId])
}

// Link WhatsApp phone number to CRM contact (many-to-one)
model WhatsappContactIdentity {
  id          String   @id @default(cuid())
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  // WhatsApp number in E.164 format (e.g., +919876543210)
  whatsappNumber String
  verified       Boolean @default(false)
  verificationDate DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([whatsappNumber])
  @@index([contactId])
}

// Conversation between business and contact via WhatsApp
model WhatsappConversation {
  id             String           @id @default(cuid())
  accountId      String
  account        WhatsappAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)

  contactId      String
  contact        Contact          @relation(fields: [contactId], references: [id], onDelete: Cascade)

  sessionId      String?          // Preferred session for this conversation
  session        WhatsappSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  ticketId       String?          // Link to support ticket
  ticket         Ticket?          @relation(fields: [ticketId], references: [id], onDelete: SetNull)

  // Conversation state
  status         String           @default("open") // 'open' | 'closed' | 'archived'
  lastMessageAt  DateTime?
  lastDirection  String?          // 'in' | 'out'
  unreadCount    Int              @default(0)

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  messages       WhatsappMessage[]

  @@unique([accountId, contactId])
  @@index([accountId])
  @@index([contactId])
  @@index([ticketId])
  @@index([status])
}

// Individual WhatsApp messages
model WhatsappMessage {
  id              String               @id @default(cuid())
  conversationId  String
  conversation    WhatsappConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  sessionId       String?              // Which session sent/received this
  session         WhatsappSession?     @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  employeeId      String?              // Which employee triggered sending (for outbound)
  employee        User?                @relation(fields: [employeeId], references: [id], onDelete: SetNull)

  // Message routing
  direction       String               // MUST be 'in' or 'out' (no other values)
  messageType     String               // 'text' | 'image' | 'document' | 'template' | 'reaction'
  whatsappMessageId String?           // ID from WAHA or Meta

  fromNumber      String               // E.164 format
  toNumber        String               // E.164 format

  // Message content
  text            String?              // Text body (optional for media)
  mediaUrl        String?              // S3 / local storage URL for media
  mediaMimeType   String?              // e.g., 'image/jpeg', 'application/pdf'
  mediaCaption    String?              // Caption for media (WhatsApp feature)

  // Template reference (for template messages)
  templateId      String?
  template        WhatsappTemplate?    @relation(fields: [templateId], references: [id], onDelete: SetNull)

  // Message metadata
  status          String?              // 'sent' | 'delivered' | 'read' | 'failed'
  errorCode       String?
  errorMessage    String?

  sentAt          DateTime?            // When message was sent
  deliveredAt     DateTime?            // When message was delivered
  readAt          DateTime?            // When message was read by recipient

  createdAt       DateTime            @default(now())

  @@index([conversationId])
  @@index([sessionId])
  @@index([employeeId])
  @@index([direction])
  @@index([messageType])
}

// WhatsApp message templates (local + Meta Cloud later)
model WhatsappTemplate {
  id           String           @id @default(cuid())
  accountId    String
  account      WhatsappAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // Template metadata
  name         String           // Human-readable name
  category     String           // 'welcome' | 'order_update' | 'support' | 'delivery' | 'payment' | 'custom'
  languageCode String           // 'en' | 'hi' | 'ta' | etc.

  // Template body (mustache-style placeholders for now)
  // Example: "Hi {{1}}, your order {{2}} will arrive on {{3}}."
  bodyTemplate String

  // Header (optional)
  headerType   String?          // 'text' | 'image' | 'video' | 'document'
  headerContent String?

  // Footer (optional)
  footerContent String?

  // Button definitions (JSON) - for later expansion
  // Example: [{ "type": "url", "text": "Track Order", "url": "https://..." }]
  buttons      String?

  // Meta Cloud API mapping (future)
  isMetaBacked Boolean          @default(false)
  metaName     String?          // Template name on Meta's side
  metaStatus   String?          // 'pending_review' | 'approved' | 'rejected' | null
  metaReason   String?          // Rejection reason from Meta

  // Creation metadata
  createdById  String?
  createdBy    User?            @relation(fields: [createdById], references: [id], onDelete: SetNull)

  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  messages     WhatsappMessage[]

  @@unique([accountId, name, languageCode])
  @@index([accountId])
  @@index([category])
}

// Audit log for WhatsApp actions (compliance + debugging)
model WhatsappAuditLog {
  id           String   @id @default(cuid())
  accountId    String
  sessionId    String?

  action       String   // 'session_connect' | 'message_send' | 'message_receive' | 'template_create' | 'template_submit_meta'
  description  String?
  status       String   // 'success' | 'failure'
  errorCode    String?
  errorMessage String?

  userId       String?  // Which user triggered this (if applicable)
  details      String?  // JSON payload for debugging

  ipAddress    String?
  userAgent    String?

  createdAt    DateTime @default(now())

  @@index([accountId])
  @@index([sessionId])
  @@index([action])
  @@index([status])
}

// Extend existing Contact model (add this relation)
// If you already have Contact model, add this line to it:
// model Contact {
//   // ... existing fields ...
//   whatsappIdentities WhatsappContactIdentity[]
//   whatsappConversations WhatsappConversation[]
// }

// Extend existing User model (add this relation)
// If you already have User model, add these lines to it:
// model User {
//   // ... existing fields ...
//   whatsappSessions WhatsappSession[]
//   createdWhatsappTemplates WhatsappTemplate[]
//   whatsappMessages WhatsappMessage[]
// }

// Extend existing Ticket model (add this relation)
// If you already have Ticket model, add this line to it:
// model Ticket {
//   // ... existing fields ...
//   whatsappConversations WhatsappConversation[]
// }

// Extend existing Business model (add this relation)
// If you already have Business model, add this line to it:
// model Business {
//   // ... existing fields ...
//   whatsappAccounts WhatsappAccount[]
// }
```

**After adding schema:**
```bash
npx prisma migrate dev --name add_whatsapp_module
npx prisma generate
```

---

# PART 2: BACKEND API ENDPOINTS

## File: `src/routes/whatsapp.ts`

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { validateInput } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// WHATSAPP ACCOUNT MANAGEMENT
// ========================================

/**
 * GET /api/whatsapp/accounts
 * List all WhatsApp accounts for a business
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    if (!businessId) return res.status(400).json({ error: 'businessId required' });

    const accounts = await prisma.whatsappAccount.findMany({
      where: { businessId },
      include: {
        sessions: true,
        templates: true,
      },
    });

    res.json(accounts);
  } catch (error) {
    console.error('GET /accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * POST /api/whatsapp/accounts
 * Create a new WhatsApp account (web channel only for now)
 * Body: { channelType: 'web', wahaBaseUrl: 'http://localhost:3000', wahaApiKey: 'secret' }
 */
router.post('/accounts', authenticateToken, validateInput, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { channelType, wahaBaseUrl, wahaApiKey, businessName, primaryPhone } = req.body;

    if (!businessId) return res.status(400).json({ error: 'businessId required' });
    if (channelType !== 'web') return res.status(400).json({ error: 'Only web channel supported now' });
    if (!wahaBaseUrl) return res.status(400).json({ error: 'wahaBaseUrl required' });

    // Test connection to WAHA
    try {
      const testResponse = await axios.get(`${wahaBaseUrl}/api/health`, {
        headers: { Authorization: `Bearer ${wahaApiKey}` },
        timeout: 5000,
      });
      if (!testResponse.data) throw new Error('WAHA health check failed');
    } catch (error) {
      return res.status(400).json({ error: 'Failed to connect to WAHA server' });
    }

    const account = await prisma.whatsappAccount.create({
      data: {
        businessId,
        channelType,
        wahaBaseUrl,
        wahaApiKey, // In production, encrypt this
        businessName,
        primaryPhone,
        isWebConnected: true,
      },
    });

    // Log to audit
    await prisma.whatsappAuditLog.create({
      data: {
        accountId: account.id,
        action: 'account_create',
        status: 'success',
        description: `Created WAHA account at ${wahaBaseUrl}`,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('POST /accounts error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ========================================
// WHATSAPP SESSIONS (QR + DEVICE MANAGEMENT)
// ========================================

/**
 * POST /api/whatsapp/sessions
 * Create a new session (get QR code for employee to scan)
 * Body: { accountId: 'uuid', employeeId: 'uuid', deviceName: 'Rohit Phone' }
 */
router.post('/sessions', authenticateToken, validateInput, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { accountId, employeeId, deviceName } = req.body;

    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    // Verify account belongs to business
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Call WAHA to create session and get QR
    const sessionName = `${businessId}-${employeeId || 'shared'}-${Date.now()}`;
    let qrCodeUrl = '';

    try {
      const wahaResponse = await axios.post(
        `${account.wahaBaseUrl}/api/instances`,
        { name: sessionName },
        { headers: { Authorization: `Bearer ${account.wahaApiKey}` }, timeout: 10000 }
      );

      // Get QR code
      const qrResponse = await axios.get(
        `${account.wahaBaseUrl}/api/instances/${sessionName}/qr`,
        { headers: { Authorization: `Bearer ${account.wahaApiKey}` }, timeout: 10000 }
      );

      qrCodeUrl = qrResponse.data.qr || '';
    } catch (error) {
      console.error('WAHA session creation error:', error);
      return res.status(500).json({ error: 'Failed to create WAHA session' });
    }

    // Store session in DB
    const session = await prisma.whatsappSession.create({
      data: {
        accountId,
        employeeId: employeeId || null,
        providerSessionId: sessionName,
        qrCodeUrl,
        status: 'pending_qr',
        deviceName,
      },
    });

    await prisma.whatsappAuditLog.create({
      data: {
        accountId,
        sessionId: session.id,
        action: 'session_create',
        status: 'success',
        description: `Created session ${sessionName}`,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('POST /sessions error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/whatsapp/sessions/:accountId
 * List all sessions for an account
 */
router.get('/sessions/:accountId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { accountId } = req.params;

    // Verify ownership
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sessions = await prisma.whatsappSession.findMany({
      where: { accountId },
      include: { employee: true },
    });

    res.json(sessions);
  } catch (error) {
    console.error('GET /sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/whatsapp/sessions/:sessionId/status
 * Check session connection status
 */
router.get('/sessions/:sessionId/status', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.whatsappSession.findUnique({
      where: { id: sessionId },
      include: { account: true },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check status with WAHA
    try {
      const statusResponse = await axios.get(
        `${session.account.wahaBaseUrl}/api/instances/${session.providerSessionId}`,
        { headers: { Authorization: `Bearer ${session.account.wahaApiKey}` }, timeout: 5000 }
      );

      const newStatus = statusResponse.data.state === 'CONNECTED' ? 'connected' : 'pending_qr';
      const phoneNumber = statusResponse.data.me?.user || null;

      // Update if changed
      if (newStatus !== session.status || phoneNumber !== session.phoneNumber) {
        await prisma.whatsappSession.update({
          where: { id: sessionId },
          data: {
            status: newStatus,
            phoneNumber,
            lastSyncAt: new Date(),
          },
        });
      }

      res.json({ status: newStatus, phoneNumber });
    } catch (error) {
      res.json({ status: session.status, phoneNumber: session.phoneNumber });
    }
  } catch (error) {
    console.error('GET /sessions/:sessionId/status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ========================================
// WHATSAPP MESSAGES
// ========================================

/**
 * POST /api/whatsapp/messages/send
 * Send a WhatsApp message
 * Body: { conversationId: 'uuid', text: 'Hello', mediaUrl?: '...', templateId?: '...' }
 */
router.post('/messages/send', authenticateToken, validateInput, async (req, res) => {
  try {
    const { businessId, userId } = req.user;
    const { conversationId, text, mediaUrl, templateId } = req.body;

    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    if (!text && !mediaUrl && !templateId) {
      return res.status(400).json({ error: 'text, mediaUrl, or templateId required' });
    }

    // Fetch conversation
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { account: true, contact: true, session: true },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Use preferred session or first available
    const session = conversation.session || 
      await prisma.whatsappSession.findFirst({
        where: { accountId: conversation.accountId, status: 'connected' },
      });

    if (!session) return res.status(400).json({ error: 'No active WhatsApp session' });

    // Get contact's WhatsApp number
    const identity = await prisma.whatsappContactIdentity.findFirst({
      where: { contactId: conversation.contactId },
    });

    if (!identity) return res.status(400).json({ error: 'Contact has no WhatsApp number' });

    const toNumber = identity.whatsappNumber;
    const fromNumber = session.phoneNumber;

    // Send via WAHA
    let whatsappMessageId = '';
    let status = 'sent';
    let errorCode = '';
    let errorMessage = '';

    try {
      const sendPayload: any = {
        to: toNumber,
      };

      if (text) {
        sendPayload.body = text;
      } else if (mediaUrl) {
        sendPayload.media = { url: mediaUrl };
      } else if (templateId) {
        const template = await prisma.whatsappTemplate.findUnique({
          where: { id: templateId },
        });
        sendPayload.body = template?.bodyTemplate || '';
      }

      const wahaResponse = await axios.post(
        `${conversation.account.wahaBaseUrl}/api/instances/${session.providerSessionId}/messages`,
        sendPayload,
        { headers: { Authorization: `Bearer ${conversation.account.wahaApiKey}` }, timeout: 10000 }
      );

      whatsappMessageId = wahaResponse.data.messageId || '';
    } catch (error: any) {
      status = 'failed';
      errorCode = error.response?.status.toString() || 'UNKNOWN';
      errorMessage = error.message || 'Failed to send message';
      console.error('WAHA send error:', error);
    }

    // Store message
    const message = await prisma.whatsappMessage.create({
      data: {
        conversationId,
        sessionId: session.id,
        employeeId: userId,
        direction: 'out',
        messageType: templateId ? 'template' : (mediaUrl ? 'image' : 'text'),
        whatsappMessageId,
        fromNumber,
        toNumber,
        text,
        mediaUrl,
        templateId: templateId || null,
        status,
        errorCode,
        errorMessage,
        sentAt: new Date(),
      },
    });

    await prisma.whatsappAuditLog.create({
      data: {
        accountId: conversation.accountId,
        sessionId: session.id,
        action: 'message_send',
        status: status === 'failed' ? 'failure' : 'success',
        errorCode,
        errorMessage,
        userId,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('POST /messages/send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/whatsapp/conversations/:conversationId/messages
 * Get message history for a conversation (paginated)
 * Query: ?limit=50&offset=0
 */
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const messages = await prisma.whatsappMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
      include: { employee: true, template: true },
    });

    const total = await prisma.whatsappMessage.count({
      where: { conversationId },
    });

    res.json({
      messages: messages.reverse(), // Reverse to show chronologically
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('GET /conversations/:conversationId/messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ========================================
// WHATSAPP CONVERSATIONS
// ========================================

/**
 * GET /api/whatsapp/conversations
 * List conversations for a business (with filtering)
 * Query: ?status=open&limit=20&offset=0
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { status = 'open', limit = '20', offset = '0' } = req.query;

    const conversations = await prisma.whatsappConversation.findMany({
      where: {
        account: { businessId },
        status: status as string,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: Math.min(parseInt(limit as string), 100),
      skip: parseInt(offset as string),
      include: {
        contact: true,
        session: true,
        ticket: true,
        _count: { select: { messages: true } },
      },
    });

    const total = await prisma.whatsappConversation.count({
      where: {
        account: { businessId },
        status: status as string,
      },
    });

    res.json({
      conversations,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('GET /conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/whatsapp/conversations/:conversationId
 * Get single conversation details
 */
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        session: true,
        ticket: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    res.json(conversation);
  } catch (error) {
    console.error('GET /conversations/:conversationId error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PATCH /api/whatsapp/conversations/:conversationId
 * Update conversation (assign session, ticket, status)
 */
router.patch('/conversations/:conversationId', authenticateToken, validateInput, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { sessionId, ticketId, status } = req.body;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const updateData: any = {};
    if (sessionId) updateData.sessionId = sessionId;
    if (ticketId) updateData.ticketId = ticketId;
    if (status) updateData.status = status;

    const updated = await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error('PATCH /conversations/:conversationId error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * POST /api/whatsapp/conversations/:conversationId/create-ticket
 * Create a support ticket from WhatsApp conversation
 */
router.post('/conversations/:conversationId/create-ticket', authenticateToken, validateInput, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { conversationId } = req.params;
    const { title, description, priority } = req.body;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        businessId,
        title: title || `WhatsApp support from ${conversation.contact.name}`,
        description: description || 'Created from WhatsApp conversation',
        priority: priority || 'medium',
        source: 'whatsapp',
        sourceRefId: conversationId,
        contactId: conversation.contactId,
      },
    });

    // Link conversation to ticket
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { ticketId: ticket.id },
    });

    await prisma.whatsappAuditLog.create({
      data: {
        accountId: conversation.accountId,
        action: 'conversation_to_ticket',
        status: 'success',
        description: `Conversation ${conversationId} linked to ticket ${ticket.id}`,
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('POST /conversations/:conversationId/create-ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// ========================================
// WHATSAPP TEMPLATES
// ========================================

/**
 * GET /api/whatsapp/templates
 * List templates for an account
 * Query: ?accountId=uuid&category=welcome
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { accountId, category } = req.query;

    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    // Verify account ownership
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: accountId as string },
    });
    if (!account || account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const where: any = { accountId };
    if (category) where.category = category;

    const templates = await prisma.whatsappTemplate.findMany({
      where,
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('GET /templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/whatsapp/templates
 * Create a new template
 */
router.post('/templates', authenticateToken, validateInput, async (req, res) => {
  try {
    const { businessId, userId } = req.user;
    const { accountId, name, category, languageCode, bodyTemplate, headerType, headerContent, footerContent } = req.body;

    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    if (!name || !bodyTemplate) return res.status(400).json({ error: 'name and bodyTemplate required' });

    // Verify account
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const template = await prisma.whatsappTemplate.create({
      data: {
        accountId,
        name,
        category: category || 'custom',
        languageCode: languageCode || 'en',
        bodyTemplate,
        headerType,
        headerContent,
        footerContent,
        createdById: userId,
      },
    });

    await prisma.whatsappAuditLog.create({
      data: {
        accountId,
        action: 'template_create',
        status: 'success',
        description: `Created template ${name}`,
        userId,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('POST /templates error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ========================================
// ANALYTICS
// ========================================

/**
 * GET /api/whatsapp/analytics
 * Get WhatsApp usage analytics
 * Query: ?accountId=uuid&sessionId=uuid&startDate=2025-01-01&endDate=2025-01-31
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const { accountId, sessionId, startDate, endDate } = req.query;

    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    // Verify ownership
    const account = await prisma.whatsappAccount.findUnique({
      where: { id: accountId as string },
    });
    if (!account || account.businessId !== businessId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = { conversation: { accountId } };
    if (sessionId) where.sessionId = sessionId;
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const totalMessages = await prisma.whatsappMessage.count({ where });
    const inMessages = await prisma.whatsappMessage.count({
      where: { ...where, direction: 'in' },
    });
    const outMessages = await prisma.whatsappMessage.count({
      where: { ...where, direction: 'out' },
    });
    const failedMessages = await prisma.whatsappMessage.count({
      where: { ...where, status: 'failed' },
    });

    // Per-session breakdown
    const sessionsData = await prisma.whatsappSession.findMany({
      where: { accountId: accountId as string },
      select: {
        id: true,
        phoneNumber: true,
        deviceName: true,
        dailySentCount: true,
        dailyRecvCount: true,
      },
    });

    res.json({
      totalMessages,
      inMessages,
      outMessages,
      failedMessages,
      successRate: totalMessages > 0 ? ((totalMessages - failedMessages) / totalMessages * 100).toFixed(2) : '100',
      sessionsData,
    });
  } catch (error) {
    console.error('GET /analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ========================================
// WEBHOOKS (from WAHA to PayAid)
// ========================================

/**
 * POST /api/whatsapp/webhooks/message
 * WAHA sends incoming messages via webhook
 * This should be triggered by WAHA configuration
 */
router.post('/webhooks/message', async (req, res) => {
  try {
    const { instance, data } = req.body;

    if (!instance || !data) return res.status(400).json({ error: 'Invalid webhook payload' });

    // Find session by providerSessionId
    const session = await prisma.whatsappSession.findFirst({
      where: { providerSessionId: instance },
      include: { account: true },
    });

    if (!session) {
      console.warn(`Session not found: ${instance}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    const fromNumber = data.from || '';
    const text = data.body || '';
    const messageType = data.type || 'text';

    // Find or create contact
    let contactIdentity = await prisma.whatsappContactIdentity.findUnique({
      where: { whatsappNumber: fromNumber },
    });

    if (!contactIdentity) {
      // Create new contact
      const contact = await prisma.contact.create({
        data: {
          businessId: session.account.businessId,
          name: fromNumber, // Use phone as temp name
          email: '',
          phone: fromNumber,
          source: 'whatsapp',
        },
      });

      contactIdentity = await prisma.whatsappContactIdentity.create({
        data: {
          contactId: contact.id,
          whatsappNumber: fromNumber,
          verified: true,
        },
      });
    }

    // Find or create conversation
    let conversation = await prisma.whatsappConversation.findUnique({
      where: {
        accountId_contactId: {
          accountId: session.accountId,
          contactId: contactIdentity.contactId,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.whatsappConversation.create({
        data: {
          accountId: session.accountId,
          contactId: contactIdentity.contactId,
          sessionId: session.id,
        },
      });
    }

    // Store message
    await prisma.whatsappMessage.create({
      data: {
        conversationId: conversation.id,
        sessionId: session.id,
        direction: 'in',
        messageType,
        whatsappMessageId: data.id || '',
        fromNumber,
        toNumber: session.phoneNumber || '',
        text,
        status: 'delivered',
        createdAt: new Date(data.timestamp * 1000 || Date.now()),
      },
    });

    // Update conversation
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastDirection: 'in',
        unreadCount: { increment: 1 },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('POST /webhooks/message error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/whatsapp/webhooks/status
 * WAHA sends message status updates (delivered, read, etc.)
 */
router.post('/webhooks/status', async (req, res) => {
  try {
    const { instance, data } = req.body;

    if (!instance || !data) return res.status(400).json({ error: 'Invalid webhook payload' });

    const { id, status, timestamp } = data;

    // Find message
    const message = await prisma.whatsappMessage.findFirst({
      where: { whatsappMessageId: id },
    });

    if (!message) {
      console.warn(`Message not found: ${id}`);
      return res.status(404).json({ error: 'Message not found' });
    }

    // Map WAHA status to our status
    let newStatus = message.status;
    let deliveredAt = message.deliveredAt;
    let readAt = message.readAt;

    if (status === 'DELIVERED') newStatus = 'delivered';
    if (status === 'READ') {
      newStatus = 'read';
      readAt = new Date(timestamp * 1000);
    }
    if (status === 'FAILED') newStatus = 'failed';

    // Update message
    await prisma.whatsappMessage.update({
      where: { id: message.id },
      data: {
        status: newStatus,
        deliveredAt: deliveredAt || (newStatus === 'delivered' ? new Date() : null),
        readAt,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('POST /webhooks/status error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

---

## File: `src/index.ts` or `src/app.ts`

Add this line to include the WhatsApp routes:

```typescript
import whatsappRoutes from './routes/whatsapp';

// ... existing app setup ...

app.use('/api/whatsapp', whatsappRoutes);
```

---

# PART 3: WEBHOOK SETUP (WAHA Configuration)

After deploying WAHA on your server, configure it to send webhooks to PayAid:

## File: WAHA configuration (docker-compose or environment)

```yaml
# Add to docker-compose.yml
environment:
  - WEBHOOK_URL=https://payaid.yourdomain.com/api/whatsapp/webhooks/message
  - WEBHOOK_EVENTS=message:received,message:ack
```

Or via WAHA API:

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WAHA_API_KEY" \
  -d '{
    "url": "https://payaid.yourdomain.com/api/whatsapp/webhooks/message",
    "events": ["message:received", "message:ack"]
  }'
```

---

# PART 4: FRONTEND (React Components)

## File: `src/components/WhatsAppAdmin.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function WhatsAppAdmin() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wahaBaseUrl, setWahaBaseUrl] = useState('http://localhost:3000');
  const [wahaApiKey, setWahaApiKey] = useState('');

  // Load accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/whatsapp/accounts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
    setLoading(false);
  };

  const handleAddAccount = async () => {
    if (!wahaBaseUrl || !wahaApiKey) {
      alert('Please enter WAHA details');
      return;
    }

    try {
      await axios.post(
        '/api/whatsapp/accounts',
        {
          channelType: 'web',
          wahaBaseUrl,
          wahaApiKey,
          businessName: 'My Business',
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setWahaBaseUrl('');
      setWahaApiKey('');
      loadAccounts();
      alert('Account added successfully!');
    } catch (error) {
      alert('Failed to add account');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>WhatsApp Administration</h2>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Connect WhatsApp Account</h3>
        <p style={{ color: '#666', fontSize: '12px' }}>
          Point to your self-hosted WAHA instance
        </p>
        <div style={{ marginBottom: '10px' }}>
          <label>WAHA Base URL:</label>
          <input
            type="text"
            value={wahaBaseUrl}
            onChange={(e) => setWahaBaseUrl(e.target.value)}
            placeholder="http://localhost:3000"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>WAHA API Key:</label>
          <input
            type="password"
            value={wahaApiKey}
            onChange={(e) => setWahaApiKey(e.target.value)}
            placeholder="Enter API key"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button onClick={handleAddAccount} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Connect Account
        </button>
      </div>

      <div>
        <h3>Existing Accounts</h3>
        {loading ? (
          <p>Loading...</p>
        ) : accounts.length === 0 ? (
          <p>No accounts connected</p>
        ) : (
          <div>
            {accounts.map((account: any) => (
              <div key={account.id} style={{ padding: '15px', marginBottom: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <h4>{account.businessName || 'Unnamed Account'}</h4>
                <p>Status: <strong>{account.status}</strong></p>
                <p>Sessions: {account.sessions.length}</p>
                <p>Templates: {account.templates.length}</p>
                <button onClick={() => handleCreateSession(account.id)} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Create Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  async function handleCreateSession(accountId: string) {
    try {
      const response = await axios.post(
        '/api/whatsapp/sessions',
        { accountId, deviceName: 'New Device' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Show QR code
      alert(`QR Code URL: ${response.data.qrCodeUrl}\n\nScan with WhatsApp on your phone.`);
      loadAccounts();
    } catch (error) {
      alert('Failed to create session');
      console.error(error);
    }
  }
}
```

## File: `src/components/WhatsAppInbox.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function WhatsAppInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const response = await axios.get('/api/whatsapp/conversations?status=open', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    try {
      const response = await axios.get(`/api/whatsapp/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText) return;

    setLoading(true);
    try {
      await axios.post(
        '/api/whatsapp/messages/send',
        { conversationId: selectedConversation, text: replyText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setReplyText('');
      handleSelectConversation(selectedConversation); // Refresh messages
      loadConversations();
    } catch (error) {
      alert('Failed to send message');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Conversation List */}
      <div style={{ width: '30%', borderRight: '1px solid #ddd', overflowY: 'auto', padding: '10px' }}>
        <h3>Conversations ({conversations.length})</h3>
        {conversations.map((conv: any) => (
          <div
            key={conv.id}
            onClick={() => handleSelectConversation(conv.id)}
            style={{
              padding: '10px',
              marginBottom: '5px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedConversation === conv.id ? '#e3f2fd' : '#fff',
            }}
          >
            <strong>{conv.contact.name}</strong>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
              {conv.contact.phone}
            </p>
            {conv.unreadCount > 0 && (
              <span style={{ backgroundColor: '#ff0000', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>
                {conv.unreadCount} unread
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Message View */}
      <div style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', borderBottom: '1px solid #ddd' }}>
              {messages.map((msg: any) => (
                <div key={msg.id} style={{ marginBottom: '15px', textAlign: msg.direction === 'out' ? 'right' : 'left' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '10px 15px',
                      backgroundColor: msg.direction === 'out' ? '#007bff' : '#e0e0e0',
                      color: msg.direction === 'out' ? '#fff' : '#000',
                      borderRadius: '8px',
                      maxWidth: '70%',
                    }}
                  >
                    <p style={{ margin: '0 0 5px 0' }}>{msg.text}</p>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #ddd' }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply..."
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
              />
              <button
                onClick={handleSendReply}
                disabled={loading}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
```

---

# PART 5: MIGRATION STEPS

```bash
# 1. Add schema to prisma/schema.prisma (from Part 1)

# 2. Run migration
npx prisma migrate dev --name add_whatsapp_module

# 3. Generate Prisma client
npx prisma generate

# 4. Create routes file src/routes/whatsapp.ts (from Part 2)

# 5. Register routes in src/app.ts or src/index.ts

# 6. Create React components (from Part 4)

# 7. Deploy WAHA container (from WAHA docs or use docker-compose)

# 8. Test:
#    - POST /api/whatsapp/accounts (add account)
#    - POST /api/whatsapp/sessions (get QR code)
#    - Scan QR with WhatsApp
#    - GET /api/whatsapp/conversations (see if messages arrive)
#    - POST /api/whatsapp/messages/send (send message)
```

---

# PART 6: STRICT VALIDATION RULES FOR CURSOR

## Before any implementation:

1. **Schema validation:**
   - [ ] All model names exactly match specification
   - [ ] All field types exactly match (String vs Int vs DateTime vs Boolean)
   - [ ] All @relations defined correctly
   - [ ] All @unique and @index decorators present
   - [ ] No additional fields added

2. **API endpoint validation:**
   - [ ] All endpoints use exact paths: `/api/whatsapp/...`
   - [ ] All HTTP methods correct (POST, GET, PATCH, DELETE)
   - [ ] All request/response payloads match spec
   - [ ] All error responses status codes correct
   - [ ] All authentication checks present

3. **Code quality:**
   - [ ] All try-catch blocks present
   - [ ] All error messages logged to console
   - [ ] All input validation present
   - [ ] All authorization checks present
   - [ ] All async/await correctly used
   - [ ] No hardcoded values except examples

4. **Database queries:**
   - [ ] All Prisma queries use include/select efficiently
   - [ ] All indexes applied
   - [ ] All relations loaded as needed
   - [ ] No N+1 queries
   - [ ] All cascade deletes configured

5. **Security:**
   - [ ] No secrets logged
   - [ ] API keys encrypted/hashed
   - [ ] Business ID checks on all endpoints
   - [ ] No SQL injection possible
   - [ ] CORS configured if needed

## When done, Cursor must verify:

- [ ] Database schema compiles without errors
- [ ] All TypeScript types correct
- [ ] All API endpoints callable and tested
- [ ] Webhook endpoint receives data from WAHA
- [ ] Messages persist to database
- [ ] Conversations created correctly
- [ ] All components render without errors

---

# FINAL CHECKLIST FOR CURSOR

Before submitting, verify:

**✅ Database:**
- [ ] Schema.prisma has all 8 models
- [ ] Migration created and ran successfully
- [ ] Prisma client generated

**✅ Backend API:**
- [ ] 15 endpoints implemented (see Part 2)
- [ ] All endpoints tested
- [ ] Webhooks working
- [ ] Error handling complete

**✅ Frontend:**
- [ ] WhatsAppAdmin component renders
- [ ] WhatsAppInbox component renders
- [ ] Real-time message updates work
- [ ] Send/receive flow tested

**✅ Integration:**
- [ ] WAHA connected and configured
- [ ] Webhooks receiving data
- [ ] Database storing messages
- [ ] CRM contacts linked automatically

**✅ Quality:**
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] All async operations awaited
- [ ] All error cases handled
- [ ] Logging present for debugging

---

## CURSOR FINAL INSTRUCTION

**DO NOT DEVIATE FROM THIS SPEC.**

Follow every schema field, every endpoint definition, every validation rule.

If something is unclear, ask for clarification BEFORE implementing.

When done, provide:
1. Summary of what was implemented
2. List of all endpoints created
3. Database schema diagram
4. Instructions to test each feature
5. Any dependencies or setup needed

**Quality over speed. Correctness over features.**

