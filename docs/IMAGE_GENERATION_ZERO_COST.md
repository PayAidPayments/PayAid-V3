# Image Generation — Best Option at ₹0 Cost

You have two **zero-cost** ways to power Create Image, Product Studio, and Image Ads without paying for APIs or servers.

---

## Option A: Hugging Face (recommended — no server to run)

**Cost:** ₹0 (free tier)  
**Setup:** One API key, one env variable. No Python, no Docker, no GPU.

### Steps

1. **Get a free API key**
   - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Sign up or log in
   - Click **Create new token** (read access is enough for inference)
   - Copy the token (starts with `hf_`)

2. **Add it to your app**
   - In your project root, open `.env` (or set the variable in Vercel/hosting)
   - Add:
     ```env
     HUGGINGFACE_API_KEY=hf_your_token_here
     ```
   - Restart the PayAid app

3. **Done**
   - **Create Image**, **Product Studio**, and **Image Ads** all work with just this key. No Google AI Studio key and no self-hosted worker required. Tenants do not need to configure anything.

**Free tier limits:** Hugging Face inference has rate limits on the free tier. For heavier use, consider a self-hosted worker (Option B) or their paid tier.

---

## Option B: Self-hosted on your PC (₹0, no API key)

**Cost:** ₹0 (your own machine and electricity)  
**Setup:** Install Python once, then run the included text-to-image service. No per-image API cost, no quota from Google/HF.

### Steps (Windows)

1. **Install Python 3.10 or 3.11**
   - [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - Run the installer and **check “Add Python to PATH”**
   - Finish and close the installer

2. **Open a new terminal** (e.g. PowerShell or Command Prompt) and run:
   ```powershell
   cd "d:\Cursor Projects\PayAid V3\services\text-to-image"
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python server.py
   ```
   - First run will download the SDXL model (~6 GB). Ensure enough disk space and a stable internet connection.
   - When you see the server listening (e.g. port 7860), leave this terminal open.

3. **Point PayAid at the worker**
   - In your project `.env` add:
     ```env
     IMAGE_WORKER_URL=http://localhost:7860
     ```
   - Restart the PayAid app

4. **Use the app**
   - Create Image, Product Studio, and Image Ads will use your PC’s worker first. No Google or Hugging Face key needed for image generation.

**Performance:** On CPU, each image can take 1–2 minutes. With an NVIDIA GPU and CUDA installed, it’s much faster (tens of seconds).

---

## Comparison

| | Hugging Face (A) | Self-hosted (B) |
|---|------------------|-----------------|
| **Cost** | ₹0 (free tier) | ₹0 (your PC) |
| **Setup** | One env var | Python + run one script |
| **Server to run** | No | Yes (your machine) |
| **Speed** | Usually fast (their GPU) | Slow on CPU, fast with your GPU |
| **Quota** | Free-tier limits | None |
| **Works offline** | No | Yes (after model is downloaded) |

**Recommendation:** Start with **Option A (Hugging Face)**. If you hit limits or want no dependency on their API, use **Option B (self-hosted)** on your PC.
