# Horizontal Scaling Architecture for PayAid V3

**Last Updated:** January 15, 2026  
**Status:** Production-Ready Blueprint

---

## Overview

This document outlines the horizontal scaling architecture for PayAid V3, enabling support for 10,000+ concurrent users.

---

## Architecture Components

### 1. Load Balancer

**Recommended:** Nginx or Traefik

**Configuration:**
- Round-robin or least-connections algorithm
- Health checks for backend services
- SSL termination
- Rate limiting at edge

**Example Nginx Configuration:**
```nginx
upstream payaid_backend {
    least_conn;
    server app1:3000 max_fails=3 fail_timeout=30s;
    server app2:3000 max_fails=3 fail_timeout=30s;
    server app3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name payaid.com;

    location / {
        proxy_pass http://payaid_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 2. Application Servers (Stateless)

**Requirements:**
- Next.js application must be stateless
- No local session storage
- All state in database or Redis

**Scaling:**
- Start with 2-3 instances
- Scale to 5-10 instances for 10,000+ users
- Auto-scale based on CPU/memory metrics

**Docker Compose Scaling:**
```bash
# Scale app service
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

**Kubernetes Example:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payaid-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payaid-app
  template:
    metadata:
      labels:
        app: payaid-app
    spec:
      containers:
      - name: app
        image: payaid/app:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

---

### 3. Database Read Replicas

**PostgreSQL Setup:**

1. **Primary Database (Write)**
   - Handles all write operations
   - Single instance for consistency

2. **Read Replicas (Read)**
   - Multiple replicas for read operations
   - Automatic replication from primary
   - Load balance read queries

**Prisma Configuration:**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Primary (write)
  directUrl = env("DATABASE_DIRECT_URL") // For migrations
}

// Use read replicas in code
const readReplicaUrl = process.env.DATABASE_READ_REPLICA_URL
const readPrisma = new PrismaClient({
  datasources: {
    db: {
      url: readReplicaUrl
    }
  }
})
```

**Connection Pooling:**
- Use PgBouncer or connection pooler
- Separate pools for read/write
- Configure pool size: `pool_size=50, max_overflow=20`

---

### 4. Redis Cluster (Caching & Rate Limiting)

**Setup:**
- Redis Cluster for high availability
- Or Redis Sentinel for failover
- Shared cache across all app instances

**Configuration:**
```yaml
# docker-compose.prod.yml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --cluster-enabled yes
  volumes:
    - redis-data:/data
