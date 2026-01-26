# LangChain Integration Guide
**Status:** ✅ **IMPLEMENTED**  
**Cost:** 🆓 **FREE** (Open-source library)

---

## 📋 Overview

LangChain has been integrated into PayAid V3 to provide enhanced agent orchestration, tool composition, and chain management. It works seamlessly with your existing FREE AI stack (Ollama/Groq).

---

## ✅ What's Implemented

### 1. **LangChain Setup** (`lib/ai/langchain-setup.ts`)
- ✅ Multi-provider LLM support (Groq → Ollama → OpenAI fallback)
- ✅ Business intelligence tools
- ✅ Agent executor with tool composition
- ✅ Chain management

### 2. **Business Intelligence Tools**
The following tools are available for LangChain agents:

1. **`get_customer_segments`** - Get customer segments (VIP, Regular, Occasional, Inactive)
2. **`get_pending_invoices`** - Get pending/unpaid invoices with amounts and due dates
3. **`get_active_deals`** - Get active deals in pipeline with values and probabilities
4. **`get_churn_risk_customers`** - Get customers at risk of churning (60+ days inactive)
5. **`get_revenue_summary`** - Get revenue summary for a date range

### 3. **API Endpoints**

#### **POST `/api/ai/langchain`**
Execute queries using LangChain agents with tool composition.

**Request:**
```json
{
  "query": "Show me my top customer segments and pending invoices",
  "agentPrompt": "You are a business analyst...",
  "useLangChain": true
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the data...",
  "method": "langchain",
  "tenantId": "..."
}
```

#### **GET `/api/ai/langchain`**
Get list of available tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "get_customer_segments",
      "description": "Get customer segments..."
    },
    ...
  ],
  "count": 5
}
```

---

## 🚀 Usage

### Option 1: Use LangChain in Co-Founder Route

Enable LangChain in the Co-Founder API by setting `useLangChain: true`:

```typescript
// POST /api/ai/cofounder
{
  "message": "What are my top customer segments?",
  "useLangChain": true  // Enable LangChain agent orchestration
}
```

### Option 2: Direct LangChain API

Use the dedicated LangChain endpoint:

```typescript
// POST /api/ai/langchain
{
  "query": "Show me customers at risk of churning and pending invoices",
  "agentPrompt": "You are a business analyst. Use tools to get accurate data."
}
```

---

## 🔧 How It Works

### Agent Orchestration Flow:

```
User Query
    ↓
LangChain Agent
    ↓
Tool Selection (automatic)
    ↓
Tool Execution (get_customer_segments, get_pending_invoices, etc.)
    ↓
Data Aggregation
    ↓
LLM Response Generation
    ↓
Formatted Response
```

### Example Query Processing:

**User:** "Show me my top customer segments and pending invoices"

**LangChain Agent:**
1. Identifies need for `get_customer_segments` tool
2. Identifies need for `get_pending_invoices` tool
3. Executes both tools in parallel
4. Aggregates results
5. Generates natural language response

**Response:** "You have 15 VIP customers, 45 regular customers, 30 occasional customers, and 10 inactive customers. You also have 5 pending invoices totaling ₹50,000..."

---

## 💡 Benefits

1. **Automatic Tool Selection** - Agent automatically chooses which tools to use
2. **Multi-Step Reasoning** - Can chain multiple tool calls for complex queries
3. **Data Accuracy** - Uses real business data from your database
4. **Free** - Uses your existing Ollama/Groq stack
5. **Extensible** - Easy to add new tools

---

## 🛠️ Adding New Tools

To add a new tool, edit `lib/ai/langchain-setup.ts`:

```typescript
new DynamicStructuredTool({
  name: 'your_tool_name',
  description: 'What your tool does',
  schema: z.object({
    param1: z.string().describe('Parameter description'),
  }),
  func: async ({ param1 }) => {
    // Your tool logic
    return JSON.stringify(result, null, 2)
  },
})
```

---

## 📊 Comparison: Standard AI vs LangChain

| Feature | Standard AI | LangChain |
|---------|-------------|-----------|
| **Tool Composition** | Manual | Automatic |
| **Multi-Step Reasoning** | Limited | Advanced |
| **Data Access** | Via context | Via tools |
| **Response Accuracy** | Good | Better (uses real data) |
| **Complexity** | Simple | More structured |

---

## ⚙️ Configuration

LangChain automatically uses your existing AI providers:
1. **Groq** (if `GROQ_API_KEY` is set)
2. **Ollama** (if `OLLAMA_BASE_URL` is set)
3. **OpenAI** (if `OPENAI_API_KEY` is set, fallback)

No additional configuration needed!

---

## 🎯 Use Cases

### Best For:
- ✅ Complex queries requiring multiple data sources
- ✅ Queries that need real-time business data
- ✅ Multi-step reasoning tasks
- ✅ When you need automatic tool selection

### Standard AI is Better For:
- ✅ Simple conversational queries
- ✅ General business advice
- ✅ When you don't need tool composition

---

## 📝 Example Queries

### Query 1: Customer Analysis
```
"Show me my top 3 customer segments and identify customers at risk of churning"
```

**LangChain will:**
1. Call `get_customer_segments` tool
2. Call `get_churn_risk_customers` tool
3. Combine results and generate response

### Query 2: Financial Overview
```
"What's my revenue for the last 30 days and how many invoices are pending?"
```

**LangChain will:**
1. Call `get_revenue_summary` tool (with days=30)
2. Call `get_pending_invoices` tool
3. Combine results and generate response

---

## ✅ Status

**Implementation:** ✅ Complete  
**Testing:** Ready for use  
**Cost:** FREE (uses existing Ollama/Groq)  
**Documentation:** This guide

---

## 🔗 Related Files

- `lib/ai/langchain-setup.ts` - LangChain setup and tools
- `app/api/ai/langchain/route.ts` - LangChain API endpoint
- `app/api/ai/cofounder/route.ts` - Co-Founder with optional LangChain support

---

**LangChain is now fully integrated and ready to use!** 🎉
