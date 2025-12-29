# PayAid V3 - AI Multi-Agent System via N8N
## Complete Implementation Using n8n Workflows + PayAid API

---

## 🎯 Core Idea

Instead of writing custom AI agent code in Node.js, use **n8n** (self-hosted, open-source) as the **orchestration layer** that:

1. Receives messages from PayAid UI
2. Routes to the right agent workflow
3. Calls PayAid APIs to fetch context + execute actions
4. Returns structured responses back to UI

This separates **business logic** (n8n workflows) from **platform code** (PayAid).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PayAid V3 Frontend                          │
│                  (/dashboard/cofounder page)                     │
│                                                                   │
│  User: "Tell me my top 5 deals this month"                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/agents/ask
                         │ { message, agentId, tenantId }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PayAid V3 Backend (Next.js)                         │
│                                                                   │
│  POST /api/agents/ask                                           │
│  ├─ Authenticate user + tenantId                                │
│  ├─ Determine agent (CFO, Sales, HR, etc.)                      │
│  └─ Forward to N8N webhook: /webhook/agent-ask                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST to N8N
                         │ { message, agentId, tenantId, bearerToken }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              N8N (Self-Hosted Orchestration)                    │
│                                                                   │
│  Webhook Trigger: /webhook/agent-ask                            │
│  ├─ Route to agent workflow based on agentId                    │
│  │                                                               │
│  ├─ COFOUNDER_ORCHESTRATOR Workflow                             │
│  │  ├─ LLM: Analyze user message                                │
│  │  ├─ Decide: Which specialist to call?                        │
│  │  │  ├─ Call FINANCE_AGENT, SALES_AGENT, HR_AGENT, etc.      │
│  │  │  └─ Aggregate responses                                   │
│  │  └─ Return orchestrated response                             │
│  │                                                               │
│  ├─ FINANCE_AGENT Workflow                                      │
│  │  ├─ LLM: Understand finance question                         │
│  │  ├─ REST Call: GET /api/invoices (from PayAid)              │
│  │  ├─ REST Call: GET /api/accounting (accounting data)        │
│  │  ├─ LLM: Analyze data + answer                              │
│  │  └─ Return structured response                              │
│  │                                                               │
│  ├─ SALES_AGENT Workflow                                        │
│  │  ├─ LLM: Understand sales question                           │
│  │  ├─ REST Calls: GET /api/deals, /api/contacts, /api/leads   │
│  │  ├─ LLM: Summarize + suggest next actions                   │
│  │  └─ Return with action suggestions                          │
│  │                                                               │
│  ├─ HR_AGENT Workflow                                           │
│  │  ├─ REST Calls: GET /api/employees, /api/payroll            │
│  │  ├─ LLM: Answer HR questions                                │
│  │  └─ Return info + process suggestions                       │
│  │                                                               │
│  └─ [More agents: MARKETING, WEBSITE_BUILDER, RESTAURANT, etc.] │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Return response (JSON)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PayAid V3 Backend                                   │
│                                                                   │
│  Receive N8N response → Cache (optional) → Return to frontend    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ JSON response
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PayAid V3 Frontend                                  │
│                                                                   │
│  Display response + suggest actions (from LLM)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Benefits of N8N approach vs custom code

| Aspect | N8N Approach | Custom Code |
|--------|------------|-------------|
| **Workflow editing** | Visual UI, no redeploy | Code changes, restart needed |
| **Adding new agent** | Create new n8n workflow | Write new endpoint + logic |
| **API chaining** | Built-in REST node | Write fetch/axios code |
| **Error handling** | Built-in retry + fallback | Manual try-catch blocks |
| **LLM switching** | Change LLM node + prompt | Code refactor |
| **Monitoring** | N8N dashboard + logs | Custom logging |
| **Testing** | N8N test runs | Jest + manual testing |
| **Learning curve** | Low (visual) | Higher (TypeScript) |
| **Tenant isolation** | Baked into workflow (variables) | Manual checks needed |

---

## Implementation Plan

### Phase 1: Infrastructure Setup

**1. Deploy N8N (self-hosted)**

```bash
# Option A: Docker (simplest)
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e DB_SQLITE_PATH=/data \
  -v n8n_data:/data \
  n8nio/n8n

# Option B: Docker Compose with Postgres (production)
# See n8n docs for compose file

# Access at: http://localhost:5678
```

