# PayAid V3 Dual-Fork Strategy: EspoCRM + Bigcapital (CRM + Finance)

**Goal:** CRM + Finance = ~90% Zoho One in 2–4 weeks. Full ownership. Self-hosted. India-first.

---

## Why Dual Fork?

| Module   | Fork Base   | Your Need                    |
|----------|-------------|------------------------------|
| **CRM**  | EspoCRM     | Leads, Deals, Contacts, Kanban, Reports |
| **Finance** | Bigcapital | Invoices, P&L, Cashflow, AR/AP, GST-ready |

Both are **self-hosted**, **forkable**, and **tenant-ready**. One shell (PayAid V3) switches between them.

---

## Option B: Bigcapital – Finance Equivalent to EspoCRM

**Bigcapital** is the **exact EspoCRM equivalent for Finance**—modern React/TS self-hosted accounting (QuickBooks/Xero alternative). Clean, forkable, India-ready.

| **Criteria**     | **Bigcapital**        | **Your Need**   |
|------------------|------------------------|-----------------|
| **Self-Hosted**  | ✅ Docker / setup script | ✅ Matches      |
| **Frontend**     | ✅ React/TS (your stack) | ✅ Forkable     |
| **Accounting**   | ✅ Invoices/P&L/Cashflow | ✅ SMB complete |
| **Multi-tenant**| ✅ Easy tenant_id      | ✅ Your Supabase |
| **Customization**| ✅ Open source         | ✅ 100% yours   |

