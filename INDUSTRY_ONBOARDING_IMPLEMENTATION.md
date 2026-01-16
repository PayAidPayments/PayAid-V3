# Industry Onboarding Implementation Guide

**Date:** December 2025  
**Status:** ✅ **IMPLEMENTED**

---

## 🎯 Core Concept

**Industry as Presets, Not Boxes**

- Industry selection is a **shortcut** that pre-selects modules and defaults
- Every tenant has access to **base layer** of horizontal modules
- **Industry packs** can be added/removed per business unit
- Supports freelancers, multi-line businesses, and complex organizations

---

## 📋 Implementation Summary

### 1. Industry Presets System ✅
**File:** `lib/onboarding/industry-presets.ts`

**Features:**
- 19 industry presets (Freelancer, Retail, Restaurant, Manufacturing, etc.)
- Base modules (always included)
- Industry packs (optional add-ons)
- Business goals mapping
- Module recommendation engine

**Presets Include:**
- Freelancer / Solo Consultant
- Service Business
- Retail Shop / Chain
- Restaurant / Café
- Manufacturing
- E-commerce / Online Store
- Professional Services
- Healthcare, Education, Real Estate
- Logistics, Construction, Beauty
- Automotive, Hospitality, Legal
- Financial Services, Event Management
- Wholesale Distribution, Agriculture

---

### 2. Onboarding Wizard ✅
**File:** `components/onboarding/OnboardingWizard.tsx`

**Flow:**
1. **Step 1:** Select business types (multi-select)
2. **Step 2:** Select business complexity (single / multiple locations / multiple lines)
3. **Step 3:** Create business units (if multiple lines)
4. **Step 4:** Select top 3 goals
5. **Step 5:** Review recommended modules

**Features:**
- Visual industry selection with icons
- Business unit creation with industry pack assignment
- Goal-based module recommendations
- Progress tracking

---

### 3. Business Unit System ✅
**Files:**
- `components/business-units/BusinessUnitSelector.tsx`
- `app/api/business-units/route.ts`

**Features:**
- Create multiple business units per tenant
- Each unit can have different industry packs
- Business unit selector for navigation
- Shared base modules across all units

**Use Case:**
- Manufacturing Plant → Manufacturing pack
- Retail Store 1 → Retail pack
- Retail Store 2 → Retail pack
- Canteen → Restaurant pack
- All share: CRM, Finance, HR

---

### 4. Module Recommendation API ✅
**File:** `app/api/onboarding/recommend/route.ts`

**Features:**
- Analyzes industry selection
- Considers business goals
- Accounts for business complexity
- Returns recommended modules

**Output:**
```json
{
  "baseModules": ["crm", "finance", "hr", ...],
  "industryPacks": ["manufacturing", "retail"],
  "recommendedModules": ["inventory", "pos", "gst"]
}
```

---

### 5. Onboarding Completion API ✅
**File:** `app/api/onboarding/complete/route.ts`

**Features:**
- Saves onboarding data to tenant
- Enables recommended modules
- Creates business units
- Marks onboarding as complete

---

## 🗄️ Database Schema Requirements

### Required Models (Add to Prisma Schema)

```prisma
model BusinessUnit {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  location      String?
  industryPacks Json     // Array of industry pack IDs
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([tenantId, isActive])
}

model ModuleLicense {
  id          String   @id @default(cuid())
  tenantId    String
  moduleId    String   // e.g., "crm", "manufacturing", "retail"
  isActive    Boolean  @default(true)
  activatedAt DateTime @default(now())
  expiresAt   DateTime?
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, moduleId])
  @@index([tenantId])
  @@index([tenantId, isActive])
}

// Update Tenant model
model Tenant {
  // ... existing fields
  onboardingCompleted Boolean   @default(false)
  onboardingData      Json?     // Stores onboarding selections
  businessUnits       BusinessUnit[]
  moduleLicenses      ModuleLicense[]
}
```

---

## 🎨 UI Components

