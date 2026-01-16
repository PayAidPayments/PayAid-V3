# Free Stack Voice Agents - Startup Script (PowerShell)
# Automates starting all required services

Write-Host "Starting Free Stack Voice Agents..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Start Docker services
Write-Host "Starting Docker services (Whisper, Coqui TTS, AI Gateway)..." -ForegroundColor Yellow
docker-compose -f docker-compose.ai-services.yml up -d

Write-Host ""
Write-Host "Waiting 30 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host ""

# Step 3: Check Ollama
Write-Host "🤖 Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Ollama is not running" -ForegroundColor Yellow
    Write-Host "Starting Ollama in Docker..." -ForegroundColor Yellow
    docker run -d -p 11434:11434 --name ollama ollama/ollama 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ollama container may already exist" -ForegroundColor Yellow
    }
    Write-Host "Waiting 10 seconds for Ollama to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}
Write-Host ""

# Step 4: Verify services
Write-Host "Verifying services..." -ForegroundColor Yellow
Write-Host ""

# Check Whisper
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7862/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Whisper (STT) - Running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Whisper (STT) - Starting... (may take a few minutes)" -ForegroundColor Yellow
}

# Check Coqui TTS
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7861/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Coqui TTS - Running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Coqui TTS - Starting... (may take a few minutes)" -ForegroundColor Yellow
}

# Check AI Gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ AI Gateway - Running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ AI Gateway - Starting..." -ForegroundColor Yellow
}

# Check Ollama
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Ollama (LLM) - Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama (LLM) - Not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Free Stack startup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev"
Write-Host "2. Run: npm run dev:telephony"
Write-Host "3. Test voice agent in the UI"
Write-Host ""
Write-Host "To check service status: npm run setup:free-stack" -ForegroundColor Cyan
Write-Host ""
