# Next Steps: UI Components for Multi-Currency & Tax Engine

**Date:** February 17, 2026  
**Status:** ✅ Database migration complete, ready for UI development

---

## ✅ **COMPLETED**

- ✅ Database schema updated
- ✅ Prisma client generated
- ✅ API endpoints created
- ✅ Services implemented

---

## 🚧 **NEXT: UI COMPONENTS TO CREATE**

### **1. Currency Components**

#### **CurrencySelector.tsx**
**Location:** `components/currency/CurrencySelector.tsx`  
**Purpose:** Dropdown selector for currency selection  
**Features:**
- List all supported currencies
- Show currency symbol and name
- Default to tenant's default currency
- Used in invoice creation/edit forms

#### **CurrencyDisplay.tsx**
**Location:** `components/currency/CurrencyDisplay.tsx`  
**Purpose:** Display currency-formatted amounts  
**Features:**
- Format amounts with currency symbol
- Handle different decimal places (JPY = 0, INR = 2)
- Show exchange rate if different from base currency

#### **CurrencySettingsPage.tsx**
**Location:** `app/dashboard/settings/currencies/page.tsx`  
**Purpose:** Configure tenant currency settings  
**Features:**
- Set default currency
- Select supported currencies
- View/manage exchange rates
- Update rates from API

---

### **2. Tax Components**

#### **TaxRuleSelector.tsx**
**Location:** `components/tax/TaxRuleSelector.tsx`  
**Purpose:** Select tax rule for invoice line items  
**Features:**
- List available tax rules
- Show tax type and rate
- Filter by tax type
- Show exemption rules

#### **TaxBreakdown.tsx**
**Location:** `components/tax/TaxBreakdown.tsx`  
**Purpose:** Display tax breakdown on invoices  
**Features:**
- Show tax by type (GST, VAT, Sales Tax)
- Display per-item tax breakdown
- Show total tax amount
- Highlight exemptions

#### **TaxRulesPage.tsx**
**Location:** `app/dashboard/settings/tax/page.tsx`  
**Purpose:** Manage tax rules  
**Features:**
- List all tax rules
- Create/edit/delete tax rules
- Set default tax rule
- Configure exemptions
- View tax rule history

---

### **3. Invoice Form Updates**

#### **Update Invoice Creation Form**
**Location:** `app/finance/[tenantId]/Invoices/new/page.tsx`  
**Changes:**
- Add currency selector
- Add tax rule selector per line item
- Show tax breakdown as items are added
- Calculate totals with multi-currency support

#### **Update Invoice Edit Form**
**Location:** `app/finance/[tenantId]/Invoices/[id]/page.tsx`  
**Changes:**
- Display currency
- Allow currency change (with exchange rate update)
- Show tax breakdown
- Allow per-item tax rule changes

---

## 📋 **IMPLEMENTATION ORDER**

### **Priority 1: Core Functionality**
1. ✅ CurrencySelector component
2. ✅ TaxRuleSelector component
3. ✅ Update invoice creation form
4. ✅ Update invoice display

### **Priority 2: Settings Pages**
5. ✅ Currency settings page
6. ✅ Tax rules management page

### **Priority 3: Enhanced Features**
7. ✅ Tax breakdown display
8. ✅ Currency conversion display
9. ✅ Exchange rate management UI

---

## 🎯 **QUICK START**

### **1. Create Currency Selector**

```tsx
// components/currency/CurrencySelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Select } from '@/components/ui/select'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/converter'

export function CurrencySelector({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (currency: string) => void
  className?: string
}) {
  const currencies = Object.values(SUPPORTED_CURRENCIES)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.symbol} {currency.name} ({currency.code})
        </option>
      ))}
    </select>
  )
}
```

### **2. Create Tax Rule Selector**

```tsx
// components/tax/TaxRuleSelector.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Select } from '@/components/ui/select'

export function TaxRuleSelector({
  value,
  onChange,
  className,
}: {
  value?: string
  onChange: (taxRuleId: string) => void
  className?: string
}) {
  const { data } = useQuery({
    queryKey: ['tax-rules'],
    queryFn: async () => {
      const res = await fetch('/api/tax/rules', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return { rules: [] }
      return res.json()
    },
  })

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">Select tax rule...</option>
      {data?.rules?.map((rule: any) => (
        <option key={rule.id} value={rule.id}>
          {rule.name} ({rule.taxType} {rule.rate}%)
        </option>
      ))}
    </select>
  )
}
```

---

## ✅ **TESTING CHECKLIST**

After creating UI components:

- [ ] Currency selector works in invoice form
- [ ] Tax rule selector works per line item
- [ ] Tax calculation updates correctly
- [ ] Currency conversion displays correctly
- [ ] Exchange rates can be updated
- [ ] Tax rules can be created/edited
- [ ] Multi-currency invoices display correctly
- [ ] Tax breakdown shows all tax types

---

**Ready to start implementing UI components!**
