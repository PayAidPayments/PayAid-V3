# Monitoring & Error Tracking Setup Guide

This guide explains how to set up monitoring and error tracking for PayAid CRM.

## Prerequisites

- Node.js installed
- Environment variables configured

## Setup Steps

### 1. Run Setup Script

```bash
npx tsx scripts/infrastructure/setup-monitoring.ts
```

This creates:
- `config/monitoring.json` - Monitoring configuration
- `config/error-tracking.json` - Error tracking configuration

### 2. Install Monitoring Tools (Optional)

#### Sentry (Recommended)

```bash
npm install @sentry/nextjs
```

Add to `.env`:
```env
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

#### Bugsnag (Alternative)

```bash
npm install @bugsnag/js
```

Add to `.env`:
```env
BUGSNAG_API_KEY=your_bugsnag_key_here
```

### 3. Initialize Monitoring

Add to `app/layout.tsx` or `app/_app.tsx`:

```typescript
// For Sentry
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 4. API Performance Monitoring

The API monitoring is already integrated. View metrics at:

```
GET /api/monitoring/performance
```

## Configuration

See `config/monitoring.json` for:
- Health check endpoints
- Alert thresholds
- Logging configuration

## Next Steps

1. Set up alerting (email/Slack notifications)
2. Configure dashboards (Grafana, Datadog, etc.)
3. Set up log aggregation (ELK, CloudWatch, etc.)
