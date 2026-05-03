# PayAid Accounting Module

**Status:** ⏳ **IN PROGRESS**  
**Purpose:** Accounting functionality including expenses, financial reports, and GST reports

This is the Accounting module that will be extracted into a separate repository (`payaid-accounting`) in Phase 2.

---

## 📁 **Structure**

```
accounting-module/
├── app/
│   ├── api/
│   │   ├── accounting/          # Accounting endpoints
│   │   │   ├── expenses/        # Expense management
│   │   │   └── reports/         # Financial reports
│   │   └── gst/                 # GST reports
│   └── dashboard/
│       └── accounting/          # Accounting pages
└── lib/
    └── accounting/               # Accounting-specific utilities
```

---

## 🔧 **Setup**

This module uses shared packages from `packages/@payaid/*`.

**Note:** This is a template structure. In the actual Phase 2 implementation, this will be a separate Next.js repository.

---

## 📋 **Routes**

### **Expense Routes:**
- `GET /api/accounting/expenses` - List all expenses
- `POST /api/accounting/expenses` - Create a new expense
- `GET /api/accounting/expenses/[id]` - Get an expense
- `PATCH /api/accounting/expenses/[id]` - Update an expense
- `DELETE /api/accounting/expenses/[id]` - Delete an expense

### **Financial Reports:**
- `GET /api/accounting/reports/pl` - Profit & Loss statement
- `GET /api/accounting/reports/balance-sheet` - Balance sheet
- `GET /api/accounting/reports/cash-flow` - Cash flow statement (future)

### **GST Reports:**
- `GET /api/gst/gstr-1` - GSTR-1 report
- `GET /api/gst/gstr-3b` - GSTR-3B report
- `GET /api/gst/search` - GST search

---

## 🔐 **Module Access**

All routes require the `accounting` or `finance` module license. Routes use `requireModuleAccess(request, 'accounting')` or `requireModuleAccess(request, 'finance')` from `@payaid/auth`.

---

**Status:** ⏳ **IN PROGRESS**

