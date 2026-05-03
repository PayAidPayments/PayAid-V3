# PayAid V3 - Configuration & Deployment (Self-Hosted)

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## 1. Environment Configuration

### Development Environment Setup

**Local Development with Docker Compose:**

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: payaid
      POSTGRES_PASSWORD: payaid123
      POSTGRES_DB: payaid_v3
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Start Development Environment:**
```bash
docker-compose -f docker-compose.dev.yml up -d
npm install
npm run dev
```

### Staging Environment Specifications

**Requirements:**
- Separate database (staging)
- Separate Redis instance
- Test payment gateway credentials
- Staging domain (staging.payaid.in)

**Environment Variables:**
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/payaid_staging
REDIS_URL=redis://staging-redis:6379
NEXT_PUBLIC_APP_URL=https://staging.payaid.in
```

### Production Environment Specifications

**Requirements:**
- Production database (with backups)
- Redis cluster (high availability)
- Production payment gateway credentials
- SSL certificates (Let's Encrypt)
- Monitoring and logging

**Environment Variables:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/payaid_prod
DATABASE_READ_URL=postgresql://user:pass@prod-db-read:5432/payaid_prod
REDIS_URL=redis://prod-redis:6379
NEXT_PUBLIC_APP_URL=https://app.payaid.in
```

### Environment Variables List

#### Core Application Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `DATABASE_READ_URL` | ⚠️ Optional | Read replica connection | `postgresql://user:pass@read-host:5432/db` |
| `REDIS_URL` | ✅ Yes | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | ✅ Yes | JWT signing secret (min 32 chars) | `generate-random-64-char-hex` |
| `JWT_EXPIRES_IN` | ⚠️ Optional | Token expiry (default: 24h) | `24h` |
| `ENCRYPTION_KEY` | ✅ Yes | Encryption key (64-char hex) | `generate-random-64-char-hex` |
| `NODE_ENV` | ✅ Yes | Environment (development/production) | `production` |
| `APP_URL` | ✅ Yes | Application URL | `https://app.payaid.in` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Public application URL | `https://app.payaid.in` |

#### PayAid Payments (Admin - Platform Payments)

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYAID_ADMIN_API_KEY` | ✅ Yes | Admin API key (36-digit merchant key) |
| `PAYAID_ADMIN_SALT` | ✅ Yes | Admin SALT (for hash calculation) |
| `PAYAID_ADMIN_ENCRYPTION_KEY` | ⚠️ Optional | Admin encryption key |
| `PAYAID_ADMIN_DECRYPTION_KEY` | ⚠️ Optional | Admin decryption key |
| `PAYAID_PAYMENTS_PG_API_URL` | ✅ Yes | Payment gateway API URL |

#### Email Service

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | ⚠️ Optional | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | ⚠️ Optional | Default sender email |
| `SMTP_HOST` | ⚠️ Optional | SMTP server host |
| `SMTP_PORT` | ⚠️ Optional | SMTP server port |
| `SMTP_USER` | ⚠️ Optional | SMTP username |
| `SMTP_PASSWORD` | ⚠️ Optional | SMTP password |

#### SMS Service

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | ⚠️ Optional | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ⚠️ Optional | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ⚠️ Optional | Twilio phone number |

#### AI Services

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ⚠️ Optional | Groq API key |
| `OLLAMA_API_URL` | ⚠️ Optional | Ollama API URL (local) |
| `HUGGINGFACE_API_KEY` | ⚠️ Optional | Hugging Face API key |
| `GOOGLE_AI_API_KEY` | ⚠️ Optional | Google AI Studio API key |

#### Monitoring (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `STATSD_HOST` | ⚠️ Optional | StatsD server host |
| `STATSD_PORT` | ⚠️ Optional | StatsD server port |
| `SENTRY_DSN` | ⚠️ Optional | Sentry DSN for error tracking |

### Configuration File Structure

**`.env` File:**
```bash
# Core
DATABASE_URL=postgresql://user:password@localhost:5432/payaid_v3
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# Application
NODE_ENV=development
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PayAid Payments
PAYAID_ADMIN_API_KEY=your-api-key
PAYAID_ADMIN_SALT=your-salt
PAYAID_PAYMENTS_PG_API_URL=https://pg-api-url.com

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@payaid.com