**2. Create PayAid API user in N8N**

- Generate an API key in PayAid admin (if not exists):
  - `POST /api/admin/apikeys` → returns `Bearer token`
- Store in N8N credentials
- Use in all REST calls to PayAid

**3. Link N8N to PayAid V3**

- In PayAid `.env`, add:
  ```
  N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/agent-ask
  N8N_API_KEY=your-n8n-api-key
  ```

---

### Phase 2: PayAid Backend Minimal Wiring

**Create `/api/agents/ask` endpoint** (minimal):

```typescript
// app/api/agents/ask/route.ts

import { authenticateRequest } from '@/lib/middleware/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { user, tenantId } = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, agentId = 'cofounder' } = await request.json()

  // Call N8N webhook
  const response = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
    },
    body: JSON.stringify({
      message,
      agentId,
      tenantId, // N8N uses this for context
      userId: user.id,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Agent service unavailable' },
      { status: 503 }
    )
  }

  const agentResponse = await response.json()

  return NextResponse.json({
    message: agentResponse.message,
    agent: agentId,
    suggestions: agentResponse.suggestions || [],
    actions: agentResponse.actions || [],
  })
}
```

That's it. No LLM calls, no complex logic in PayAid. All delegated to N8N.

---

### Phase 3: Build Agent Workflows in N8N

**Workflow 1: COFOUNDER_ORCHESTRATOR**

```
Webhook Trigger (receives message, agentId, tenantId)
  │
  ├─ LLM Node (Groq/OpenAI)
  │  Input: "Analyze this: '{message}'. Which agent should handle it?"
  │  Output: { selectedAgent: "SALES" | "FINANCE" | "HR", confidence }
  │
  ├─ Switch Node (based on selectedAgent)
  │  ├─ Case "SALES" → Call SALES_AGENT subworkflow
  │  ├─ Case "FINANCE" → Call FINANCE_AGENT subworkflow
  │  ├─ Case "HR" → Call HR_AGENT subworkflow
  │  └─ Default → Generic response
  │
  └─ LLM Node (Summarize & format response)
     Input: Responses from selected agent(s)
     Output: Final response to user
```

**Workflow 2: FINANCE_AGENT (Subworkflow)**

```
Webhook Trigger (receives message, tenantId)
  │
  ├─ REST Call: GET /api/invoices?tenantId={tenantId}
  │  Header: Authorization: Bearer {PAYAID_API_TOKEN}
  │
  ├─ REST Call: GET /api/accounting?tenantId={tenantId}
  │
  ├─ REST Call: GET /api/gst-reports?tenantId={tenantId}
  │
  ├─ LLM Node
  │  Input: { message, invoices, accounting, gst_reports }
  │  Prompt: "You are CFO. Answer: {message}. Use data provided."
  │  Output: { answer, insights, recommendations }
  │
  ├─ HTTP Response Node
  │  Return: {
  │    message: LLM response,
  │    data: { invoices, accounting }, // optional raw data
  │    suggestions: [...],
  │    canCreateInvoice: true,
  │    canGeneratePaymentLink: true
  │  }
```

**Workflow 3: SALES_AGENT (Subworkflow)**

```
Webhook Trigger (receives message, tenantId)
  │
  ├─ REST Call: GET /api/deals?tenantId={tenantId}&limit=50
  │
  ├─ REST Call: GET /api/leads?tenantId={tenantId}&limit=50
  │
  ├─ REST Call: GET /api/contacts?tenantId={tenantId}&limit=20
  │
  ├─ LLM Node
  │  Prompt: "You are Sales Head. Analyze deals, leads, contacts. Answer: {message}"
  │  Output: { answer, topDeals, hotLeads, nextActions }
  │
  ├─ Conditional: Does user ask to create something?
  │  If "create deal" or "create task" → suggest action
  │
  └─ HTTP Response Node
     Return: { message, suggestions, actions }
```

**Workflow 4: HR_AGENT (Subworkflow)**