```

**Usage:**
- Session storage (if needed)
- Rate limiting counters
- Cache invalidation tags
- Real-time data (WebSocket state)

---

### 5. Session Management

**Stateless Sessions (Recommended):**
- JWT tokens in cookies
- No server-side session storage
- Tokens validated on each request

**Stateful Sessions (If Needed):**
- Store in Redis
- Shared across all app instances
- Session affinity not required

---

## Scaling Strategy

### Phase 1: Single Server (Current)
- 1 app instance
- 1 database
- 1 Redis instance
- **Capacity:** 100-500 users

### Phase 2: Vertical Scaling
- Increase server resources
- Optimize database queries
- Add caching
- **Capacity:** 500-2,000 users

### Phase 3: Horizontal Scaling (This Guide)
- 2-3 app instances
- Load balancer
- Database read replicas
- Redis cluster
- **Capacity:** 2,000-10,000 users

### Phase 4: Advanced Scaling
- 5-10 app instances
- Multiple database replicas
- CDN for static assets
- Queue workers for background jobs
- **Capacity:** 10,000+ users

---

## Implementation Steps

### Step 1: Prepare Application (Stateless)

1. **Remove Local State:**
   ```typescript
   // ❌ Don't use
   const sessions = new Map()
   
   // ✅ Use Redis
   await redis.set(`session:${sessionId}`, data)
   ```

2. **Use Shared Cache:**
   ```typescript
   // ✅ All instances share cache
   await invalidateByTag(CacheTag.CONTACT, tenantId)
   ```

3. **Database Connection:**
   - Use connection pooling
   - Separate read/write connections
   - No local database state

### Step 2: Set Up Load Balancer

1. **Install Nginx:**
   ```bash
   docker run -d --name nginx \
     -p 80:80 -p 443:443 \
     -v ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
     nginx:alpine
   ```

2. **Configure Upstream:**
   - Add all app instances
   - Configure health checks
   - Set up SSL certificates

### Step 3: Database Read Replicas

1. **Create Replica:**
   ```sql
   -- On primary database
   CREATE USER replica_user WITH REPLICATION PASSWORD 'password';
   
   -- On replica server
   pg_basebackup -h primary-host -D /var/lib/postgresql/data -U replica_user -P -W
   ```

2. **Configure Replication:**
   ```conf
   # postgresql.conf
   wal_level = replica
   max_wal_senders = 3
   max_replication_slots = 3
   ```

3. **Update Application:**
   - Use read replicas for SELECT queries
   - Use primary for INSERT/UPDATE/DELETE

### Step 4: Redis Cluster

1. **Set Up Cluster:**
   ```bash
   # Create 3 Redis nodes
   redis-cli --cluster create \
     node1:6379 node2:6379 node3:6379 \
     --cluster-replicas 1
   ```

2. **Update Application:**
   ```typescript
   const redis = new Redis({
     cluster: true,
     nodes: [
       { host: 'node1', port: 6379 },
       { host: 'node2', port: 6379 },
       { host: 'node3', port: 6379 },
     ]
   })
   ```

### Step 5: Deploy Multiple App Instances

1. **Update docker-compose.prod.yml:**
   ```yaml
   app:
     deploy:
       replicas: 3
   ```

2. **Or use Kubernetes:**
   ```bash
   kubectl scale deployment payaid-app --replicas=3
   ```

---

## Monitoring & Health Checks

### Application Health Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    ollama: await checkOllama(),
  }
  
  const healthy = Object.values(checks).every(v => v === true)
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }, { status: healthy ? 200 : 503 })
}
```

### Load Balancer Health Checks

```nginx
location /health {
    proxy_pass http://payaid_backend/api/health;
    access_log off;
}
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | APM tool |
| Database Query Time | < 50ms | Query logs |
| Cache Hit Rate | > 70% | Redis stats |
| Error Rate | < 0.1% | Error tracking |
| Uptime | 99.9%+ | Status page |
| Concurrent Users | 10,000+ | Load testing |

---

## Load Testing

### Test with Artillery

```yaml
# load-test.yml
config:
  target: 'https://payaid.com'
  phases:
    - duration: 60
      arrivalRate: 100
      name: "Warm up"
    - duration: 300
      arrivalRate: 200
      name: "Sustained load"
scenarios:
  - name: "API Requests"
    flow:
      - get:
          url: "/api/contacts"
      - get:
          url: "/api/dashboard/stats"
```

```bash
artillery run load-test.yml
```

---

## Cost Estimation

### Single Server (Current)
- 1x App Server: ₹5K-10K/month
- 1x Database: ₹3K-5K/month
- **Total:** ₹8K-15K/month

### Horizontal Scaling (10K users)
- 3x App Servers: ₹15K-30K/month
- 1x Primary DB + 2x Replicas: ₹10K-20K/month
- 1x Load Balancer: ₹2K-5K/month
- Redis Cluster: ₹3K-5K/month
- **Total:** ₹30K-60K/month

---

## Rollback Plan

If scaling causes issues:

1. **Reduce Instances:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale app=1
   ```

2. **Disable Read Replicas:**
   - Update DATABASE_URL to primary only
   - Restart app instances

3. **Monitor:**
   - Check error rates
   - Monitor database connections
   - Verify cache consistency

---

## Next Steps

1. **Week 1:** Set up load balancer with 2 app instances
2. **Week 2:** Configure database read replica
3. **Week 3:** Set up Redis cluster
4. **Week 4:** Load testing and optimization
5. **Week 5:** Production deployment

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Implementation