# AI
GROQ_API_KEY=your-groq-key
OLLAMA_API_URL=http://localhost:11434
```

### Secrets Management Approach

**Development:**
- `.env.local` file (gitignored)
- Local secrets

**Production:**
- Environment variables (Vercel/self-hosted)
- Docker secrets (Docker Swarm/Kubernetes)
- Vault (Hashicorp Vault) - future

**Generate Secrets:**
```bash
# Generate JWT_SECRET (64-char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (64-char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Feature Flags

**Database Model:**
```typescript
// prisma/schema.prisma
model FeatureToggle {
  id        String   @id @default(cuid())
  tenantId  String
  featureId String
  enabled   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, featureId])
}
```

**Usage:**
```typescript
// lib/features/check.ts
export async function isFeatureEnabled(
  tenantId: string,
  featureId: string
): Promise<boolean> {
  const toggle = await prisma.featureToggle.findUnique({
    where: { tenantId_featureId: { tenantId, featureId } }
  })
  return toggle?.enabled ?? false
}
```

---

## 2. Self-Hosted Deployment Process

### Prerequisites

**Hardware Requirements:**

| User Volume | CPU | RAM | Storage | Network |
|-------------|-----|-----|---------|---------|
| < 100 users | 4 cores | 8 GB | 100 GB SSD | 100 Mbps |
| 100-500 users | 8 cores | 16 GB | 250 GB SSD | 500 Mbps |
| 500-2000 users | 16 cores | 32 GB | 500 GB SSD | 1 Gbps |
| 2000+ users | 32+ cores | 64+ GB | 1 TB+ SSD | 10 Gbps |

**Software Requirements:**
- Ubuntu 22.04 LTS (or similar Linux distribution)
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (or Caddy)
- Certbot (for SSL certificates)

### Installation Steps

**Step 1: Clone Repository**
```bash
git clone https://github.com/PayAidPayments/PayAid-V3.git
cd PayAid-V3
```

**Step 2: Create Docker Compose File**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-payaid}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-payaid_v3}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-payaid}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-payaid}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-payaid_v3}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      NODE_ENV: production
      APP_URL: https://${DOMAIN}
      NEXT_PUBLIC_APP_URL: https://${DOMAIN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Step 3: Create Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Step 4: Create Nginx Configuration**
```nginx
# nginx.conf
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Step 5: Set Up SSL Certificates**
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
```

**Step 6: Configure Environment Variables**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Step 7: Initialize Database**
```bash
# Generate Prisma Client
docker-compose run app npx prisma generate

# Run migrations
docker-compose run app npx prisma migrate deploy

# Seed database (optional)
docker-compose run app npm run db:seed
```

**Step 8: Start Services**
```bash
docker-compose up -d
```

### Health Checks

**Application Health:**
```bash
curl http://localhost:3000/api/system/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-15T12:00:00Z"
}
```

**Database Health:**
```bash
docker-compose exec postgres pg_isready -U payaid
```

**Redis Health:**
```bash
docker-compose exec redis redis-cli ping
```

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Firewall rules configured (ports 80, 443)
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Health checks passing

### Deployment Steps

**1. Build Application:**
```bash
docker-compose build app
```

**2. Run Database Migrations:**
```bash
docker-compose run app npx prisma migrate deploy
```

**3. Start Services:**
```bash
docker-compose up -d
```

**4. Verify Deployment:**
```bash
# Check logs
docker-compose logs -f app

# Check health
curl https://your-domain.com/api/system/health
```

### Rollback Procedures

