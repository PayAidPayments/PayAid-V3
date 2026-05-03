# Best Ollama Models for Production

## Recommended Models (Ranked by Quality)

### 1. **Llama 3.1 8B** ⭐ Currently Selected
- **Size:** ~4.7GB
- **RAM Needed:** ~6-8GB
- **Quality:** Excellent
- **Speed:** Fast
- **Best For:** General purpose, business applications
- **Pull Command:** `docker exec payaid-ollama ollama pull llama3.1:8b`

### 2. **Mistral 7B Instruct** 
- **Size:** ~4.1GB
- **RAM Needed:** ~5-6GB
- **Quality:** Excellent
- **Speed:** Very Fast
- **Best For:** Instruction following, chat applications
- **Pull Command:** `docker exec payaid-ollama ollama pull mistral:7b-instruct`

### 3. **Qwen 2.5 7B**
- **Size:** ~4.5GB
- **RAM Needed:** ~6-7GB
- **Quality:** Excellent (great for multilingual)
- **Speed:** Fast
- **Best For:** Multilingual support, coding
- **Pull Command:** `docker exec payaid-ollama ollama pull qwen2.5:7b`

### 4. **Mixtral 8x7B** (MoE - Mixture of Experts)
- **Size:** ~26GB
- **RAM Needed:** ~32GB
- **Quality:** Outstanding
- **Speed:** Moderate
- **Best For:** High-end systems with lots of RAM
- **Pull Command:** `docker exec payaid-ollama ollama pull mixtral:8x7b`

### 5. **Llama 3.1 70B** (Quantized)
- **Size:** ~40GB (q4_0)
- **RAM Needed:** ~45GB
- **Quality:** Exceptional
- **Speed:** Slower
- **Best For:** Enterprise systems with high RAM
- **Pull Command:** `docker exec payaid-ollama ollama pull llama3.1:70b-q4_0`

### 6. **DeepSeek Coder 7B**
- **Size:** ~4.1GB
- **RAM Needed:** ~5-6GB
- **Quality:** Excellent for coding
- **Speed:** Fast
- **Best For:** Code generation, technical tasks
- **Pull Command:** `docker exec payaid-ollama ollama pull deepseek-coder:7b`

---

## Current Selection: Llama 3.1 8B

**Why Llama 3.1 8B?**
- ✅ Excellent quality for business applications
- ✅ Good balance of speed and quality
- ✅ Works well with Docker memory limits
- ✅ Great for general-purpose AI chat
- ✅ Good instruction following
- ✅ Active development and support

---

## Model Comparison

| Model | Size | RAM | Quality | Speed | Use Case |
|-------|------|-----|---------|-------|----------|
| **Llama 3.1 8B** | 4.7GB | 6-8GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | General purpose |
| Mistral 7B | 4.1GB | 5-6GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Chat, instructions |
| Qwen 2.5 7B | 4.5GB | 6-7GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Multilingual |
| Mixtral 8x7B | 26GB | 32GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | High-end |
| DeepSeek Coder | 4.1GB | 5-6GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Coding |

---

## Switching Models

### To Switch to a Different Model:

1. **Pull the new model:**
   ```powershell
   docker exec payaid-ollama ollama pull mistral:7b-instruct
   ```

2. **Update .env:**
   ```env
   OLLAMA_MODEL="mistral:7b-instruct"
   ```

3. **Restart dev server:**
   ```powershell
   # Stop Node.js processes
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   
   # Start dev server
   npm run dev
   ```

4. **Test:**
   - Go to: `http://localhost:3000/dashboard/ai/test`
   - Click "Run Test Again"

---

## Memory Considerations

Even with Docker, you still have 3.4GB total RAM. Docker is set to use max 2.8GB, so:

- **Llama 3.1 8B** (~6-8GB RAM needed) - Might be tight, but Docker will manage
- **Mistral 7B** (~5-6GB RAM needed) - Better fit
- **Qwen 2.5 7B** (~6-7GB RAM needed) - Similar to Llama

**If you get out-of-memory errors:**
1. Try **Mistral 7B** instead (slightly smaller)
2. Or use quantized versions:
   - `llama3.1:8b-q4_0` (smaller RAM footprint)
   - `mistral:7b-instruct-q4_0`

---

## Quantized Models (Lower RAM)

If memory is still an issue, use quantized versions:

| Model | Size | RAM Needed |
|-------|------|------------|
| llama3.1:8b-q4_0 | ~4.5GB | ~5-6GB |
| mistral:7b-instruct-q4_0 | ~4.0GB | ~4-5GB |
| qwen2.5:7b-q4_0 | ~4.3GB | ~5-6GB |

**Pull quantized:**
```powershell
docker exec payaid-ollama ollama pull llama3.1:8b-q4_0
```

---

## Testing Different Models

You can have multiple models installed and switch between them:

```powershell
# List all models
docker exec payaid-ollama ollama list

# Test a model
docker exec payaid-ollama ollama run llama3.1:8b "What are the benefits of using AI in business?"

# Compare responses
docker exec payaid-ollama ollama run mistral:7b-instruct "What are the benefits of using AI in business?"
```

---

## Recommended Setup for Your System

**Current Setup:**
- ✅ **Model:** Llama 3.1 8B
- ✅ **Docker Memory Limit:** 2.8GB
- ✅ **Total System RAM:** 3.4GB

**If Llama 3.1 8B causes memory issues, try:**
1. **Mistral 7B Instruct** (slightly smaller)
2. **Llama 3.1 8B Q4_0** (quantized version)

**To upgrade later (if you get more RAM):**
- **Mixtral 8x7B** - Best quality
- **Llama 3.1 70B** - Exceptional quality

---

## Summary

✅ **Currently using:** Llama 3.1 8B (excellent quality)
✅ **Docker configured:** Memory limits set
✅ **Ready to use:** Model is being pulled

**Your AI chat will now use a high-quality model!**
