# FFmpeg Installation Guide for Windows

**Date:** January 9, 2026  
**Status:** Installation Guide

---

## 🎯 **QUICK INSTALLATION OPTIONS**

### **Option 1: Chocolatey (Recommended if installed)**

```powershell
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install FFmpeg
choco install ffmpeg -y
```

### **Option 2: Direct Download (Easiest)**

1. **Download FFmpeg:**
   - Go to: https://www.gyan.dev/ffmpeg/builds/
   - Download: `ffmpeg-release-essentials.zip`
   - Or direct link: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip

2. **Extract:**
   - Extract to: `C:\ffmpeg\`
   - Should have: `C:\ffmpeg\bin\ffmpeg.exe`

3. **Add to PATH:**
   ```powershell
   # Run PowerShell as Administrator
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ffmpeg\bin", "Machine")
   ```

4. **Restart terminal and verify:**
   ```powershell
   ffmpeg -version
   ```

### **Option 3: Using winget (Windows 10/11)**

```powershell
winget install ffmpeg
```

### **Option 4: Using Scoop**

```powershell
# Install Scoop first (if not installed)
# Run PowerShell, then:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install FFmpeg
scoop install ffmpeg
```

---

## ✅ **VERIFICATION**

After installation, verify FFmpeg is working:

```powershell
ffmpeg -version
```

**Expected Output:**
```
ffmpeg version 6.x.x
...
```

---

## 🔧 **TROUBLESHOOTING**

### **"ffmpeg is not recognized"**

**Solution:**
1. Check if FFmpeg is installed:
   ```powershell
   Get-Command ffmpeg -ErrorAction SilentlyContinue
   ```

2. If not found, add to PATH manually:
   - Open System Properties → Environment Variables
   - Add `C:\ffmpeg\bin` to PATH
   - Restart terminal

3. Or use full path:
   ```powershell
   C:\ffmpeg\bin\ffmpeg.exe -version
   ```

### **"Access Denied"**

**Solution:**
- Run PowerShell as Administrator
- Or install to user directory instead of Program Files

---

## 📋 **QUICK SETUP SCRIPT**

Create a file `install-ffmpeg.ps1`:

```powershell
# Download and install FFmpeg
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$downloadPath = "$env:TEMP\ffmpeg.zip"
$installPath = "C:\ffmpeg"

Write-Host "Downloading FFmpeg..."
Invoke-WebRequest -Uri $ffmpegUrl -OutFile $downloadPath

Write-Host "Extracting FFmpeg..."
Expand-Archive -Path $downloadPath -DestinationPath $installPath -Force

Write-Host "Adding to PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$newPath = $currentPath + ";$installPath\bin"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

Write-Host "FFmpeg installed! Please restart your terminal."
Write-Host "Verify with: ffmpeg -version"
```

**Run as Administrator:**
```powershell
powershell -ExecutionPolicy Bypass -File install-ffmpeg.ps1
```

---

## ✅ **AFTER INSTALLATION**

Once FFmpeg is installed:

1. **Restart your terminal/IDE**
2. **Verify installation:**
   ```powershell
   ffmpeg -version
   ```
3. **Check system health:**
   ```powershell
   curl http://localhost:3000/api/ai-influencer/health
   ```
4. **Should show:**
   ```json
   {
     "dependencies": {
       "ffmpeg": { "installed": true }
     }
   }
   ```

---

## 🎯 **RECOMMENDED: Direct Download Method**

**Fastest and most reliable:**

1. Download: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract to `C:\ffmpeg\`
3. Add `C:\ffmpeg\bin` to PATH
4. Restart terminal
5. Verify: `ffmpeg -version`

**Total time: ~5 minutes**

---

**Last Updated:** January 9, 2026  
**Status:** Installation Guide Ready

