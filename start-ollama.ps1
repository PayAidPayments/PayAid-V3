# PowerShell script to start Ollama in Docker
# Run with: .\start-ollama.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ollama Docker Setup for PayAid V3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Start Ollama container
Write-Host "Starting Ollama container..." -ForegroundColor Yellow
docker-compose -f docker-compose.ollama.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Ollama container!" -ForegroundColor Red
    exit 1
}

# Wait for container to be ready
Write-Host "Waiting for Ollama to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host ""
Write-Host "Checking container status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=payaid-ollama" --format "{{.Status}}"
if ($containerStatus) {
    Write-Host "✅ Container is running: $containerStatus" -ForegroundColor Green
} else {
    Write-Host "❌ Container is not running!" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker logs payaid-ollama
    exit 1
}

# Check if models are already available
Write-Host ""
Write-Host "Checking available models..." -ForegroundColor Yellow
$models = docker exec payaid-ollama ollama list 2>&1
Write-Host $models

# Ask user which model to pull
Write-Host ""
Write-Host "Which model would you like to use?" -ForegroundColor Cyan
Write-Host "1. tinyllama (1.1B) - ~700MB - Best for limited RAM" -ForegroundColor White
Write-Host "2. phi (2.7B) - ~1.6GB - Good balance" -ForegroundColor White
Write-Host "3. llama3.2:1b (1B) - ~1.3GB - Good quality, small size" -ForegroundColor White
Write-Host "4. Skip (use existing models)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        $model = "tinyllama"
        Write-Host "Pulling TinyLlama (this may take a few minutes)..." -ForegroundColor Yellow
        docker exec payaid-ollama ollama pull tinyllama
    }
    "2" {
        $model = "phi"
        Write-Host "Pulling Phi-2 (this may take a few minutes)..." -ForegroundColor Yellow
        docker exec payaid-ollama ollama pull phi
    }
    "3" {
        $model = "llama3.2:1b"
        Write-Host "Pulling Llama 3.2 1B (this may take a few minutes)..." -ForegroundColor Yellow
        docker exec payaid-ollama ollama pull llama3.2:1b
    }
    "4" {
        Write-Host "Skipping model pull. Using existing models." -ForegroundColor Yellow
        $model = $null
    }
    default {
        Write-Host "Invalid choice. Skipping model pull." -ForegroundColor Yellow
        $model = $null
    }
}

# Test Ollama
Write-Host ""
Write-Host "Testing Ollama connection..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Ollama API is accessible!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama API test failed, but container is running." -ForegroundColor Yellow
    Write-Host "   This might be normal if Ollama is still starting up." -ForegroundColor Yellow
}

# Show final status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Ollama is running in Docker" -ForegroundColor Green
Write-Host "📍 URL: http://localhost:11434" -ForegroundColor White
Write-Host ""

if ($model) {
    Write-Host "📝 Update your .env file:" -ForegroundColor Yellow
    Write-Host "   OLLAMA_BASE_URL=`"http://localhost:11434`"" -ForegroundColor White
    Write-Host "   OLLAMA_MODEL=`"$model`"" -ForegroundColor White
    Write-Host "   OLLAMA_API_KEY=`"`"  # Not needed for local" -ForegroundColor White
    Write-Host ""
}

Write-Host "🧪 Test at: http://localhost:3000/dashboard/ai/test" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  docker logs payaid-ollama          # View logs" -ForegroundColor White
Write-Host "  docker stats payaid-ollama         # Resource usage" -ForegroundColor White
Write-Host "  docker exec payaid-ollama ollama list  # List models" -ForegroundColor White
Write-Host "  docker-compose -f docker-compose.ollama.yml down  # Stop" -ForegroundColor White
Write-Host ""
