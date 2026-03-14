# Bundle sizes, heavy packages, and Prisma usage

Quick reference for the three checks you asked for.

---

## 1. Bundle sizes (`@next/bundle-analyzer`)

**Setup (done in this repo):**
- `@next/bundle-analyzer` added as devDependency.
- `next.config.js` wraps config with the analyzer when `ANALYZE=true`.
- Script: `npm run analyze`.

**Run (Windows PowerShell):**
```powershell
cd "d:\Cursor Projects\PayAid V3"
npm install
npm run analyze
```

**Run (Linux/macOS):**
```bash
cd "d:\Cursor Projects\PayAid V3"
npm install
npm run analyze
```

**Output:** After the build, HTML reports are generated (often under `.next` or project root). Open them in a browser to inspect client/server/edge bundle sizes. If the analyzer doesn’t open them automatically, check the build log for the exact paths.

**Note:** `npm run analyze` runs a full production build with 5 GB Node heap; it can take several minutes.

---

## 2. Heavy UI / AI packages (top-level deps)

From `npm ls --depth=0`:

| Category   | Packages |
|-----------|----------|
| **Icons** | `lucide-react@0.562.0` |
| **Radix UI** | `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-tooltip` |
| **Motion** | `framer-motion@12.23.26` |
| **LangChain** | `langchain@1.2.11`, `@langchain/core@1.1.16`, `@langchain/groq@1.0.3`, `@langchain/ollama@1.2.1`, `@langchain/openai@1.2.3` |
| **Other heavy** | `@handsontable/react-wrapper` + `handsontable`, `recharts`, `@tiptap/*`, `x-data-spreadsheet`, `xlsx`, `dhtmlx-gantt` |

**Filter yourself (PowerShell):**
```powershell
npm ls --depth=0 2>$null | Select-String -Pattern "lucide|radix|framer|langchain"
```

**Filter yourself (Bash):**
```bash
npm ls --depth=0 2>/dev/null | grep -E "lucide|radix|framer|langchain"
```

These are the main candidates for tree-shaking, lazy loading, or route-based code splitting to reduce client bundle size.

---

## 3. Prisma usage and N+1 risk (sample)

Project uses `app/` and `lib/` (no top-level `src/`). Sample `prisma.*` usage and one **confirmed N+1**:

### N+1 pattern (fix recommended)

**File:** `app/api/projects/[id]/tasks/route.ts` (lines 103–116)

```ts
const tasksWithHours = await Promise.all(
  tasks.map(async (task) => {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { taskId: task.id },
    })
    // ...
  })
)
```

One query per task → N+1. **Fix:** Load all time entries for the project in one query (e.g. `prisma.timeEntry.findMany({ where: { taskId: { in: tasks.map(t => t.id) } } })`), then group by `taskId` in memory and attach to each task.

---

### Other Prisma samples (no N+1 in these snippets)

- **`app/api/home/summary/route.ts`** – Uses `Promise.all([ prisma.deal.count(...), prisma.contact.count(...), ... ])`. Good: parallel independent queries, no loop.
- **`app/api/home/briefing/route.ts`** – Same pattern: multiple counts/aggregates in parallel.
- **`app/api/crm/contacts/bulk-delete/route.ts`** – `prisma.contact.updateMany`.
- **`app/api/auth/login/route.ts`** – `prisma.user.findUnique`, `prisma.user.update`.
- **`lib/ai/business-context-builder.ts`** – Several `findMany`/`count`/`aggregate`; ensure they are not inside a loop over tenants/contacts.
- **`lib/ai/langchain-setup.ts`** – `prisma.contact.findMany`, `prisma.invoice.findMany`, `prisma.deal.findMany` – confirm these are not per-item in a loop.
- **`lib/performance/database-optimization.ts`** – `prisma.contact.findMany`, `prisma.deal.findMany` – same check.

**Search for more (PowerShell):**
```powershell
Get-ChildItem -Path "d:\Cursor Projects\PayAid V3\app","d:\Cursor Projects\PayAid V3\lib" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "prisma\." | Select-Object -First 30
```

**Search (Bash):**
```bash
grep -rn "prisma\." app/ lib/ --include="*.ts" --include="*.tsx" | head -30
```

When reviewing, look for:
- `prisma.*` inside `.map()`, `for` loops, or `forEach` → likely N+1.
- Multiple sequential `findUnique`/`findFirst` for related entities → consider one query with `include` or a batch `findMany` with `where: { id: { in: [...] } }`.