```
Webhook Trigger (receives message, tenantId)
  │
  ├─ REST Call: GET /api/employees?tenantId={tenantId}
  │
  ├─ REST Call: GET /api/payroll?tenantId={tenantId}
  │
  ├─ REST Call: GET /api/leave-balances?tenantId={tenantId}
  │
  ├─ LLM Node
  │  Prompt: "You are HR Head. Answer: {message}. Use employee + payroll data."
  │  Output: { answer, onLeaveToday, payrollDue, hireNeeded }
  │
  └─ HTTP Response Node
     Return: { message, suggestions, actions }
```

Similar workflows for: **MARKETING_AGENT, WEBSITE_BUILDER_AGENT, RESTAURANT_ADVISOR, RETAIL_ADVISOR, etc.**

---

### Phase 4: Add Agent Selector UI in PayAid

**New page: `/dashboard/cofounder`**

```typescript
// app/dashboard/cofounder/page.tsx

'use client'

import { useState } from 'react'
import { ChatHistory } from '@/components/cofounder/ChatHistory'
import { AgentSelector } from '@/components/cofounder/AgentSelector'
import { MessageInput } from '@/components/cofounder/MessageInput'

const AGENTS = [
  { id: 'cofounder', name: '🤝 Co-Founder', color: 'purple' },
  { id: 'finance', name: '💰 CFO', color: 'green' },
  { id: 'sales', name: '📈 Sales Head', color: 'blue' },
  { id: 'marketing', name: '📢 CMO', color: 'pink' },
  { id: 'hr', name: '👥 HR Head', color: 'orange' },
  { id: 'website', name: '🌐 Website Architect', color: 'cyan' },
  { id: 'restaurant', name: '🍽️ Restaurant Advisor', color: 'red' },
  { id: 'retail', name: '🛍️ Retail Advisor', color: 'yellow' },
]

export default function CoFounderPage() {
  const [selectedAgent, setSelectedAgent] = useState('cofounder')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text, agent: selectedAgent }])
    setLoading(true)

    try {
      const res = await fetch('/api/agents/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, agentId: selectedAgent }),
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.message,
          agent: selectedAgent,
          suggestions: data.suggestions,
          actions: data.actions,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen gap-4">
      <AgentSelector
        agents={AGENTS}
        selected={selectedAgent}
        onSelect={setSelectedAgent}
      />
      <div className="flex-1 flex flex-col">
        <ChatHistory messages={messages} loading={loading} />
        <MessageInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  )
}
```

---

## Connecting Agent Actions to PayAid APIs

When an agent suggests an action (e.g., "Create invoice for ₹50,000"), implement:

**Action Card Component:**

```typescript
// components/cofounder/ActionCard.tsx

interface ActionProps {
  type: 'create_invoice' | 'send_email' | 'create_deal' | 'assign_lead'
  data: Record<string, any>
  tenantId: string
}

export function ActionCard({ type, data, tenantId }: ActionProps) {
  const handleExecute = async () => {
    // Route to appropriate PayAid API
    const endpoints = {
      create_invoice: '/api/invoices',
      send_email: '/api/marketing/send-email',
      create_deal: '/api/deals',
      assign_lead: '/api/leads/assign',
    }

    const res = await fetch(endpoints[type], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      // Show success + navigate to created record
    }
  }

  return (
    <div className="border p-4 rounded bg-blue-50">
      <h4 className="font-bold">{type}</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={handleExecute} className="btn btn-primary">
        Execute Action
      </button>
    </div>
  )
}
```

---

## Environment Variables for N8N Integration

```bash
# .env.local
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/agent-ask
N8N_API_KEY=n8n_api_key_here

# LLM Credentials (exposed to N8N workflows)
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk_...
HUGGINGFACE_API_KEY=hf_...

# PayAid API credentials (for N8N to call PayAid)
PAYAID_API_TOKEN=your-api-token-for-n8n
PAYAID_API_BASE_URL=https://your-payaid-domain.com
```

---

## Workflow Template Examples

### Pre-built N8N Workflows (JSON)

You can export these as JSON and import into your N8N:

**Finance Agent Workflow (minimal example):**

