# 🧹 Cleanup Hugging Face Docker Containers

## ✅ Safe to Remove

Since you're using **Hugging Face Inference API (cloud-based)** instead of self-hosted Docker containers, you can safely remove:

### Containers & Images to Remove:

1. **Text-to-Image Service** (2.92GB)
   - Container: `payaid-text-to-image` (if exists)
   - Image: `payaidv3-text-to-image:latest`

2. **Image-to-Image Service** (2.93GB)
   - Container: `payaid-image-to-image` (currently restarting/failing)
   - Image: `payaidv3-image-to-image:latest`

**Total Space to Free:** ~5.85GB

---

## 🚀 Cleanup Commands

### Option 1: Remove Specific Images (Recommended)

```powershell
# Stop and remove containers first
docker stop payaid-text-to-image payaid-image-to-image 2>$null
docker rm payaid-text-to-image payaid-image-to-image 2>$null

# Remove images
docker rmi payaidv3-text-to-image:latest
docker rmi payaidv3-image-to-image:latest

# Clean up unused resources
docker system prune -f
```

### Option 2: Remove All Unused Images (More Aggressive)

```powershell
# Remove all unused images (be careful!)
docker image prune -a -f

# Or remove specific unused images
docker images | Select-String "payaidv3-text-to-image|payaidv3-image-to-image" | ForEach-Object {
    $image = ($_ -split '\s+')[0] + ':' + ($_ -split '\s+')[1]
    docker rmi $image
}
```

### Option 3: Full Cleanup Script

```powershell
# Stop containers
docker stop payaid-text-to-image payaid-image-to-image 2>$null

# Remove containers
docker rm payaid-text-to-image payaid-image-to-image 2>$null

# Remove images
docker rmi payaidv3-text-to-image:latest 2>$null
docker rmi payaidv3-image-to-image:latest 2>$null

# Remove unused volumes (optional - be careful!)
# docker volume prune -f

# Clean up build cache
docker builder prune -f

# Show freed space
docker system df
```

---

## ⚠️ Keep These (Still in Use)

**DO NOT remove these** - they're still being used:

1. **AI Gateway** (`payaidv3-ai-gateway`) - Routes to other services
2. **Text-to-Speech** (`payaidv3-text-to-speech`) - Still in use
3. **Speech-to-Text** (`payaidv3-speech-to-text`) - Still in use
4. **Image-to-Text** (`payaidv3-image-to-text`) - Still in use
5. **Ollama** (`ollama/ollama:latest`) - Still in use for chat

---

## 📋 Verification

After cleanup, verify:

```powershell
# Check remaining images
docker images | Select-String "payaid"

# Check disk space freed
docker system df
```

---

## 🗑️ Optional: Remove Service Directories

If you want to completely remove the unused services:

```powershell
# Remove service directories (optional)
Remove-Item -Recurse -Force "services\text-to-image" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "services\image-to-image" -ErrorAction SilentlyContinue
```

**Note:** These directories are not needed since you're using cloud API, but keep them if you might use them later.

---

## ✅ Summary

**Safe to Remove:**
- ✅ `payaidv3-text-to-image` image (2.92GB)
- ✅ `payaidv3-image-to-image` image (2.93GB)
- ✅ Related containers (if any)

**Keep:**
- ❌ AI Gateway
- ❌ Text-to-Speech
- ❌ Speech-to-Text
- ❌ Image-to-Text
- ❌ Ollama

**Space to Free:** ~5.85GB

---

**Ready to clean up? Run the commands above!**
