# WhatsApp Module - API Reference Quick Guide

## 🔌 All 15 Endpoints

### Account Management

**GET /api/whatsapp/accounts**
- List all WhatsApp accounts for tenant
- Auth: Required
- Response: `{ accounts: [...] }`

**POST /api/whatsapp/accounts**
- Create new account (connect WAHA)
- Auth: Required
- Body: `{ channelType, wahaBaseUrl, wahaApiKey, businessName?, primaryPhone? }`
- Tests WAHA connection before saving

---

### Session Management

**POST /api/whatsapp/sessions**
- Create session (get QR code)
- Auth: Required
- Body: `{ accountId, deviceName, employeeId? }`
- Response: `{ id, qrCodeUrl, status, providerSessionId }`

**GET /api/whatsapp/sessions/[accountId]**
- List sessions for account
- Auth: Required
- Response: `{ sessions: [...] }`

**GET /api/whatsapp/sessions/[sessionId]/status**
- Check session connection status
- Auth: Required
- Response: `{ status, phoneNumber, lastSyncAt }`
- Queries WAHA for real-time status

---

### Messages

**POST /api/whatsapp/messages/send**
- Send WhatsApp message
- Auth: Required
- Body: `{ conversationId, text?, mediaUrl?, templateId? }`
- Requires: text OR mediaUrl OR templateId
- Response: Message object

**GET /api/whatsapp/conversations/[conversationId]/messages**
- Get message history (paginated)
- Auth: Required
- Query: `?limit=50&offset=0`
- Response: `{ messages: [...], total, limit, offset }`

---

### Conversations

**GET /api/whatsapp/conversations**
- List conversations (filterable)
- Auth: Required
- Query: `?status=open&limit=20&offset=0`
- Response: `{ conversations: [...], total, limit, offset }`

**GET /api/whatsapp/conversations/[conversationId]**
- Get single conversation
- Auth: Required
- Response: Full conversation with contact, session, messages

**PATCH /api/whatsapp/conversations/[conversationId]**
- Update conversation
- Auth: Required
- Body: `{ sessionId?, ticketId?, status? }`
- Response: Updated conversation

**POST /api/whatsapp/conversations/[conversationId]/create-ticket**
- Create support ticket from conversation
- Auth: Required
- Body: `{ title?, description?, priority? }`
- Response: `{ success, ticketId }`

---

### Templates

**GET /api/whatsapp/templates**
- List templates
- Auth: Required
- Query: `?accountId=uuid&category=welcome`
- Response: `{ templates: [...] }`

**POST /api/whatsapp/templates**
- Create template
- Auth: Required
- Body: `{ accountId, name, category?, languageCode?, bodyTemplate, headerType?, headerContent?, footerContent?, buttons? }`
- Response: Template object

---

### Analytics

**GET /api/whatsapp/analytics**
- Get usage analytics
- Auth: Required
- Query: `?accountId=uuid&sessionId=uuid&startDate=2025-01-01&endDate=2025-01-31`
- Response: `{ totalMessages, inMessages, outMessages, failedMessages, successRate, sessionsData }`

---

### Webhooks (Public - No Auth)

**POST /api/whatsapp/webhooks/message**
- Receive incoming messages from WAHA
- Auth: None
- Body: `{ instance, data: { from, body, type, id, timestamp } }`
- Auto-creates contact/conversation if needed

**POST /api/whatsapp/webhooks/status**
- Receive status updates from WAHA
- Auth: None
- Body: `{ instance, data: { id, status, timestamp } }`
- Updates message status (delivered/read/failed)

---

## 🔑 Authentication

All endpoints (except webhooks) require:
```
Authorization: Bearer <jwt_token>
```

Token contains:
- `userId` - User ID
- `tenantId` - Tenant ID (for isolation)
- `email` - User email
- `role` - User role

---

## ✅ Validation Rules

**Account Creation:**
- `wahaBaseUrl` must be valid URL
- `wahaApiKey` required
- Tests WAHA connection before saving

**Session Creation:**
- `accountId` required
- `deviceName` required
- Verifies account ownership

**Message Sending:**
- `conversationId` required
- Requires: `text` OR `mediaUrl` OR `templateId`
- Verifies conversation ownership
- Checks for active session
- Validates contact has WhatsApp number

**Template Creation:**
- `accountId` required
- `name` required
- `bodyTemplate` required
- Verifies account ownership

---

## 🚨 Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "details": [...] // Optional, for validation errors
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (no access)
- `404` - Not Found
- `500` - Server Error

---

## 📊 Response Examples

### Success Response:
```json
{
  "id": "uuid",
  "status": "active",
  ...
}
```

### Error Response:
```json
{
  "error": "Failed to create account",
  "details": [
    {
      "path": ["wahaBaseUrl"],
      "message": "Invalid URL"
    }
  ]
}
```

---

## 🔄 Webhook Payload Examples

### Incoming Message:
```json
{
  "instance": "tenant1-user1-1234567890",
  "data": {
    "from": "+919876543210",
    "body": "Hello, I need help",
    "type": "text",
    "id": "3EB0123456789ABCDEF",
    "timestamp": 1703059200
  }
}
```

### Status Update:
```json
{
  "instance": "tenant1-user1-1234567890",
  "data": {
    "id": "3EB0123456789ABCDEF",
    "status": "READ",
    "timestamp": 1703059300
  }
}
```

---

## 🧪 Testing with cURL

### Create Account:
```bash
curl -X POST http://localhost:3000/api/whatsapp/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelType": "web",
    "wahaBaseUrl": "http://localhost:3000",
    "wahaApiKey": "secret-key",
    "businessName": "Test Business"
  }'
```

### Create Session:
```bash
curl -X POST http://localhost:3000/api/whatsapp/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-uuid",
    "deviceName": "Test Phone"
  }'
```

### Send Message:
```bash
curl -X POST http://localhost:3000/api/whatsapp/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conversation-uuid",
    "text": "Hello from PayAid!"
  }'
```

---

## 📝 Notes

1. **Webhooks are public** - No authentication required (WAHA calls them)
2. **All other endpoints require auth** - JWT token in Authorization header
3. **Tenant isolation** - Users can only access their tenant's data
4. **API keys not returned** - For security, keys are excluded from responses
5. **QR codes expire** - Create new session if QR expires
6. **Status polling** - Frontend polls status every 10 seconds
7. **Message polling** - Frontend polls messages every 5 seconds

---

**Quick Reference:** Print this page for easy access during development/testing.
