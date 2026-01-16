# Quick Start Testing - Production Docker & Backups

**Quick reference for testing the newly implemented features**

---

## 🚀 Quick Test Commands

### 1. Test Production Docker

```bash
# Step 1: Create environment file (if not exists)
cp .env.example .env.production

# Step 2: Update .env.production with your values
# At minimum, set:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - NEXTAUTH_SECRET
# - ENCRYPTION_KEY

# Step 3: Create required directories
mkdir -p nginx/ssl backups

# Step 4: Update next.config.js to enable standalone output
# Add this line to next.config.js:
# output: 'standalone',

# Step 5: Start services
docker-compose -f docker-compose.prod.yml up -d

# Step 6: Check status
docker-compose -f docker-compose.prod.yml ps

# Step 7: View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Step 8: Test health endpoint
curl http://localhost:3000/api/health

# Step 9: Stop services
docker-compose -f docker-compose.prod.yml down
```

### 2. Test Backup Script

```bash
# Option A: Test script validation
chmod +x scripts/test-backup.sh
./scripts/test-backup.sh

# Option B: Test with Docker database
# Start database first
docker-compose -f docker-compose.prod.yml up -d postgres

# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_USER=payaid
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=payaid_v3
export PGPASSWORD=your_password
export BACKUP_DIR=./backups

# Run backup
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh

# Verify backup
ls -lh backups/
```

---

## ⚠️ Important Notes

### Before Testing Docker Compose:

1. **Update next.config.js:**
   ```javascript
   const nextConfig = {
     output: 'standalone', // Add this line
     // ... rest of config
   }
   ```

2. **Required Environment Variables:**
   - `POSTGRES_PASSWORD` - Database password
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NEXTAUTH_SECRET` - Generate same way
   - `ENCRYPTION_KEY` - Generate same way

3. **Create Directories:**
   ```bash
   mkdir -p nginx/ssl backups
   ```

### Before Testing Backup:

1. **Install PostgreSQL Client Tools:**
   - Linux: `sudo apt-get install postgresql-client`
   - macOS: `brew install postgresql`
   - Windows: Install PostgreSQL or use WSL

2. **Database Must Be Running:**
   - Either via Docker Compose
   - Or external PostgreSQL instance

---

## 🔍 Troubleshooting

### Docker Compose Issues

**Problem:** `ERROR: Service 'app' failed to build`

**Solution:**
```bash
# Check if Dockerfile.prod exists
ls -la Dockerfile.prod

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Check build logs
docker-compose -f docker-compose.prod.yml build 2>&1 | tee build.log
```

**Problem:** `nginx: [emerg] open() "/etc/nginx/nginx.conf" failed`

**Solution:**
```bash
# Ensure nginx.conf exists
ls -la nginx/nginx.conf

# Create if missing (file was created above)
mkdir -p nginx
# nginx.conf should already exist
```

### Backup Script Issues

**Problem:** `pg_dump: command not found`

**Solution:**
```bash
# Install PostgreSQL client tools
# Linux:
sudo apt-get install postgresql-client

# macOS:
brew install postgresql

# Or use Docker:
docker-compose -f docker-compose.prod.yml exec postgres pg_dump ...
```

**Problem:** `Permission denied`

**Solution:**
```bash
chmod +x scripts/*.sh
```

---

## ✅ Success Indicators

### Docker Compose Success:
- ✅ All services show "Up" status
- ✅ Health endpoint returns 200 OK
- ✅ No errors in logs
- ✅ Database is accessible
- ✅ App responds to requests

### Backup Success:
- ✅ Backup file created in backups/ directory
- ✅ File has `.sql.gz` extension
- ✅ File size > 0 bytes
- ✅ No error messages
- ✅ Old backups cleaned up correctly

---

## 📋 Full Testing Guide

For detailed testing instructions, see: `TESTING_GUIDE.md`

---

**Last Updated:** January 15, 2026
