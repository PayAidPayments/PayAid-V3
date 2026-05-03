# AI Influencer Marketing - Complete Setup Guide

**Date:** January 9, 2026  
**Status:** ✅ **Ready for Setup**

---

## 🚀 **QUICK START**

### **1. Run Setup Script**

```bash
npm run setup:ai-influencer
```

This will:
- ✅ Create necessary directories
- ✅ Check FFmpeg installation
- ✅ Check Rhubarb installation (optional)
- ✅ Create template README

### **2. Install FFmpeg (Required)**

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from:
# https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
# or
sudo yum install ffmpeg
```

**Verify:**
```bash
ffmpeg -version
```

### **3. Add Video Templates**

Place video templates in `public/video-templates/`:

- `testimonial-female-indoor.mp4` (30s)
- `testimonial-male-indoor.mp4` (30s)
- `demo-female.mp4` (45s)
- `problem-solution-female.mp4` (40s)

**Template Requirements:**
- Format: MP4 (H.264)
- Resolution: 1080p or 720p
- Frame Rate: 30fps
- Background: Neutral, suitable for face overlay

### **4. Initialize Module**

**Option A: Automatic (Recommended)**

Add to your app initialization (e.g., `app/layout.tsx` or server startup):

```typescript
// In a server component or API route
import { initializeAIInfluencerModule } from '@/lib/ai-influencer/setup'

// Initialize on server startup
if (typeof window === 'undefined') {
  initializeAIInfluencerModule()
}
```

**Option B: Manual API Call**

```bash
# Call initialization endpoint
curl -X POST http://localhost:3000/api/ai-influencer/init
```

**Option C: Check Status**

```bash
# Check initialization and dependencies
curl http://localhost:3000/api/ai-influencer/init
```

---

## 📋 **OPTIONAL SETUP**

### **Rhubarb Lip Sync (Optional)**

**Download:**
- https://github.com/DanielSWolf/rhubarb-lip-sync/releases

**Set Environment Variable:**
```env
RHUBARB_PATH="C:\path\to\rhubarb.exe"
```

**Note:** If not installed, system uses placeholder lip-sync data.

### **Text-to-Speech Configuration**

Configure TTS service in:
- Dashboard → Settings → AI Integrations
- Or set `AI_GATEWAY_URL` in `.env`

---

## ✅ **VERIFICATION**

### **1. Check Dependencies**

```bash
npm run setup:ai-influencer
```

Should show:
- ✅ FFmpeg: Installed
- ✅ Directories: Created

### **2. Test Initialization**

```bash
curl http://localhost:3000/api/ai-influencer/init
```

Should return:
```json
{
  "initialized": true,
  "dependencies": {
    "ffmpeg": true,
    "rhubarb": false
  }
}
```

### **3. Test Video Generation**

1. Go to Dashboard → Marketing → AI Influencer Marketing
2. Create a campaign
3. Generate character
4. Generate script
5. Generate video

---

## 🐛 **TROUBLESHOOTING**

### **FFmpeg Not Found**

**Error:** `FFmpeg is not installed`

**Solution:**
1. Install FFmpeg (see above)
2. Verify: `ffmpeg -version`
3. Restart dev server

### **Video Templates Missing**

**Error:** `Template not found`

**Solution:**
1. Add templates to `public/video-templates/`
2. Match filenames in `lib/ai-influencer/video-templates.ts`
3. Or update template paths in code

### **Queue Not Processing**

**Error:** Video stuck in "generating" status

**Solution:**
1. Check Redis connection
2. Verify queue processor initialized
3. Check server logs for errors
4. Call `/api/ai-influencer/init` to reinitialize

### **TTS Service Unavailable**

**Error:** `Audio generation failed`

**Solution:**
1. Configure TTS in Settings → AI Integrations
2. Or set `AI_GATEWAY_URL` in `.env`
3. Check TTS service status

---

## 📁 **DIRECTORY STRUCTURE**

```
PayAid V3/
├── public/
│   └── video-templates/          # Video templates (create this)
│       ├── testimonial-female-indoor.mp4
│       ├── testimonial-male-indoor.mp4
│       ├── demo-female.mp4
│       └── problem-solution-female.mp4
├── uploads/
│   └── {tenantId}/
│       └── ai-influencer/        # Generated videos
│           ├── videos/
│           └── {videoId}/
├── lib/
│   └── ai-influencer/            # All services
└── app/
    └── api/
        └── ai-influencer/        # API endpoints
```

---

## 🎯 **PRODUCTION DEPLOYMENT**

### **1. Environment Variables**

```env
# Required
DATABASE_URL=...
REDIS_URL=...

# Optional
RHUBARB_PATH=/usr/local/bin/rhubarb
AI_GATEWAY_URL=https://your-tts-service.com
```

### **2. Video Templates**

In production, store templates in:
- PayAid Drive
- S3/Cloud Storage
- CDN

Update `lib/ai-influencer/video-templates.ts` to use cloud URLs.

### **3. FFmpeg**

Ensure FFmpeg is installed on production server:
- Vercel: Not supported (use serverless functions with FFmpeg layer)
- Docker: Add to Dockerfile
- VPS: Install via package manager

### **4. Queue Processor**

Ensure queue processor runs:
- Add to server startup
- Or use separate worker process
- Or call `/api/ai-influencer/init` on deployment

---

## ✅ **SETUP CHECKLIST**

- [ ] Run `npm run setup:ai-influencer`
- [ ] Install FFmpeg
- [ ] Add video templates
- [ ] Initialize module (automatic or manual)
- [ ] Configure TTS service
- [ ] (Optional) Install Rhubarb
- [ ] Test video generation
- [ ] Verify queue processing

---

## 📝 **NEXT STEPS AFTER SETUP**

1. **Create Video Templates**
   - Record or source template videos
   - Place in `public/video-templates/`

2. **Test End-to-End**
   - Create campaign
   - Generate character
   - Generate script
   - Generate video

3. **Monitor Queue**
   - Check video generation status
   - Review error logs
   - Optimize performance

4. **Production Ready**
   - Move templates to cloud storage
   - Configure production TTS
   - Set up monitoring

---

**Status:** ✅ Setup Guide Complete | Ready for Implementation

