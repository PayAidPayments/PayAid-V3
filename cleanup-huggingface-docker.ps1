# Cleanup Hugging Face Docker Containers
# Removes unused text-to-image and image-to-image containers/images
# Since we're using Hugging Face Inference API (cloud) instead

Write-Host "`n🧹 Cleaning up Hugging Face Docker containers...`n" -ForegroundColor Cyan

# Check current disk usage
Write-Host "📊 Current Docker disk usage:" -ForegroundColor Yellow
docker system df

Write-Host "`n🛑 Stopping containers..." -ForegroundColor Yellow
docker stop payaid-text-to-image payaid-image-to-image 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Containers stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Containers not running or don't exist" -ForegroundColor Gray
}

Write-Host "`n🗑️  Removing containers..." -ForegroundColor Yellow
docker rm payaid-text-to-image payaid-image-to-image 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Containers removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Containers already removed or don't exist" -ForegroundColor Gray
}

Write-Host "`n🗑️  Removing images..." -ForegroundColor Yellow

# Remove text-to-image image
$textToImageExists = docker images payaidv3-text-to-image --format "{{.Repository}}:{{.Tag}}" 2>$null
if ($textToImageExists) {
    Write-Host "  Removing payaidv3-text-to-image..." -ForegroundColor White
    docker rmi payaidv3-text-to-image:latest 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ payaidv3-text-to-image removed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Failed to remove payaidv3-text-to-image" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️  payaidv3-text-to-image not found" -ForegroundColor Gray
}

# Remove image-to-image image
$imageToImageExists = docker images payaidv3-image-to-image --format "{{.Repository}}:{{.Tag}}" 2>$null
if ($imageToImageExists) {
    Write-Host "  Removing payaidv3-image-to-image..." -ForegroundColor White
    docker rmi payaidv3-image-to-image:latest 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ payaidv3-image-to-image removed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Failed to remove payaidv3-image-to-image" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️  payaidv3-image-to-image not found" -ForegroundColor Gray
}

Write-Host "`n🧹 Cleaning up unused resources..." -ForegroundColor Yellow
docker system prune -f

Write-Host "`n📊 Final Docker disk usage:" -ForegroundColor Yellow
docker system df

Write-Host "`n✅ Cleanup complete!`n" -ForegroundColor Green
Write-Host "Note: You're now using Hugging Face Inference API (cloud) for image generation." -ForegroundColor Cyan
Write-Host "No Docker containers needed for that." -ForegroundColor Cyan
Write-Host ""
