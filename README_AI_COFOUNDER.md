# 🤖 PayAid V3 - AI Co-Founder System

## 🎯 Overview

The AI Co-Founder is a multi-agent AI system that provides intelligent business assistance across all PayAid V3 modules. It consists of 9 specialized AI agents, each focused on a specific business domain.

## 🚀 Quick Start

### 1. Access the Co-Founder

After logging in, navigate to:
```
/dashboard/cofounder
```

Or click "AI Co-Founder" in the sidebar.

### 2. Select an Agent

Choose from:
- **Co-Founder** - High-level strategy and orchestration
- **CFO** - Finance, invoices, payments, accounting
- **Sales** - Leads, deals, CRM, sales automation
- **Marketing** - Campaigns, email, WhatsApp, social media
- **HR** - Employees, payroll, leave, hiring
- **Website** - Websites, landing pages, checkout pages
- **Restaurant** - Industry-specific restaurant advice
- **Retail** - Industry-specific retail advice
- **Manufacturing** - Industry-specific manufacturing advice

### 3. Ask Questions

Examples:
- **CFO:** "Show me unpaid invoices"
- **Sales:** "What leads need follow-up?"
- **Marketing:** "Create a LinkedIn post about our new product"
- **Co-Founder:** "What should I focus on this week?"

## 🏗️ Architecture

### Components

1. **Agent Configuration** (`lib/ai/agents.ts`)
   - Defines all 9 agents
   - System prompts, keywords, data scopes

2. **Agent Router API** (`app/api/ai/cofounder/route.ts`)
   - Routes messages to appropriate agent
   - Fetches business context
   - Calls AI services (Groq → Ollama → HuggingFace)

3. **Business Context Builder** (`lib/ai/business-context-builder.ts`)
   - Fetches tenant-specific business data
   - Filters by agent data scopes
   - Ensures tenant isolation

4. **Co-Founder UI** (`app/dashboard/cofounder/page.tsx`)
   - Agent selector
   - Chat interface
   - Quick actions sidebar

### Data Flow

```
User Message
    ↓
Agent Router API
    ↓
Route to Agent (keyword-based or explicit)
    ↓
Fetch Business Context (filtered by agent data scopes)
    ↓
Build System Prompt (agent-specific)
    ↓
Call AI Service (Groq → Ollama → HuggingFace)
    ↓
Return Response to UI
```

## 🔧 Configuration

### Agent Data Scopes

Each agent can only access specific data types:

- **Co-Founder:** All data (orchestrator)
- **CFO:** Invoices, orders, expenses, payments
- **Sales:** Contacts, deals, tasks
- **Marketing:** Campaigns, email templates, WhatsApp templates
- **HR:** Employees, payroll, leave requests, candidates
- **Website:** Websites, landing pages, checkout pages, logos
- **Industry Advisors:** Orders, products (industry-specific)

### Adding a New Agent

1. Edit `lib/ai/agents.ts`
2. Add agent config:
   ```typescript
   {
     id: 'newagent',
     name: 'New Agent',
     description: 'Agent description',
     systemPrompt: 'System prompt...',
     keywords: ['keyword1', 'keyword2'],
     dataScopes: ['tenant', 'contacts'],
     tools: ['tool1', 'tool2'],
   }
   ```
3. Add routing logic in `routeToAgent()` function
4. Add icon in `app/dashboard/cofounder/page.tsx`

## 🧪 Testing

### Test Agent Routing

```powershell
# Test CFO agent
$body = @{ message = "Show me unpaid invoices"; agentId = "finance" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/ai/cofounder" -Method POST -Headers @{ "Authorization" = "Bearer $token" } -ContentType "application/json" -Body $body

# Test auto-routing
$body = @{ message = "What leads need follow-up?" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/ai/cofounder" -Method POST -Headers @{ "Authorization" = "Bearer $token" } -ContentType "application/json" -Body $body
```

### Test Business Context

The context builder automatically:
- Fetches tenant information
- Finds relevant contacts/deals/products from message
- Includes recent invoices, orders, tasks
- Provides financial overview
- Ensures all data is tenant-isolated

## 📊 AI Services

The system uses a fallback chain:

1. **Groq** (Primary) - Fast, free tier
2. **Ollama** (Fallback) - Self-hosted, local
3. **HuggingFace** (Final Fallback) - Free tier

All services are configured in:
- `lib/ai/groq.ts`
- `lib/ai/ollama.ts`
- `lib/ai/huggingface.ts`

## 🔐 Security

- **Tenant Isolation:** All queries filtered by `tenantId`
- **Authentication:** JWT token required for all requests
- **Module Access:** Requires 'ai-studio' module license
- **Data Scoping:** Agents only see data they're allowed to access

## 🚀 Future Enhancements

### Phase 2: Action Suggestions
- Agents can suggest structured actions
- Human-in-the-loop confirmations
- Execute actions via API calls

### Phase 3: N8N Integration
- Move agent logic to N8N workflows
- Deploy on Oracle Cloud Free Tier
- Zero infrastructure cost

### Phase 4: Advanced Features
- Agent-to-agent communication
- Multi-step workflows
- Custom agent training
- Industry-specific templates

## 📚 Documentation

- **Implementation:** `COFOUNDER_IMPLEMENTATION_SUMMARY.md`
- **Setup:** `ORACLE_CLOUD_N8N_SETUP.md`
- **Workflows:** `N8N_AGENT_WORKFLOWS.md`
- **Roadmap:** `PAYAID_V3_FEATURE_ROADMAP.md`

## 🐛 Troubleshooting

### Agent Not Responding
- Check AI service API keys
- Verify business context is loading
- Check Vercel logs for errors

### Wrong Agent Selected
- Check keywords in agent config
- Verify routing logic in `routeToAgent()`
- Use explicit `agentId` parameter

### No Business Context
- Verify database connection
- Check tenant has data
- Verify data scopes are correct

## 💡 Tips

1. **Be Specific:** More specific questions get better responses
2. **Use Agent Names:** Mention agent names in questions for better routing
3. **Provide Context:** Include company names, dates, etc.
4. **Try Different Agents:** Some questions work better with different agents

---

**Status:** ✅ Production Ready  
**Cost:** ₹0/month (zero infrastructure cost)  
**Last Updated:** January 2025

