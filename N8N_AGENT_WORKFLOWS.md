# N8N Agent Workflows for PayAid Co-Founder

## 🎯 Overview

This guide shows how to create N8N workflows for each PayAid AI agent. These workflows can be called from PayAid V3 to power the multi-agent system.

---

## 📋 Prerequisites

- N8N installed and running (see `ORACLE_CLOUD_N8N_SETUP.md`)
- PayAid V3 deployed with N8N webhook URL configured
- Access to PayAid API endpoints

---

## 🔧 Workflow 1: Co-Founder Orchestrator

**Purpose:** Routes messages to appropriate specialist agents

### Nodes:

1. **Webhook Trigger**
   - Method: POST
   - Path: `cofounder`
   - Response Mode: "Respond to Webhook"

2. **Function: Route to Agent**
   ```javascript
   const message = $json.body.message.toLowerCase();
   const agentId = $json.body.agentId;
   const tenantId = $json.body.tenantId;
   
   // If agent explicitly selected, use it
   if (agentId) {
     return {
       agentId,
       message: $json.body.message,
       tenantId
     };
   }
   
   // Auto-route based on keywords
   const keywords = {
     finance: ['invoice', 'payment', 'gst', 'expense', 'accounting', 'revenue', 'cash flow', 'billing'],
     sales: ['lead', 'deal', 'sales', 'pipeline', 'customer', 'prospect', 'conversion', 'revenue'],
     marketing: ['campaign', 'marketing', 'email', 'social media', 'whatsapp', 'content', 'advertising'],
     hr: ['employee', 'payroll', 'attendance', 'leave', 'hiring', 'recruitment', 'team', 'staff'],
     website: ['website', 'landing page', 'checkout', 'seo', 'traffic', 'conversion', 'online'],
     restaurant: ['restaurant', 'menu', 'order', 'kitchen', 'table', 'food', 'dining'],
     retail: ['retail', 'product', 'inventory', 'pos', 'store', 'stock', 'catalog'],
     manufacturing: ['manufacturing', 'production', 'material', 'quality', 'supply chain', 'factory']
   };
   
   let bestMatch = 'cofounder';
   let maxMatches = 0;
   
   for (const [agent, agentKeywords] of Object.entries(keywords)) {
     const matches = agentKeywords.filter(kw => message.includes(kw)).length;
     if (matches > maxMatches) {
       maxMatches = matches;
       bestMatch = agent;
     }
   }
   
   return {
     agentId: bestMatch,
     message: $json.body.message,
     tenantId
   };
   ```

3. **HTTP Request: Call PayAid API**
   - Method: POST
   - URL: `https://payaid-v3.vercel.app/api/ai/cofounder`
   - Authentication: Header
     - Name: `Authorization`
     - Value: `Bearer {{ $json.tenantId }}` (or use JWT from webhook)
   - Body: JSON
     ```json
     {
       "message": "{{ $json.message }}",
       "agentId": "{{ $json.agentId }}"
     }
     ```

4. **Respond to Webhook**
   - Response Body: `{{ $json }}`

---

## 🔧 Workflow 2: Finance Agent (CFO)

**Purpose:** Handles all finance-related queries

### Nodes:

1. **Webhook Trigger**
   - Path: `finance`

2. **HTTP Request: Get Business Context**
   - Method: GET
   - URL: `https://payaid-v3.vercel.app/api/dashboard/stats`
   - Headers: Authorization with tenant token

3. **Function: Build Finance Context**
   ```javascript
   const stats = $json;
   
   return {
     message: $('Webhook').item.json.body.message,
     context: {
       revenue: stats.revenue || 0,
       pendingInvoices: stats.pendingInvoices || 0,
       pendingAmount: stats.pendingAmount || 0,
       expenses: stats.expenses || 0,
       cashFlow: (stats.revenue || 0) - (stats.expenses || 0)
     }
   };
   ```

4. **HTTP Request: Call AI**
   - URL: `https://payaid-v3.vercel.app/api/ai/cofounder`
   - Body includes finance context

5. **Respond to Webhook**

---

## 🔧 Workflow 3: Sales Agent

**Purpose:** Handles sales, leads, and pipeline queries

### Similar structure but:
- Webhook path: `sales`
- Fetch leads/deals data
- Build sales-specific context

---

## 🔧 Workflow 4: Marketing Agent

**Purpose:** Handles marketing campaigns and analytics

### Similar structure but:
- Webhook path: `marketing`
- Fetch campaign data
- Build marketing-specific context

---

## 🔧 Workflow 5: HR Agent

**Purpose:** Handles HR, payroll, and employee queries

### Similar structure but:
- Webhook path: `hr`
- Fetch employee/payroll data
- Build HR-specific context

---

## 🔧 Advanced: Multi-Agent Collaboration

**Workflow:** "COFOUNDER_COLLABORATION"

When Co-Founder needs multiple specialists:

1. **Webhook receives complex query**
2. **Function: Split query into sub-queries**
   ```javascript
   // Example: "Analyze revenue and suggest marketing campaigns"
   // Splits into: finance query + marketing query
   ```
3. **Parallel HTTP Requests:**
   - Call Finance Agent
   - Call Marketing Agent
4. **Function: Combine responses**
5. **Respond with combined insights**

---

## 🔧 Advanced: Action Execution

**Workflow:** "AGENT_ACTIONS"

When agent suggests an action (e.g., "Create invoice"):

1. **Webhook receives action request**
2. **Function: Parse action**
   ```javascript
   const action = $json.body.action; // e.g., "create_invoice"
   const params = $json.body.params;
   ```
3. **Switch Node: Route to action**
   - Case: `create_invoice` → Call `/api/invoices` POST
   - Case: `create_payment_link` → Call `/api/payments/create-link` POST
   - Case: `create_campaign` → Call `/api/marketing/campaigns` POST
4. **Respond with action result**

---

## 📊 Workflow Templates

### Template: Basic Agent Workflow

```
Webhook → Function (Process) → HTTP Request (PayAid API) → Respond
```

### Template: Agent with Data Fetching

```
Webhook → HTTP Request (Get Data) → Function (Build Context) → HTTP Request (AI) → Respond
```

### Template: Agent with Actions

```
Webhook → Function (Parse Action) → Switch (Route Action) → HTTP Request (Execute) → Respond
```

---

## 🔐 Security

1. **Validate JWT tokens** in webhook
2. **Check tenant isolation** (never mix tenant data)
3. **Rate limiting** (prevent abuse)
4. **Log all requests** (audit trail)

---

## 🚀 Deployment

1. **Export workflows** from N8N (JSON)
2. **Version control** in Git
3. **Import to production** N8N instance
4. **Test each workflow** individually
5. **Monitor performance** and optimize

---

## 📈 Monitoring

- **N8N Execution Logs:** Check workflow runs
- **PayAid API Logs:** Monitor agent calls
- **Response Times:** Optimize slow workflows
- **Error Rates:** Fix failing workflows

---

**Status:** Ready to Implement
**Cost:** ₹0 (self-hosted on Oracle Cloud)