**Rollback to Previous Version:**
```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose build app
docker-compose up -d
```

**Database Rollback:**
```bash
# Rollback last migration
docker-compose run app npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
docker-compose exec postgres pg_restore -U payaid -d payaid_v3 backup.dump
```

### Database Migrations

**Run Migrations:**
```bash
# Development
npm run db:migrate

# Production (no prompts)
npx prisma migrate deploy
```

**Create Migration:**
```bash
npx prisma migrate dev --name add_new_field
```

**Zero-Downtime Migration Strategy:**
1. Add new column as nullable
2. Deploy application code
3. Backfill data
4. Make column non-nullable (if needed)
5. Add indexes (concurrently)

---

## 3. Database Setup & Management

### Database Choice

**PostgreSQL 15+**
- ACID compliance
- JSON support
- Full-text search
- Extensions (PostGIS, etc.)

### Database Initialization Scripts

**Initial Setup:**
```bash
# Create database
createdb payaid_v3

# Run migrations
npx prisma migrate deploy

# Seed data (optional)
npm run db:seed
```

### Backup Strategy

**Automated Backups:**
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U payaid payaid_v3 | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Cron Job:**
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

**Backup Retention:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Stop application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Test functionality

### Database Performance Tuning

**Connection Pooling:**
```typescript
// lib/db/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
```

**Indexes:**
- All `tenantId` columns indexed
- Foreign keys indexed
- Frequently queried fields indexed
- Composite indexes for common queries

**Query Optimization:**
- Use `select` to limit fields
- Use `include` sparingly
- Avoid N+1 queries
- Use pagination for large datasets

### Connection Pooling Configuration

**Prisma Connection Pool:**
- Max connections: 100 (default)
- Connection timeout: 10 seconds
- Idle timeout: 30 seconds

**Read Replica Configuration:**
```typescript
// lib/db/prisma-read.ts
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL,
    },
  },
})
```

### Storage Volume Management

**Docker Volumes:**
```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

**Backup Volumes:**
```bash
# Backup volume
docker run --rm -v payaid_v3_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## 4. Scaling & Performance

### Vertical Scaling

**Upgrade Server Hardware:**
- Increase CPU cores
- Increase RAM
- Upgrade to SSD storage
- Increase network bandwidth

### Horizontal Scaling

**Multiple Application Instances:**
```yaml
# docker-compose.scale.yml
services:
  app:
    # ... configuration
    deploy:
      replicas: 3
```

**Load Balancer (Nginx):**
```nginx
upstream app {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}
```

### Load Balancing Approach

**Nginx Load Balancer:**
- Round-robin (default)
- Least connections
- IP hash (sticky sessions)

**Health Checks:**
```nginx
upstream app {
    server app1:3000 max_fails=3 fail_timeout=30s;
    server app2:3000 max_fails=3 fail_timeout=30s;
    server app3:3000 max_fails=3 fail_timeout=30s backup;
}
```

### Database Optimization

**Read Replicas:**
- All GET requests use read replica
- Write requests use primary
- Automatic failover

**Query Optimization:**
- Indexes on frequently queried fields
- Composite indexes for common queries
- Query analysis and optimization

**Connection Pooling:**
- PgBouncer for connection pooling
- Max connections per instance
- Connection reuse

### Caching Strategy

**Multi-Layer Caching:**
- L1: In-memory (per instance)
- L2: Redis (shared across instances)
- Cache warming on login
- Automatic invalidation on writes

**Cache Keys:**
- Format: `module:tenantId:resourceId`
- Example: `contacts:tenant123:contact456`

**TTL:**
- Short-lived: 5 minutes (frequently updated)
- Medium-lived: 1 hour (moderately updated)
- Long-lived: 24 hours (rarely updated)

### CDN Usage

**Static Assets:**
- Next.js static files
- Images and media
- Fonts and CSS

**CDN Configuration:**
- Cloudflare (free tier)
- AWS CloudFront (paid)
- Self-hosted CDN (future)

