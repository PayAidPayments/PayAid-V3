# Testing Guide - Production Docker & Backup Scripts

**Date:** January 15, 2026  
**Purpose:** Step-by-step testing instructions for newly implemented features

---

## Prerequisites

Before testing, ensure you have:
- Docker and Docker Compose installed
- PostgreSQL client tools (`pg_dump`, `psql`) for backup testing
- Environment variables configured (see `.env.example`)

---

## 1. Testing Production Docker Compose

### Step 1: Prepare Environment Variables

Create a `.env.production` file:

```bash
# Database
POSTGRES_USER=payaid
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=payaid_v3

# JWT
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRES_IN=24h

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# App URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUBDOMAIN_DOMAIN=payaid.com

# Encryption
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# AI Services (optional for testing)
OLLAMA_MODEL=llama3.1:8b
GROQ_API_KEY=your_groq_key_if_available

# Other services (optional)
SENDGRID_API_KEY=your_sendgrid_key
```

### Step 2: Create Required Directories

```bash
# Create nginx directories
mkdir -p nginx/ssl
mkdir -p nginx/logs

# Create backup directory
mkdir -p backups
```

### Step 3: Update Next.js Config for Standalone Output

Ensure `next.config.js` has standalone output enabled:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker
  // ... rest of config
}
```

### Step 4: Test Docker Compose

```bash
# Validate configuration
docker-compose -f docker-compose.prod.yml config

# Start services (detached mode)
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check health of specific service
docker-compose -f docker-compose.prod.yml exec app curl http://localhost:3000/api/health
```

### Step 5: Verify Services

```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U payaid

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Ollama
docker-compose -f docker-compose.prod.yml exec ollama curl http://localhost:11434/api/tags

# Check App
curl http://localhost:3000/api/health
```

### Step 6: Test Scaling

```bash
# Scale app to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Verify all instances are running
docker-compose -f docker-compose.prod.yml ps | grep app

# Test load balancing (make multiple requests)
for i in {1..10}; do curl http://localhost/api/health; done
```

### Step 7: Cleanup

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 2. Testing Backup Scripts

### Option A: Test with Docker Compose Database

```bash
# Start only database service
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for database to be ready
sleep 5

# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_USER=payaid
export POSTGRES_PASSWORD=your_secure_password
export POSTGRES_DB=payaid_v3
export PGPASSWORD=your_secure_password
export BACKUP_DIR=./backups

# Make script executable
chmod +x scripts/backup-database.sh

# Run backup
./scripts/backup-database.sh

# Verify backup was created
ls -lh backups/

# Test restore (optional - creates safety backup first)
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh backups/payaid_backup_*.sql.gz
```

### Option B: Test Script Validation Only

```bash
# Run test script
chmod +x scripts/test-backup.sh
./scripts/test-backup.sh
```

### Option C: Test in Docker Container

```bash
# Start database
docker-compose -f docker-compose.prod.yml up -d postgres

# Run backup in container
docker-compose -f docker-compose.prod.yml run --rm \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_USER=payaid \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=payaid_v3 \
  -e PGPASSWORD=your_secure_password \
  -e BACKUP_DIR=/backups \
  -v $(pwd)/backups:/backups \
  backup sh /backup.sh
```

---

## 3. Common Issues & Solutions

### Issue: Docker Compose Fails to Start

**Symptoms:**
```
ERROR: Service 'app' failed to build
```

**Solutions:**
1. Check if `Dockerfile.prod` exists
2. Verify `next.config.js` has `output: 'standalone'`
3. Check Docker build logs: `docker-compose -f docker-compose.prod.yml build --no-cache`

### Issue: Nginx Configuration Error

**Symptoms:**
```
nginx: [emerg] open() "/etc/nginx/nginx.conf" failed
```

**Solutions:**
1. Ensure `nginx/nginx.conf` exists
2. Check file permissions
3. Validate nginx config: `docker-compose -f docker-compose.prod.yml exec nginx nginx -t`

### Issue: Database Connection Failed

**Symptoms:**
```
FATAL: password authentication failed
```

**Solutions:**
1. Verify `.env.prod` has correct `POSTGRES_PASSWORD`
2. Check database is running: `docker-compose -f docker-compose.prod.yml ps postgres`
3. Test connection: `docker-compose -f docker-compose.prod.yml exec postgres psql -U payaid -d payaid_v3`

### Issue: Backup Script Fails

**Symptoms:**
```
pg_dump: error: connection to server failed
```

**Solutions:**
1. Verify database is accessible
2. Check `POSTGRES_HOST` environment variable
3. Ensure `PGPASSWORD` is set correctly
4. Test connection: `psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB`

### Issue: Permission Denied

**Symptoms:**
```
Permission denied: ./scripts/backup-database.sh
```

**Solutions:**
```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
chmod +x scripts/test-backup.sh
```

---

## 4. Verification Checklist

### Docker Compose
- [ ] All services start without errors
- [ ] Health checks pass for all services
- [ ] App is accessible at http://localhost:3000
- [ ] Database is accessible and migrations run
- [ ] Redis is accessible
- [ ] Ollama is accessible
- [ ] Scaling works (multiple app instances)
- [ ] Logs are accessible

### Backup Scripts
- [ ] Script syntax is valid
- [ ] Backup creates compressed file
- [ ] Backup file has correct naming pattern
- [ ] Old backups are cleaned up correctly
- [ ] Restore script validates backup file
- [ ] Restore creates safety backup
- [ ] Restore completes successfully

---

## 5. Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] SSL certificates configured for nginx
- [ ] Database backups tested and automated
- [ ] Health checks configured
- [ ] Monitoring set up
- [ ] Log aggregation configured
- [ ] Backup retention policy set
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Security audit completed

---

## 6. Quick Test Commands

```bash
# Full stack test
docker-compose -f docker-compose.prod.yml up -d && \
sleep 10 && \
curl http://localhost:3000/api/health && \
docker-compose -f docker-compose.prod.yml ps

# Backup test
export PGPASSWORD=your_password && \
./scripts/backup-database.sh && \
ls -lh backups/

# Cleanup
docker-compose -f docker-compose.prod.yml down -v
```

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Testing
