# Download AI Models Script
# Downloads all required models for AI services

Write-Host "🚀 Starting AI Models Download..." -ForegroundColor Cyan

$models = @{
    "text-to-image" = @(
        "stabilityai/stable-diffusion-xl-base-1.0"
    )
    "text-to-speech" = @(
        "tts_models/multilingual/multi-dataset/xtts_v2"
    )
    "speech-to-text" = @(
        "openai/whisper-large-v3"
    )
    "image-to-image" = @(
        "stabilityai/stable-diffusion-xl-base-1.0"
    )
    "image-to-text" = @(
        "Salesforce/blip-2-opt-2.7b"
    )
}

$totalModels = ($models.Values | Measure-Object -Sum).Sum
$current = 0

foreach ($service in $models.Keys) {
    Write-Host "`n📦 Downloading models for: $service" -ForegroundColor Yellow
    
    foreach ($model in $models[$service]) {
        $current++
        Write-Host "[$current/$totalModels] Downloading: $model" -ForegroundColor Green
        
        # Create service directory if it doesn't exist
        $serviceDir = "models\$service"
        if (-not (Test-Path $serviceDir)) {
            New-Item -ItemType Directory -Path $serviceDir -Force | Out-Null
        }
        
        # Download using huggingface-cli or git lfs
        try {
            # Option 1: Using huggingface-cli (if installed)
            if (Get-Command huggingface-cli -ErrorAction SilentlyContinue) {
                Write-Host "  Using huggingface-cli..." -ForegroundColor Gray
                huggingface-cli download $model --local-dir "$serviceDir\$model" --local-dir-use-symlinks False
            }
            # Option 2: Using git lfs (if available)
            elseif (Get-Command git -ErrorAction SilentlyContinue) {
                Write-Host "  Using git lfs..." -ForegroundColor Gray
                $modelPath = "$serviceDir\$model"
                if (-not (Test-Path $modelPath)) {
                    git clone "https://huggingface.co/$model" $modelPath
                } else {
                    Write-Host "  Model already exists, skipping..." -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  ⚠️  Neither huggingface-cli nor git found. Please install one:" -ForegroundColor Yellow
                Write-Host "     pip install huggingface-hub" -ForegroundColor Gray
                Write-Host "     OR install git with git-lfs" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ Error downloading $model : $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n✅ Model download complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start services: docker-compose -f docker-compose.ai-services.yml up -d" -ForegroundColor White
Write-Host "   2. Check health: curl http://localhost:8000/health" -ForegroundColor White
Write-Host "   3. View logs: docker-compose -f docker-compose.ai-services.yml logs -f" -ForegroundColor White
