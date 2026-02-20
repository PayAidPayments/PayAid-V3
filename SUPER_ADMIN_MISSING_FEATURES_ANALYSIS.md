# Super Admin Missing Features Analysis
## Merchant Onboarding & Compliance Management

Based on Stripe/HubSpot-level merchant onboarding requirements, here are the **critical missing features** for PayAid V3 Super Admin:

---

## ✅ **What We Already Have**

1. **Basic KYC Document Upload** (`/dashboard/settings/kyc`)
   - Document upload for PAN, Aadhaar, Bank Statement, GST, etc.
   - File validation and storage
   - ❌ **Missing**: Super Admin review/verification interface

2. **API Key Management** (`/dashboard/developer/api-keys`)
   - Merchant-level API key creation
   - Scopes and rate limits
   - ❌ **Missing**: Super Admin oversight of all merchant API keys

3. **Audit Log Model** (`AuditLog` in schema)
   - Basic audit trail structure
   - ❌ **Missing**: Super Admin audit log viewer/search

4. **Onboarding Fields** (`Tenant.onboardingCompleted`, `onboardingData`)
   - Basic onboarding state tracking
   - ❌ **Missing**: Super Admin onboarding analytics & queue

---

## 🚨 **Critical Missing Features**

### 1. **Merchant Onboarding Queue & Workflow** ⭐ HIGH PRIORITY

**What's Missing:**
- Super Admin dashboard showing all merchants in onboarding stages
- Approval/rejection workflow for KYC documents
- Status tracking: `pending_review` → `approved` → `rejected` → `needs_more_info`
- Document verification interface with OCR results

**Recommended Implementation:**
```
/super-admin/onboarding
├── Queue View (pending merchants)
├── Document Review (KYC verification)
├── Approval Workflow (approve/reject/request more info)
└── Onboarding Analytics (completion rates, drop-off points)
```

**Database Schema Additions:**
```prisma
model MerchantOnboarding {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  status          String   // pending_review, approved, rejected, needs_info
  kycStatus       String   // not_started, in_progress, verified, failed
  riskScore       Float?   // 0-100 risk assessment
  documents       Json?    // Document upload status
  reviewedBy      String?  // Super Admin user ID
  reviewedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
}

model KYCDocument {
  id              String   @id @default(cuid())
  tenantId       String
  documentType   String   // pan, aadhaar, bank_statement, etc.
  fileUrl         String
  ocrData         Json?    // OCR extraction results
  verificationStatus String // pending, verified, rejected
  verifiedBy      String?
  verifiedAt      DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
}
```

---

### 2. **Risk Assessment & Underwriting Dashboard** ⭐ HIGH PRIORITY

**What's Missing:**
- Automated risk scoring based on:
  - Business registration validity
  - Bank account verification
  - Historical chargeback data (if available)
  - Transaction patterns
- Risk tier assignment: `low`, `medium`, `high`, `blocked`
- Manual override capability for Super Admins

**Recommended Implementation:**
```
/super-admin/risk-assessment
├── Risk Score Dashboard (all merchants)
├── High-Risk Merchant Alerts
├── Risk Score Details (breakdown by factor)
└── Manual Risk Override (Super Admin action)
```

**Database Schema Additions:**
```prisma
model MerchantRiskAssessment {
  id              String   @id @default(cuid())
  tenantId       String   @unique
  riskScore      Float    // 0-100
  riskTier       String   // low, medium, high, blocked
  factors         Json     // { businessAge: 0.2, kycVerified: -0.3, ... }
  lastAssessedAt DateTime @default(now())
  assessedBy      String? // System or Super Admin ID
  notes           String?
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
}
```

---

### 3. **Super Admin API Key Oversight** ⭐ MEDIUM PRIORITY

**What's Missing:**
- View all API keys across all merchants
- Monitor API key usage patterns
- Revoke compromised keys
- Set global rate limits

**Recommended Implementation:**
```
/super-admin/api-keys
├── All Merchant API Keys (searchable table)
├── Usage Analytics (calls per merchant)
├── Security Alerts (suspicious usage patterns)
└── Bulk Actions (revoke, rotate)
```

**Enhancement Needed:**
- Extend existing `/api/developer/api-keys` to support Super Admin queries
- Add `GET /api/super-admin/api-keys` endpoint

---

### 4. **Comprehensive Audit Trail Viewer** ⭐ HIGH PRIORITY

**What's Missing:**
- Searchable audit log viewer
- Filter by: user, tenant, action type, date range
- Export audit logs for compliance
- Real-time activity feed

**Recommended Implementation:**
```
/super-admin/audit-logs
├── Activity Timeline (all platform actions)
├── Advanced Filters (user, tenant, action, date)
├── Export Functionality (CSV, PDF)
└── Suspicious Activity Alerts
```

**Enhancement Needed:**
- Enhance `AuditLog` model with more fields:
  ```prisma
  model AuditLog {
    // ... existing fields
    actionType     String   // create, update, delete, login, etc.
    ipAddress      String?
    userAgent      String?
    riskLevel      String?  // low, medium, high
    flagged        Boolean  @default(false)
  }
  ```

