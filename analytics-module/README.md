# PayAid Analytics Module

**Status:** ⏳ **IN PROGRESS**  
**Purpose:** Analytics and reporting functionality including dashboards, AI features, custom reports, and insights

This is the Analytics module that will be extracted into a separate repository (`payaid-analytics`) in Phase 2.

---

## 📁 **Structure**

```
analytics-module/
├── app/
│   ├── api/
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── ai/                  # AI features
│   │   ├── reports/             # Custom reports
│   │   └── dashboards/          # Custom dashboards
│   └── dashboard/
│       ├── analytics/           # Analytics pages
│       └── ai/                  # AI pages
└── lib/
    └── analytics/                # Analytics-specific utilities
```

---

## 🔧 **Setup**

This module uses shared packages from `packages/@payaid/*`.

**Note:** This is a template structure. In the actual Phase 2 implementation, this will be a separate Next.js repository.

---

## 📋 **Routes**

### **Analytics Routes:**
- `GET /api/analytics/dashboard` - Get analytics dashboard data
- `GET /api/analytics/health-score` - Get health score
- `GET /api/analytics/lead-sources` - Get lead sources analytics
- `GET /api/analytics/team-performance` - Get team performance
- `POST /api/analytics/track` - Track an event
- `GET /api/analytics/visit` - Track a visit

### **AI Routes:**
- `POST /api/ai/chat` - AI chat
- `POST /api/ai/generate-image` - Generate image
- `POST /api/ai/generate-post` - Generate post
- `POST /api/ai/insights` - Get AI insights
- `GET /api/ai/usage` - Get AI usage stats

### **Custom Reports:**
- `GET /api/reports/custom` - List custom reports
- `POST /api/reports/custom` - Create custom report
- `GET /api/reports/custom/[id]` - Get custom report

### **Custom Dashboards:**
- `GET /api/dashboards/custom` - List custom dashboards
- `POST /api/dashboards/custom` - Create custom dashboard
- `GET /api/dashboards/custom/[id]` - Get custom dashboard

---

## 🔐 **Module Access**

All routes require the `analytics` module license. Routes use `requireModuleAccess(request, 'analytics')` from `@payaid/auth`.

---

**Status:** ⏳ **IN PROGRESS**

