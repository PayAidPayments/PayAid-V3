# Knowledge & RAG AI + Chatbot CRM Logger - Setup Guide

## 🚀 Quick Start

### 1. Database Migration

Run the Prisma migration to add the Knowledge & RAG models:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration (if using Prisma Migrate)
npx prisma migrate dev --name add_knowledge_rag_models

# Or push schema directly (for development)
npx prisma db push
```

### 2. Access Knowledge & RAG AI

1. Navigate to `/dashboard/knowledge` in your PayAid dashboard
2. The page is now available in the AI Studio section of the sidebar

### 3. Upload Your First Document

**Option A: Via API (with pre-extracted text)**
```bash
curl -X POST https://your-domain.com/api/knowledge/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Company Policy",
    "description": "Employee handbook",
    "category": "policy",
    "tags": ["hr", "policy"],
    "fileUrl": "https://storage.example.com/policy.pdf",
    "fileName": "policy.pdf",
    "fileSize": 1024000,
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "extractedText": "Your document text here..."
  }'
```

**Option B: Via Upload Endpoint (with file)**
```bash
curl -X POST https://your-domain.com/api/knowledge/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "title=Company Policy" \
  -F "description=Employee handbook" \
  -F "category=policy" \
  -F "tags=hr,policy" \
  -F "extractedText=Your document text here..."
```

### 4. Query Your Knowledge Base

```bash
curl -X POST https://your-domain.com/api/knowledge/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the leave policy?",
    "limit": 5
  }'
```

### 5. Embed Chatbot on Your Website

**Option A: Using React Component**
```tsx
import WebsiteChatbotWidget from '@/components/chatbot/WebsiteChatbotWidget'

export default function HomePage() {
  return (
    <>
      <WebsiteChatbotWidget
        chatbotId="your-chatbot-id"
        position="bottom-right"
        primaryColor="#53328A"
        greetingMessage="Hello! How can I help you?"
        autoGreet={true}
        autoGreetDelay={3000}
      />
    </>
  )
}
```

**Option B: Using Embed Script**
```html
<script 
  src="https://your-domain.com/chatbot-embed.js"
  data-chatbot-id="your-chatbot-id"
  data-position="bottom-right"
  data-color="#53328A"
  data-greeting="Hello! How can I help you?"
  data-auto-greet="true"
  data-auto-greet-delay="3000"
></script>
```

---

## 📋 Features Implemented

### ✅ Knowledge & RAG AI
- [x] Document upload and management
- [x] Document Q&A with RAG
- [x] Source citations
- [x] Query audit trail
- [x] Category filtering
- [x] Frontend interface

### ✅ Chatbot CRM Logger
- [x] Automatic lead capture
- [x] Contact extraction (name, email, phone, company)
- [x] CRM contact creation
- [x] Deal creation for qualified leads
- [x] Conversation tracking
- [x] Embeddable widget

---

## 🔧 Configuration

### Knowledge & RAG AI Settings

Currently uses text-based search. To enable vector search:

1. **Set up Vector Database** (Qdrant/Milvus/Pinecone)
2. **Implement Embeddings** in `lib/knowledge/document-processor.ts`
3. **Update Query Endpoint** to use vector similarity search

### Chatbot Settings

Configure in your chatbot settings:
- `leadQualification`: Enable/disable auto-qualification
- `autoGreet`: Show greeting automatically
- `autoGreetDelay`: Delay before showing greeting (ms)

---

## 🚧 TODO: Production Enhancements

### File Upload
- [ ] Integrate with storage service (S3, Cloudinary)
- [ ] Implement file upload endpoint
- [ ] Add file processing queue

### Text Extraction
- [ ] PDF text extraction (pdf-parse)
- [ ] DOCX text extraction (mammoth)
- [ ] Image OCR for scanned documents

### Vector Database
- [ ] Integrate Qdrant/Milvus/Pinecone
- [ ] Implement embedding generation
- [ ] Add vector similarity search

### Advanced Features
- [ ] Hybrid search (BM25 + semantic)
- [ ] Re-ranking for better results
- [ ] Multi-document query support
- [ ] Lead scoring based on conversation
- [ ] Auto-assign leads to sales reps
- [ ] Follow-up automation

---

## 📊 API Reference

### Knowledge Documents

**List Documents**
```
GET /api/knowledge/documents?category=sop&search=policy
```

**Get Document**
```
GET /api/knowledge/documents/[id]
```

**Delete Document**
```
DELETE /api/knowledge/documents/[id]
```

**Query Knowledge Base**
```
POST /api/knowledge/query
{
  "query": "Your question",
  "documentId": "optional-doc-id",
  "limit": 5
}
```

**Get Query History**
```
GET /api/knowledge/queries?documentId=doc-id&limit=50
```

### Chatbot

**Send Message**
```
POST /api/chatbots/[id]/chat
{
  "message": "Hello",
  "sessionId": "optional-session-id",
  "visitorId": "optional-visitor-id"
}
```

**Log Lead to CRM**
```
POST /api/chatbots/[id]/crm-logger
{
  "visitorId": "visitor-id",
  "sessionId": "session-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "company": "Acme Corp",
  "message": "Interested in your product"
}
```

---

## 🎯 Testing

1. **Test Knowledge & RAG AI:**
   - Upload a document with extracted text
   - Query the knowledge base
   - Check source citations
   - Review query history

2. **Test Chatbot CRM Logger:**
   - Embed chatbot on test page
   - Start a conversation
   - Provide name/email/phone
   - Check if contact/deal is created in CRM

---

## 📝 Notes

- **Text Extraction**: Currently requires pre-extracted text. Full extraction coming soon.
- **Vector Search**: Currently uses text matching. Vector search coming soon.
- **File Storage**: Currently uses placeholder URLs. Storage integration needed.
- **Lead Qualification**: Basic keyword matching. AI-based qualification coming soon.

---

**Status:** ✅ Core features implemented and ready for testing  
**Next Priority:** File upload integration and vector database setup

