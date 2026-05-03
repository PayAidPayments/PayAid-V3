# PayAid V3 – Unified Layout + Page-Scoped AI (Master Spec)

This document is the **full master specification** for the global UI/UX and AI blueprint. The enforceable rule lives in **`.cursor/rules/unified-layout-ai-blueprint.mdc`**. Use this doc for implementation details and code patterns.

---

## Goal

All modules (Home, CRM, Finance, HR, Inventory, Marketing, Tasks, etc.) MUST use:

- Same top nav and left module switcher
- Same dashboard band structure and card styles
- Page-specific AI assistant that ONLY talks about the tenant’s company data
- **Data and API logic MUST remain intact** – only change layout/components/styling

---

## 1. Global Layout Shell (applies to every page)

Use a single app shell component and NEVER diverge:

```tsx
// app/(tenant)/layout.tsx – USED BY ALL MODULES
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Top Nav */}
      <header className="h-14 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ModuleSwitcher />   {/* same component everywhere */}
            <span className="text-sm font-semibold tracking-tight">
              {currentModuleLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />     {/* company-wide search */}
            <ThemeToggle />      {/* light/dark, same for all modules */}
            <NotificationsBell />
            <UserMenu />         {/* avatar, profile, logout */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 py-5 flex gap-5">
        <ModuleSidebar />      {/* CRM/Finance/HR etc. – same width & style */}
        <section className="flex-1 space-y-5">
          {children}
        </section>

        {/* Page AI Assistant (required for every page) */}
        <PageAIAssistant />
      </main>
    </div>
  );
}
```

**Rules:** Top bar, module switcher, search, notifications, user menu MUST NEVER be removed or rearranged. Sidebars: same width (e.g. 260px), typography, icons, hover. Use Tailwind with the same spacing scale (no random px values).

---

## 2. Dashboard Structure (all module dashboards)

Every module dashboard MUST use the **5-band layout**:

```tsx
// GenericDashboardLayout.tsx
/*
Band 0: Top stat bar (4 cards)
Band 1: AI Command Center (full width)
Band 2: KPI cards grid (4–8 cards)
Band 3: Charts (2–3 charts)
Band 4: Detailed lists / alerts / secondary KPIs
*/

<section className="space-y-5">
  {/* Band 0 – Stat bar */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {/* 4 StatCard components */}
  </div>

  {/* Band 1 – AI Command Center */}
  <AICommandCenter />

  {/* Band 2 – KPI grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {/* 4–8 KPI StatCards */}
  </div>

  {/* Band 3 – Charts */}
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
    {/* charts for trends relevant to the module */}
  </div>

  {/* Band 4 – Alerts / lists / deep insights */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {/* overdues, health score, AI insights, tasks, etc. */}
  </div>
</section>
```

**Rules:** All dashboards use this band structure; only content per card changes by module. Dashboard KPIs MUST be driven by the same underlying queries as detail pages. Card heights: `h-28` top bar, `h-36` KPI bar, auto for chart/list cards.

---

## 3. Reusable StatCard

```tsx
// components/ui/StatCard.tsx
export function StatCard({ title, subtitle, value, trend, status, icon }: Props) {
  return (
    <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {icon}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <span className="text-xs">{trend}</span>
        )}
      </div>
      {status && (
        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">
          {status}
        </span>
      )}
    </div>
  );
}
```

All stat/KPI cards use `StatCard` (or a small variant). Charts in `ChartCard` with title + subtitle + consistent padding.

---

## 4. Page-Scoped AI Assistant

```tsx
// components/ai/PageAIAssistant.tsx
export function PageAIAssistant() {
  const context = useCurrentPageContext(); // { module, page, tenantId, filters }

  return (
    <AIAssistantPanel
      context={context}
      systemPrompt={buildPageAISystemPrompt(context)}
    />
  );
}
```

System prompt MUST enforce:

```ts
function buildPageAISystemPrompt(ctx) {
  return `
You are the PayAid V3 AI assistant for the ${ctx.module} → ${ctx.page} page.
You ONLY answer questions about this company's data in this module.
You MUST:
- Use the tenant_id = ${ctx.tenantId}.
- Use the current page filters (if any) when summarizing.
- REFUSE any personal, generic, or non-business questions with: "I can only help with your company data on this page."
- When referencing numbers, ALWAYS match the underlying API responses for this page.
- If the user asks "why", provide interpretation using the same data, not external sources.
`;
}
```

**Rules:** AI always visible as small bubble; expand shows panel. No chatting about public info or the outside world – page- and tenant-scoped only.

---

## 5. Data & consistency

- Never delete or overwrite existing live data – only adjust UI components.
- All KPIs on dashboards MUST equal the sum/count of corresponding list pages.
- All modules share one tenant data source.
- Use `formatINR()` for all currency (₹, Lakhs/Crores) – no `$` anywhere.
- Error and empty states: consistent small banners; avoid blank cards.

---

## 6. UX polish

- **Spacing:** `max-w-7xl mx-auto px-4 py-5 space-y-5`; grid `gap-4` or `gap-5`.
- **Titles:** `text-sm font-semibold` card titles, `text-xs` subtitles.
- **Interactions:** Cards `hover:shadow-md hover:-translate-y-[1px]`; buttons consistent size + icon/text order.
- **Accessibility:** `cursor-pointer` only when clickable; tooltips for truncated labels.
- **Icons:** Lucide, 16px in cards.

---

## 7. Applying this spec

For any new or existing page:

1. Wrap in AppShell (top nav + sidebar + AI).
2. Use the 5-band dashboard for module home pages.
3. Use shared StatCard / ChartCard / list components.
4. Add PageAIAssistant with page-specific system prompt.
5. Do NOT change APIs or data – only reuse via hooks.
6. Before finishing: compare with CRM & Finance dashboards – same fonts, shadows, radii, spacing, top nav, sidebar, AI presence and scope.

**This spec is the global, hard-coded design contract for PayAid V3. Every future page MUST follow it without exception.**