### Performance Benchmarks

**Target Metrics:**
- Response time: < 500ms (95th percentile)
- Cache hit rate: > 70%
- Database query time: < 100ms
- API throughput: 1000+ requests/second

**Load Testing:**
```bash
# Run load tests
npm run test:load

# k6 load test
k6 run load-tests/k6-load-test.js
```

---

## 5. Monitoring & Logging

### Logging Framework

**Winston Logger:**
```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### Log Levels

- **ERROR:** Errors that need immediate attention
- **WARN:** Warnings (deprecated features, etc.)
- **INFO:** General information (requests, responses)
- **DEBUG:** Detailed debugging information

### Log Aggregation Strategy

**File Rotation:**
- Daily rotation
- Compress old logs (gzip)
- Retention: 30 days

**Centralized Logging (Future):**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki (Grafana Loki)
- Cloud logging (Vercel, AWS CloudWatch)

### Error Tracking

**Sentry Integration:**
```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Performance Monitoring

**StatsD Integration:**
```typescript
// lib/monitoring/statsd.ts
import StatsD from 'node-statsd'

const statsd = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: parseInt(process.env.STATSD_PORT || '8125'),
})

export function trackMetric(name: string, value: number) {
  statsd.timing(name, value)
}
```

**Metrics Tracked:**
- API response times
- Database query times
- Cache hit rates
- Error rates
- Request counts

### Application Performance Monitoring (APM)

**Self-Hosted Options:**
- Prometheus + Grafana
- OpenTelemetry
- Jaeger (distributed tracing)

### Health Check Endpoints

**System Health:**
```typescript
// app/api/system/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace(),
  }
  
  const healthy = Object.values(checks).every(c => c.status === 'ok')
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  })
}
```

### Alert Thresholds

**Alert Conditions:**
- Error rate > 1%
- Response time > 1 second (95th percentile)
- Database connection failures
- Redis connection failures
- Disk usage > 80%

**Notification Channels:**
- Email alerts
- Slack notifications
- PagerDuty (future)

### Dashboard Setup

**Grafana Dashboard:**
- API metrics
- Database metrics
- Cache metrics
- System metrics (CPU, RAM, disk)

---

## 6. Data Backup & Disaster Recovery

### Backup Frequency

- **Database:** Daily (full backup)
- **Files:** Daily (incremental)
- **Configuration:** Weekly

### Backup Destination

**Local Backups:**
- `/backups` directory
- Compressed (gzip)
- Encrypted (future)

**Off-Site Backups:**
- S3-compatible storage
- Encrypted at rest
- Versioned

### Backup Restoration Testing

**Monthly Testing:**
1. Restore from backup
2. Verify data integrity
3. Test application functionality
4. Document results

### RTO and RPO Targets

- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 24 hours

### Disaster Recovery Runbook

**1. Identify Disaster:**
- Database corruption
- Server failure
- Data loss

**2. Assess Impact:**
- Affected services
- Data loss estimate
- Recovery time estimate

**3. Execute Recovery:**
- Stop application
- Restore from backup
- Verify data integrity
- Restart services

**4. Post-Recovery:**
- Verify functionality
- Monitor for issues
- Document incident
- Update procedures

---

## Summary

PayAid V3 supports self-hosted deployment with Docker Compose, PostgreSQL, Redis, and Nginx. The deployment process includes environment configuration, database setup, SSL certificates, monitoring, and backup strategies.

**Key Deployment Features:**
- ✅ Docker Compose for easy deployment
- ✅ Environment variable configuration
- ✅ Database migrations (Prisma)
- ✅ SSL/TLS with Let's Encrypt
- ✅ Multi-layer caching (Redis)
- ✅ Read replicas support
- ✅ Automated backups
- ✅ Health checks and monitoring
- ✅ Horizontal scaling support
- ✅ Disaster recovery procedures
