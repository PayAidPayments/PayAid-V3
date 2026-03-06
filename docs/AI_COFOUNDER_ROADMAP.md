# AI Co-Founder Roadmap (Claude Cowork–style)

Status and next steps for the AI Co-founder “working partner” features.

---

## ✅ Done

### 1. Artifacts (AI Output panel)
- **Right-panel “AI Output”**: When the AI returns structured data, it is shown in a dedicated card (table, checklist, or chart placeholder).
- **Table**: Sortable view + **Download CSV**.
- **Checklist**: Read-only list with ☐/☑.
- **Backend**: API returns `artifact: { type, data, title? }`; messages store `artifact` for conversation reload.
- **Markdown fallback**: If the model doesn’t emit the structured block but writes a markdown table, we parse it and still show a table artifact + CSV.

### 2. Structured output & inline actions
- **API**: Optional `PAYAID_STRUCTURED` block in the system prompt; parsed to get `summary`, `artifact_type`, `artifact_data`, `actions[]`.
- **Actions**: `open_crm`, `open_finance`, `open_hr`, `open_deal`, `open_invoice`, `create_task`, `open_quotes` with `dealId`, `invoiceId`, `title`, `due`, `priority`, `label`.
- **UI**: Inline buttons under the last assistant message; each action links or POSTs (e.g. Create task → `/api/ai/cofounder/actions/convert-to-task`).

### 3. Specialist workflow templates
- **Templates**: Pre-built prompts per agent in `lib/ai/co-founder-templates.ts`.
  - **CFO**: GST Reconciliation, 90-day Cash Flow, Margin Analysis, Overdue Invoices.
  - **Sales**: Pipeline Health, Lost Deal Analysis, Next 10 Follow-ups, At-Risk Deals.
  - **HR**: Payroll Audit Checklist, Team Performance Scorecard, Leave Balance, High Performers.
  - **Co-Founder**: This Week’s Priorities, Business Health Snapshot, 30-Day Action Plan.
- **UI**: “Workflows” section in the left sidebar (and in the mobile specialists sheet). One click runs the template with the template’s agent (no need to switch agent first).

---

## Done (next steps)

### 4. Projects / context memory
- **Goal**: Persistent context per “project” so the AI remembers business context across chats.
- **Scope**:
  - **Projects tab** in AI Studio: create project, name it, set **instructions** (e.g. “Always consider my restaurant margins”).
  - Optional **context upload**: Supabase table references, Excel exports, or notes.
  - All chats in that project get the same context injected.
- **Storage**: Supabase tables `ai_projects` and `ai_project_contexts` (or equivalent).
- **UI**: Project selector or “Projects” in the Co-founder layout; new chat runs in selected project.

### 5. Audit trail & enterprise safety (≈ 2 days minimal)
- **Goal**: Log what the AI read and changed for trust and compliance.
- **Scope (minimal)**:
  - Log to `ai_audit_log`: prompt (hash or truncated), response size, timestamp, tenantId, userId, tables/APIs touched (if we have that), records created/updated (e.g. “created 1 task”).
  - **Settings → AI Usage**: Admin view showing “AI Co-founder viewed X deals, Y invoices, created Z tasks” (aggregated or last N entries).
- **Later**: Full “what it read / what it changed” per request, and export for compliance.

---

## After that (optional)

- **Charts in Artifacts**: Render `chart` artifact type with Recharts/Plotly (bar/line) in the AI Output panel.
- **More action types**: e.g. `send_email`, “Add to CRM as lead”.
- **Agentic execution**: Multi-step delegation (“Research competitors → build spreadsheet → create PPT”) as a later phase with tool-use orchestration.

---

## Files touched (implementation)

| Area | Files |
|------|--------|
| Types & parsing | `lib/ai/cofounder-structured.ts` |
| Templates | `lib/ai/co-founder-templates.ts` |
| API | `app/api/ai/cofounder/route.ts` |
| UI | `app/ai-studio/[tenantId]/Cofounder/page.tsx` |
| Roadmap | `docs/AI_COFOUNDER_ROADMAP.md` |