---

### 5. **Onboarding Analytics Dashboard** ⭐ MEDIUM PRIORITY

**What's Missing:**
- Onboarding completion rate metrics
- Drop-off point analysis (where merchants abandon)
- Time-to-approval metrics
- Conversion funnel visualization

**Recommended Implementation:**
```
/super-admin/onboarding-analytics
├── Completion Rate Chart (over time)
├── Drop-off Analysis (step-by-step abandonment)
├── Average Time to Approval
└── Conversion Funnel (signup → verified → active)
```

---

### 6. **Document Verification Interface** ⭐ HIGH PRIORITY

**What's Missing:**
- Super Admin interface to review uploaded KYC documents
- OCR data display (extracted text from documents)
- Side-by-side document comparison
- Verification workflow (approve/reject with notes)

**Recommended Implementation:**
```
/super-admin/kyc-verification
├── Document Queue (pending reviews)
├── Document Viewer (PDF/image viewer)
├── OCR Results Display (extracted data)
├── Verification Actions (approve/reject/flag)
└── Verification History (all reviewed documents)
```

---

### 7. **Compliance Management Dashboard** ⭐ HIGH PRIORITY

**What's Missing:**
- PCI-DSS compliance status tracking
- KYC/AML compliance monitoring
- Data retention policy compliance
- Compliance report generation

**Recommended Implementation:**
```
/super-admin/compliance
├── Compliance Status Overview
├── PCI-DSS Compliance Tracker
├── KYC/AML Compliance Dashboard
├── Data Retention Compliance
└── Compliance Reports (export for audits)
```

**Database Schema Additions:**
```prisma
model ComplianceRecord {
  id              String   @id @default(cuid())
  tenantId       String
  complianceType String   // PCI_DSS, KYC, AML, GDPR
  status         String   // compliant, non_compliant, pending
  lastAuditedAt  DateTime?
  nextAuditDue   DateTime?
  notes           String?
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
}
```

---

### 8. **Merchant Application Queue** ⭐ HIGH PRIORITY

**What's Missing:**
- Queue of new merchant signups awaiting approval
- Priority sorting (by risk, revenue potential, etc.)
- Bulk approval/rejection
- Application details view

**Recommended Implementation:**
```
/super-admin/applications
├── Application Queue (pending signups)
├── Application Details (business info, KYC status)
├── Quick Actions (approve, reject, request info)
└── Bulk Processing (approve multiple)
```

---

### 9. **Onboarding Progress Tracking (Super Admin View)** ⭐ MEDIUM PRIORITY

**What's Missing:**
- Visual progress dashboard showing where each merchant is in onboarding
- Step-by-step completion status
- Blockers identification (what's preventing completion)

**Recommended Implementation:**
```
/super-admin/onboarding-progress
├── Progress Overview (all merchants)
├── Step Completion Rates
├── Blocker Analysis (common issues)
└── Intervention Queue (merchants needing help)
```

---

### 10. **MFA Management & Security Controls** ⭐ MEDIUM PRIORITY

**What's Missing:**
- Super Admin view of MFA adoption across platform
- Force MFA enablement for high-risk merchants
- MFA reset capabilities
- Security policy enforcement

**Recommended Implementation:**
```
/super-admin/security/mfa
├── MFA Adoption Dashboard
├── Force MFA Enablement
├── MFA Reset Requests
└── Security Policy Settings
```

---

## 📊 **Priority Ranking**

### **Phase 1 (Critical - Implement First):**
1. ✅ Merchant Onboarding Queue & Workflow
2. ✅ Document Verification Interface
3. ✅ Risk Assessment Dashboard
4. ✅ Comprehensive Audit Trail Viewer
5. ✅ Merchant Application Queue

### **Phase 2 (Important - Implement Next):**
6. ✅ Compliance Management Dashboard
7. ✅ Onboarding Analytics Dashboard
8. ✅ Super Admin API Key Oversight

### **Phase 3 (Nice to Have):**
9. ✅ Onboarding Progress Tracking
10. ✅ MFA Management & Security Controls

---

## 🎯 **Recommended Next Steps**

1. **Create Merchant Onboarding Models** in `schema.prisma`
2. **Build Super Admin Onboarding Queue** (`/super-admin/onboarding`)
3. **Implement Document Verification Interface** (`/super-admin/kyc-verification`)
4. **Add Risk Assessment System** (`/super-admin/risk-assessment`)
5. **Enhance Audit Log Viewer** (`/super-admin/audit-logs`)

---

## 🔗 **Integration Points**

- **KYC Upload** → Connect to Super Admin verification workflow
- **API Keys** → Add Super Admin oversight layer
- **Audit Logs** → Build comprehensive viewer
- **Tenant Creation** → Trigger onboarding workflow
- **Compliance** → Link to compliance tracking dashboard

---

**This analysis ensures PayAid V3 Super Admin has Stripe-level merchant onboarding and compliance management capabilities.**
