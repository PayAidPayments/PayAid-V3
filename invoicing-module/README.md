# PayAid Invoicing Module

**Status:** ⏳ **IN PROGRESS**  
**Purpose:** Invoicing functionality including invoice creation, payment links, PDF generation, and more

This is the Invoicing module that will be extracted into a separate repository (`payaid-invoicing`) in Phase 2.

---

## 📁 **Structure**

```
invoicing-module/
├── app/
│   ├── api/
│   │   └── invoices/          # Invoice management
│   │       ├── route.ts       # List/Create invoices
│   │       └── [id]/
│   │           ├── route.ts   # Get/Update/Delete invoice
│   │           ├── pdf/       # PDF generation
│   │           ├── generate-payment-link/  # Payment links
│   │           ├── send-with-payment/      # Send invoice
│   │           └── track-payment-link/      # Track payment
│   └── dashboard/
│       └── invoices/           # Invoice pages
└── lib/
    └── invoicing/              # Invoicing-specific utilities
```

---

## 🔧 **Setup**

This module uses shared packages from `packages/@payaid/*`.

**Note:** This is a template structure. In the actual Phase 2 implementation, this will be a separate Next.js repository.

---

## 📋 **Routes**

### **Invoice Routes:**
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/[id]` - Get an invoice
- `PATCH /api/invoices/[id]` - Update an invoice
- `DELETE /api/invoices/[id]` - Delete an invoice
- `GET /api/invoices/[id]/pdf` - Generate PDF
- `POST /api/invoices/[id]/generate-payment-link` - Generate payment link
- `POST /api/invoices/[id]/send-with-payment` - Send invoice with payment link
- `GET /api/invoices/[id]/track-payment-link` - Track payment link

---

## 🔐 **Module Access**

All routes require the `invoicing` or `finance` module license. Routes use `requireModuleAccess(request, 'invoicing')` or `requireModuleAccess(request, 'finance')` from `@payaid/auth`.

**Note:** The module ID may be `invoicing` or `finance` depending on the module reorganization. Check the current module structure.

---

## 📝 **Features**

- Invoice creation with GST calculation
- PDF generation
- Payment link generation (PayAid Payments)
- Invoice email sending
- Payment tracking
- Customer management integration
- Order integration

---

**Status:** ⏳ **IN PROGRESS**

