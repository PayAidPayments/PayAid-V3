# Comprehensive Docker Cleanup Script
# Removes unused Docker containers and images based on .env configuration

Write-Host "`n🧹 Analyzing Docker usage and cleaning up unused containers...`n" -ForegroundColor Cyan

# Check current disk usage
Write-Host "📊 Current Docker disk usage:" -ForegroundColor Yellow
docker system df
Write-Host ""

# Check .env file for configuration
$envFile = ".env"
$useAiGateway = $false
$ollamaBaseUrl = ""
$databaseUrl = ""
$redisUrl = ""

if (Test-Path $envFile) {
    Write-Host "📋 Checking .env configuration..." -ForegroundColor Yellow
    
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "USE_AI_GATEWAY\s*=\s*(true|True|TRUE)") {
        $useAiGateway = $true
        Write-Host "  ✅ USE_AI_GATEWAY=true found - AI services ARE being used" -ForegroundColor Green
    } else {
        Write-Host "  ❌ USE_AI_GATEWAY not set or false - AI services NOT being used" -ForegroundColor Red
    }
    
    if ($envContent -match "OLLAMA_BASE_URL\s*=\s*(.+)") {
        $ollamaBaseUrl = $matches[1].Trim()
        if ($ollamaBaseUrl -like "*localhost*" -or $ollamaBaseUrl -like "*127.0.0.1*") {
            Write-Host "  ✅ Using local Ollama - Docker Ollama IS needed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Using cloud Ollama - Docker Ollama NOT needed" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  OLLAMA_BASE_URL not set - Assuming cloud Ollama" -ForegroundColor Yellow
    }
    
    if ($envContent -match "DATABASE_URL\s*=\s*(.+)") {
        $databaseUrl = $matches[1].Trim()
        if ($databaseUrl -like "*localhost*" -or $databaseUrl -like "*127.0.0.1*") {
            Write-Host "  ✅ Using local Postgres - Docker Postgres IS needed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Using external Postgres - Docker Postgres NOT needed" -ForegroundColor Red
        }
    }
    
    if ($envContent -match "REDIS_URL\s*=\s*(.+)") {
        $redisUrl = $matches[1].Trim()
        if ($redisUrl -like "*localhost*" -or $redisUrl -like "*127.0.0.1*") {
            Write-Host "  ✅ Using local Redis - Docker Redis IS needed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Using external Redis - Docker Redis NOT needed" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ⚠️  .env file not found - Assuming services are NOT configured" -ForegroundColor Yellow
}

Write-Host "`n🗑️  Starting cleanup...`n" -ForegroundColor Yellow

$totalFreed = 0

# Remove AI Services if not using gateway
if (-not $useAiGateway) {
    Write-Host "Removing AI Gateway services (not configured)..." -ForegroundColor Yellow
    
    # Stop containers
    docker stop payaid-ai-gateway payaid-text-to-speech payaid-speech-to-text payaid-image-to-text 2>$null
    
    # Remove containers
    docker rm payaid-ai-gateway payaid-text-to-speech payaid-speech-to-text payaid-image-to-text 2>$null
    
    # Remove images
    docker rmi payaidv3-ai-gateway:latest 2>$null
    docker rmi payaidv3-text-to-speech:latest 2>$null
    docker rmi payaidv3-speech-to-text:latest 2>$null
    docker rmi payaidv3-image-to-text:latest 2>$null
    
    Write-Host "  ✅ AI services removed (~26.6GB)" -ForegroundColor Green
    $totalFreed += 26.6
} else {
    Write-Host "  ⏭️  Keeping AI services (USE_AI_GATEWAY=true)" -ForegroundColor Cyan
}

# Remove Ollama if using cloud
if ($ollamaBaseUrl -and $ollamaBaseUrl -notlike "*localhost*" -and $ollamaBaseUrl -notlike "*127.0.0.1*") {
    Write-Host "Removing Docker Ollama (using cloud)..." -ForegroundColor Yellow
    
    docker stop payaid-ollama 2>$null
    docker rm payaid-ollama 2>$null
    docker rmi ollama/ollama:latest 2>$null
    
    Write-Host "  ✅ Ollama removed (~6.12GB)" -ForegroundColor Green
    $totalFreed += 6.12
} else {
    Write-Host "  ⏭️  Keeping Docker Ollama (using local)" -ForegroundColor Cyan
}

# Remove Postgres if using external
if ($databaseUrl -and $databaseUrl -notlike "*localhost*" -and $databaseUrl -notlike "*127.0.0.1*") {
    Write-Host "Removing Docker Postgres (using external)..." -ForegroundColor Yellow
    
    docker stop payaid-postgres 2>$null
    docker rm payaid-postgres 2>$null
    docker rmi postgres:14 2>$null
    
    Write-Host "  ✅ Postgres removed (~628MB)" -ForegroundColor Green
    $totalFreed += 0.628
} else {
    # Check if container is stopped
    $postgresStatus = docker ps -a --filter "name=payaid-postgres" --format "{{.Status}}" 2>$null
    if ($postgresStatus -like "*Exited*") {
        Write-Host "Removing stopped Postgres container..." -ForegroundColor Yellow
        docker rm payaid-postgres 2>$null
        Write-Host "  ✅ Stopped Postgres container removed" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Keeping Postgres (running or not found)" -ForegroundColor Cyan
    }
}

# Remove Redis if using external
if ($redisUrl -and $redisUrl -notlike "*localhost*" -and $redisUrl -notlike "*127.0.0.1*") {
    Write-Host "Removing Docker Redis (using external)..." -ForegroundColor Yellow
    
    docker stop payaid-redis 2>$null
    docker rm payaid-redis 2>$null
    docker rmi redis:6-alpine 2>$null
    docker rmi redis:7-alpine 2>$null
    
    Write-Host "  ✅ Redis removed (~106MB)" -ForegroundColor Green
    $totalFreed += 0.106
} else {
    # Check if container is stopped
    $redisStatus = docker ps -a --filter "name=payaid-redis" --format "{{.Status}}" 2>$null
    if ($redisStatus -like "*Exited*") {
        Write-Host "Removing stopped Redis container..." -ForegroundColor Yellow
        docker rm payaid-redis 2>$null
        Write-Host "  ✅ Stopped Redis container removed" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Keeping Redis (running or not found)" -ForegroundColor Cyan
    }
}

# Remove duplicate/unused Redis image
$redis6Exists = docker images redis:6-alpine --format "{{.Repository}}:{{.Tag}}" 2>$null
$redis7Exists = docker images redis:7-alpine --format "{{.Repository}}:{{.Tag}}" 2>$null
if ($redis6Exists -and $redis7Exists) {
    Write-Host "Removing duplicate Redis image..." -ForegroundColor Yellow
    docker rmi redis:6-alpine 2>$null
    Write-Host "  ✅ Duplicate Redis image removed" -ForegroundColor Green
}

# Clean up unused resources
Write-Host "`n🧹 Cleaning up unused Docker resources..." -ForegroundColor Yellow
docker system prune -f

Write-Host "`n📊 Final Docker disk usage:" -ForegroundColor Yellow
docker system df

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
if ($totalFreed -gt 0) {
    Write-Host "📦 Estimated space freed: ~$([math]::Round($totalFreed, 2))GB" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  No unused containers found to remove" -ForegroundColor Cyan
}
Write-Host ""