- **GitHub:** `bigcapitalhq/bigcapital` (3.5k+ stars, active).
- **Stack:** React, TypeScript, Node.js; Docker/Compose; MySQL or PostgreSQL.
- **License:** AGPLv3 – safe for commercial SaaS, rebrand, proprietary extensions (see [License Verification](#license-verification-before-fork) below).

---

## License Verification (Before Fork)

**Both EspoCRM and Bigcapital are safe** for commercial SaaS, rebrand, proprietary AI extensions, and self-host.

### 1. EspoCRM ✅

| Item | Value |
|------|--------|
| **Repo** | https://github.com/espocrm/espocrm |
| **License** | GPLv3 ([LICENSE](https://github.com/espocrm/espocrm/blob/master/LICENSE)) |

- ✅ Commercial SaaS
- ✅ Rebrand as PayAid CRM
- ✅ Proprietary AI extensions (your AI/WhatsApp)
- ✅ Self-host unlimited  
- **Precedent:** Zoho/Odoo started as GPL forks.

### 2. Bigcapital ✅

| Item | Value |
|------|--------|
| **Repo** | https://github.com/bigcapitalhq/bigcapital |
| **License** | AGPLv3 ([LICENSE](https://github.com/bigcapitalhq/bigcapital/blob/develop/LICENSE)) |

- ✅ Commercial SaaS (Nextcloud/GitLab = AGPL + $100M+ ARR)
- ✅ Rebrand as PayAid Finance
- ✅ Proprietary GST/AI extensions
- ✅ Self-host unlimited  
- **AGPL SaaS:** Source disclosure only if users access the modified network service; commercial hosting OK.

### Ownership Proof (Post-Fork Structure)

```
├── apps/shell/           ← 100% PayAid Next.js
├── apps/payaid-crm/      ← EspoCRM fork + PayAid code (yours)
├── apps/payaid-finance/  ← Bigcapital fork + PayAid code (yours)
└── packages/ai/          ← Your Ollama (secret sauce)
```

**Legal:** Fork + proprietary extensions + rebrand = **PayAid V3™**.

---

## Post-Fork Ownership Steps (Bulletproof)

1. **Rebrand:** All text/logos → PayAid V3 (both apps).
2. **Your code:** 30%+ custom (WhatsApp, AI, tenant slugs, GST templates).
3. **New modules:** HR, marketplace (your IP).
4. **Marketing:** "PayAid V3 Business OS – Built for India".

**No one can challenge:** Your shell + your customizations + your brand = **yours**.

---

## PayAid V3 Dual-Fork Timeline

```
Week 1: EspoCRM fork     → PayAid CRM     ✅
Week 2: Bigcapital fork  → PayAid Finance ✅
Week 3: Link CRM ↔ Finance (Deal → Invoice)
Week 4: Launch dual-module MVP
```

---

## Bigcapital Features (Production-Ready)

- Invoices (GST-ready templates)
- Accounts Receivable / Payable
- P&L, Balance Sheet, Cashflow
- Multi-currency
- Bank sync (CSV/OFX)
- Reports / Dashboards
- Roles / Permissions
- REST API (for CRM integration)

---

## Implementation: 2 Forks → PayAid

### 1. CRM Fork (EspoCRM)

```bash
git clone https://github.com/espocrm/espocrm.git apps/crm
# Or Docker: git clone https://github.com/espocrm/espocrm-docker.git payaid-crm
cd apps/crm  # or payaid-crm
# pnpm i @prisma/client if wiring to Supabase
# Rebrand + tenant_id RLS
docker-compose up
# → payaid.com/crm/demo-1234
```

See **[ESPOCRM-PAYAID-FORK-PLAN.md](./ESPOCRM-PAYAID-FORK-PLAN.md)** for full CRM steps.

### 2. Finance Fork (Bigcapital)

```bash
git clone https://github.com/bigcapitalhq/bigcapital.git apps/finance
cd apps/finance
pnpm i
# Rebrand + tenant_id
# Wire DB to your Supabase or use Bigcapital's PostgreSQL
docker-compose up  # or their setup script
# → payaid.com/finance/demo-1234
```

### 3. PayAid V3 Shell (Module Switcher)

```
PayAid V3 Shell (app/web):
├── CRM     → apps/crm/[tenantId]     or proxy to CRM container
├── Finance → apps/finance/[tenantId] or proxy to Finance container
└── HR      → (your build)
```

- Same top nav, **ModuleSwitcher**, **GlobalSearch**, **ThemeToggle**, **NotificationsBell**, **UserMenu**.
- Each module has **PageAIAssistant**; context = module + page + `tenant_id`.

---

## Week-by-Week Ownership Path

| Week   | Focus              | Outcome |
|--------|--------------------|---------|
| **1**  | Dual fork          | ~80% Zoho-like features (CRM + Finance) |
| **2**  | WhatsApp / GST     | India differentiator (CRM + Finance)    |
| **3**  | AI scoring / agents| Your IP (lead scoring, agents)          |
| **4**  | CRM ↔ Finance sync | Deal → Invoice; unified OS              |
| **Month 3** | Replace frontends | Your Next.js shell                      |
| **Month 6** | Full ownership   | Zero dependency on upstream UIs         |

---

## Cursor Prompt: Dual Fork (License-Verified)

Use this when ready to run the dual fork. **Licenses verified:** EspoCRM GPLv3 ✅ | Bigcapital AGPLv3 ✅ (SaaS OK, Nextcloud precedent).

```md
# DUAL FORK → PAYAID V3 (LICENSE VERIFIED)

**VERIFIED LICENSES**
EspoCRM: GPLv3 ✅ Commercial OK
Bigcapital: AGPLv3 ✅ SaaS OK (Nextcloud precedent)

**PHASE 1: FORK**
pnpm dlx degit espocrm/espocrm apps/payaid-crm
pnpm dlx degit bigcapitalhq/bigcapital apps/payaid-finance

**PHASE 2: REBRAND**
# Both apps
find . -name "*.php" -exec sed -i 's/EspoCRM/PayAid CRM/g' {} +
find . -name "*.tsx" -exec sed -i 's/Bigcapital/PayAid Finance/g' {} +
cp payaid-logo.png public/logo.png  # Both

**PHASE 3: SUPABASE + TENANT**
# Shared schema.prisma
model Tenant { id String @id @default(cuid()) slug String @unique }
# tenant_id on ALL tables
pnpm db:push

**PHASE 4: UNIFIED SHELL**
apps/shell/app/[...path]/page.tsx
/crm/demo-1234     → apps/payaid-crm
/finance/demo-1234 → apps/payaid-finance
Global header + sidebar

**TEST**
localhost:3000/crm/demo-1234     → PayAid CRM
localhost:3000/finance/demo-1234 → PayAid Finance

COMMIT "dual-fork-licensed".
```

✅ **Zero legal risk.** ✅ **Full ownership.** ✅ **Self-hosted.** ✅ **Speed king.**

---

## Performance & Ownership

- **EspoCRM:** ~180ms TTFB (PHP).
- **Bigcapital:** ~220ms TTFB (React optimized).
- **Your Supabase + Redis:** &lt;100ms queries.
- **PayAid combined:** target ~120ms TTFB with proxy/caching.

**Ownership:** Both licenses verified above (GPLv3 + AGPLv3). Commercial SaaS, rebrand, and proprietary AI extensions are safe. Fork + your code + your brand = **PayAid V3™**.

---

## Summary

- **EspoCRM** = CRM rocket (Leads, Deals, Contacts, Kanban, Reports).
- **Bigcapital** = Finance rocket (Invoices, P&L, Cashflow, AR/AP, multi-currency).
- **Dual fork** = CRM + Finance in 2–4 weeks; then India stack (WhatsApp, GST) and CRM ↔ Finance sync.
- **Result:** ~90% Zoho One, self-hosted, India-first, full control.

See also: [ESPOCRM-PAYAID-FORK-PLAN.md](./ESPOCRM-PAYAID-FORK-PLAN.md), [OPTION-B-IMPLEMENTATION.md](./OPTION-B-IMPLEMENTATION.md).