### Onboarding Wizard
- **Location:** `components/onboarding/OnboardingWizard.tsx`
- **Usage:** First-time user onboarding flow
- **Features:**
  - Multi-step wizard
  - Visual industry selection
  - Business unit creation
  - Goal selection
  - Module recommendations

### Business Unit Selector
- **Location:** `components/business-units/BusinessUnitSelector.tsx`
- **Usage:** Top navigation bar for multi-unit tenants
- **Features:**
  - Dropdown selector
  - Shows current unit
  - "All Business Units" option
  - Unit-specific filtering

---

## 🔄 User Flow

### First-Time User
1. User signs up → Redirected to `/onboarding`
2. Selects industries (e.g., Manufacturing + Retail)
3. Selects complexity (Multiple business lines)
4. Creates units:
   - "Manufacturing Plant" → Manufacturing pack
   - "Retail Store 1" → Retail pack
5. Selects goals (e.g., Manage inventory, File GST)
6. Reviews recommendations
7. Completes onboarding → Redirected to dashboard

### Dashboard Experience
- **Single Business:** Standard dashboard
- **Multiple Units:** Business unit selector in top bar
- **Module Grid:** Shows "Recommended for you" vs "All modules"
- **Industry-Specific:** Each unit shows relevant industry dashboard

---

## 📊 Module Mapping

### Base Modules (Always Included)
- CRM, Sales, Marketing
- Finance, Invoicing, Accounting
- HR, Communication
- AI Studio, Analytics
- Productivity Suite

### Industry Packs (Optional)
- Restaurant, Retail, Manufacturing
- Service Businesses, E-commerce
- Healthcare, Education, Real Estate
- Logistics, Construction, Beauty
- Automotive, Hospitality, Legal
- Financial, Event, Wholesale, Agriculture

---

## 💰 Pricing Model Suggestion

```
Base Plan: ₹7,999/month
├─ All 11 core modules
├─ 3 users
└─ For: Freelancers, solopreneurs

Base+ Plan: ₹15,999/month
├─ Base + unlimited users + advanced AI
└─ For: Growing teams

Industry Packs: ₹2,999/month each
├─ Add any industry pack
├─ Can combine multiple
└─ Example: Base ₹15,999 + Manufacturing ₹2,999 + Retail ₹2,999

Pro Plan: ₹29,999/month
├─ Base+ + 3 free industry packs + white-label
└─ For: SMBs with multiple lines

Enterprise: Custom
├─ Unlimited everything
└─ For: Large orgs with 50+ business units
```

---

## 🚀 Next Steps

1. **Add Database Models:**
   - Run Prisma migration to add `BusinessUnit` and `ModuleLicense` models
   - Update `Tenant` model with onboarding fields

2. **Create Onboarding Page:**
   - Route: `/onboarding`
   - Uses `OnboardingWizard` component

3. **Update Dashboard:**
   - Add `BusinessUnitSelector` to top navigation
   - Filter data by selected business unit
   - Show industry-specific dashboards

4. **Module Grid Enhancement:**
   - "Recommended for you" section
   - "All modules" section
   - Industry pack badges

5. **Settings Page:**
   - Allow adding/removing industry packs
   - Allow creating new business units
   - Allow changing business structure

---

## ✅ Implementation Status

- ✅ Industry presets system
- ✅ Onboarding wizard component
- ✅ Business unit system
- ✅ Module recommendation API
- ✅ Onboarding completion API
- ⏳ Database schema (needs migration)
- ⏳ Onboarding page route
- ⏳ Dashboard integration

---

**Files Created:**
- `lib/onboarding/industry-presets.ts`
- `components/onboarding/OnboardingWizard.tsx`
- `components/business-units/BusinessUnitSelector.tsx`
- `app/api/onboarding/recommend/route.ts`
- `app/api/onboarding/complete/route.ts`
- `app/api/business-units/route.ts`
- `app/onboarding/page.tsx`

**Ready for:** Database migration and dashboard integration