```json
{
  "name": "Finance Agent",
  "nodes": [
    {
      "parameters": { "method": "POST" },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://your-payaid-domain.com/api/invoices",
        "authentication": "genericCredentialType",
        "genericCredentials": "PayAidAPI",
        "sendQuery": true,
        "queryParameters": { "tenantId": "={{ $json.tenantId }}" }
      },
      "name": "Fetch Invoices",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "messageValues": [
            {
              "content": "You are a financial advisor. User asked: {{ $json.message }}. Here's their invoice data: {{ $json.invoices }}. Respond helpfully."
            }
          ]
        }
      },
      "name": "LLM (Finance)",
      "type": "n8n-nodes-base.openai",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "Fetch Invoices", "type": "main", "index": 0 } ]] },
    "Fetch Invoices": { "main": [[ { "node": "LLM (Finance)", "type": "main", "index": 0 } ]] }
  }
}
```

---

## Deployment

### Self-Hosted N8N on VPS

```bash
# 1. Rent a VPS (DigitalOcean, Hetzner, Linode - ~$5-10/month)
# 2. Install Docker
# 3. Run N8N with Postgres backend

docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e DB_TYPE=postgresdb \
  -e DB_POSTGRESDB_HOST=postgres-host \
  -e DB_POSTGRESDB_DATABASE=n8n \
  -e DB_POSTGRESDB_USER=n8n \
  -e DB_POSTGRESDB_PASSWORD=secure-password \
  -e N8N_HOST=n8n.your-domain.com \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=https \
  -e NODE_ENV=production \
  n8nio/n8n

# 4. Setup SSL (via Caddy or Nginx reverse proxy)
# 5. Create webhooks and workflows
```

### Cloud N8N (N8N Cloud)

Alternatively, use hosted n8n.cloud:

- Sign up
- Create workflows via UI
- Pay per execution ($0.06 per 1000 executions)
- Less infrastructure overhead

---

## Advantages of N8N Approach

1. **Separation of Concerns**: Business logic (workflows) vs platform (PayAid)
2. **No redeploy needed**: Update workflow → restart n8n container (fast)
3. **Visual workflow builder**: Non-developers can modify agent behavior
4. **Easy to add agents**: Just create new workflow, no code changes in PayAid
5. **Multi-tenant ready**: Each tenant's context via `tenantId` in workflow
6. **Fallback chains built-in**: Try LLM A → fallback to B → fallback to C (rule-based)
7. **Error handling**: Automatic retries, error webhooks, notifications
8. **Cost-effective**: Self-hosted or cheap cloud option
9. **Monitoring**: N8N dashboard shows all workflow executions + logs
10. **Reusable components**: Build once, clone workflows, customize per agent

---

## Implementation Timeline (Using N8N)

```
WEEK 1: N8N Setup + Basic Workflow
├─ Deploy N8N (Docker on VPS or n8n.cloud)
├─ Create PayAid API credentials for N8N
├─ Build COFOUNDER_ORCHESTRATOR workflow
├─ Wire /api/agents/ask endpoint in PayAid
└─ Test: Send message → N8N → response

WEEK 2: Build Specialist Workflows
├─ FINANCE_AGENT workflow (fetch invoices + accounting)
├─ SALES_AGENT workflow (fetch deals + leads)
├─ HR_AGENT workflow (fetch employees + payroll)
├─ MARKETING_AGENT workflow
└─ Test each agent independently

WEEK 3: UI + Integration
├─ Create /dashboard/cofounder page
├─ Implement ChatHistory + MessageInput components
├─ Build ActionCard component for agent suggestions
├─ Test end-to-end: user message → agent response → execute action
└─ Add history persistence (optional)

WEEK 4: Polish + Deployment
├─ Add more agents (Website Builder, Restaurant, Retail)
├─ Performance tuning (caching, timeouts)
├─ Security hardening (API token rotation, rate limiting)
├─ Deploy N8N to production VPS
└─ Monitor + iterate
```

---

## Summary

This N8N approach gives you:

✅ **Multi-agent system** without custom code  
✅ **Easy to maintain** – visual workflows  
✅ **Easy to extend** – add agents in hours, not days  
✅ **Scalable** – handles many tenants simultaneously  
✅ **Production-ready** – monitoring, error handling, fallbacks  
✅ **Cost-effective** – self-hosted on cheap VPS  
✅ **No redeployment** – change workflows live  

vs writing everything from scratch in TypeScript/Node, this is 80% faster and 100x more maintainable.

---

**Ready to go this route?** Next step: Pick a VPS, set up Docker + N8N, then start building workflows.