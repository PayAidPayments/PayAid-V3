# Docker Setup Guide for PayAid V3

Quick setup for PostgreSQL and Redis using Docker.

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop before running commands

## 🐘 Step 1: Set Up PostgreSQL Database

### Start PostgreSQL Container

```bash
docker run -d \
  --name payaid-postgres \
  -e POSTGRES_PASSWORD=payaid123 \
  -e POSTGRES_DB=payaid_v3 \
  -p 5432:5432 \
  postgres:14
```

**Or use PowerShell:**
```powershell
docker run -d --name payaid-postgres -e POSTGRES_PASSWORD=payaid123 -e POSTGRES_DB=payaid_v3 -p 5432:5432 postgres:14
```

### Verify PostgreSQL is Running

```bash
docker ps --filter "name=payaid-postgres"
```

### Connection Details
- **Host:** localhost
- **Port:** 5432
- **Database:** payaid_v3
- **User:** postgres
- **Password:** payaid123

---

## 🔴 Step 2: Set Up Redis

### Start Redis Container

```bash
docker run -d \
  --name payaid-redis \
  -p 6379:6379 \
  redis:6-alpine
```

**Or use PowerShell:**
```powershell
docker run -d --name payaid-redis -p 6379:6379 redis:6-alpine
```

### Verify Redis is Running

```bash
docker ps --filter "name=payaid-redis"
```

### Test Redis Connection

```bash
docker exec -it payaid-redis redis-cli ping
# Should return: PONG
```

---

## ⚙️ Step 3: Update .env File

Update your `.env` file with Docker connection strings:

```env
# Database - Docker PostgreSQL
DATABASE_URL="postgresql://postgres:payaid123@localhost:5432/payaid_v3?schema=public"

# Redis - Docker Redis
REDIS_URL="redis://localhost:6379"
```

---

## 📊 Step 4: Push Database Schema

Once both containers are running:

```bash
npx prisma db push
```

This will create all tables in your PostgreSQL database.

---

## ✅ Verify Setup

### Check PostgreSQL Tables

```bash
docker exec -it payaid-postgres psql -U postgres -d payaid_v3 -c "\dt"
```

### Check Redis Connection

```bash
docker exec -it payaid-redis redis-cli ping
```

### Open Prisma Studio

```bash
npx prisma db studio
```

---

## 🛠️ Useful Docker Commands

### Stop Containers
```bash
docker stop payaid-postgres payaid-redis
```

### Start Containers
```bash
docker start payaid-postgres payaid-redis
```

### Remove Containers (⚠️ This deletes data)
```bash
docker rm -f payaid-postgres payaid-redis
```

### View Logs
```bash
docker logs payaid-postgres
docker logs payaid-redis
```

### Access PostgreSQL Shell
```bash
docker exec -it payaid-postgres psql -U postgres -d payaid_v3
```

### Access Redis CLI
```bash
docker exec -it payaid-redis redis-cli
```

---

## 🔄 Quick Setup Script (PowerShell)

Save this as `setup-docker.ps1`:

```powershell
# Check if Docker is running
if (-not (docker info 2>$null)) {
    Write-Host "Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "Starting PostgreSQL container..." -ForegroundColor Cyan
docker run -d --name payaid-postgres -e POSTGRES_PASSWORD=payaid123 -e POSTGRES_DB=payaid_v3 -p 5432:5432 postgres:14

Write-Host "Starting Redis container..." -ForegroundColor Cyan
docker run -d --name payaid-redis -p 6379:6379 redis:6-alpine

Write-Host "Waiting for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Verifying containers..." -ForegroundColor Cyan
docker ps --filter "name=payaid"

Write-Host "`n✅ Docker setup complete!" -ForegroundColor Green
Write-Host "Update .env with:" -ForegroundColor Yellow
Write-Host 'DATABASE_URL="postgresql://postgres:payaid123@localhost:5432/payaid_v3?schema=public"' -ForegroundColor White
Write-Host 'REDIS_URL="redis://localhost:6379"' -ForegroundColor White
Write-Host "`nThen run: npx prisma db push" -ForegroundColor Yellow
```

---

## 🆘 Troubleshooting

### Docker Desktop Not Running
- Start Docker Desktop application
- Wait for it to fully start (whale icon in system tray)
- Try commands again

### Port Already in Use
If port 5432 or 6379 is already in use:

```bash
# Find what's using the port
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Stop existing containers
docker stop payaid-postgres payaid-redis
docker rm payaid-postgres payaid-redis

# Or use different ports
docker run -d --name payaid-postgres -e POSTGRES_PASSWORD=payaid123 -e POSTGRES_DB=payaid_v3 -p 5433:5432 postgres:14
```

### Container Already Exists
```bash
# Remove existing container
docker rm -f payaid-postgres payaid-redis

# Then run setup commands again
```

---

## 📝 Next Steps

1. ✅ Start Docker Desktop
2. ✅ Run PostgreSQL container
3. ✅ Run Redis container
4. ✅ Update `.env` file
5. ✅ Run `npx prisma db push`
6. ✅ Verify with `npx prisma db studio`

---

**Note:** If you prefer to use Supabase (already configured), you can skip Docker setup and use the Supabase connection pooler URL instead.
