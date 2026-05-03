# Ollama Setup Guide for Windows

## Step 1: Download and Install Ollama

1. **Download Ollama for Windows:**
   - Visit: https://ollama.ai
   - Click "Download for Windows"
   - Run the installer (`OllamaSetup.exe`)

2. **Installation:**
   - Follow the installation wizard
   - Ollama will automatically start as a service after installation

## Step 2: Verify Installation

Open PowerShell or Command Prompt and run:
```bash
ollama --version
```

You should see the version number. If you get an error, make sure Ollama is in your PATH or restart your terminal.

## Step 3: Pull the Required Model

Pull the `mistral:7b` model that your application uses:
```bash
ollama pull mistral:7b
```

This will download the model (approximately 4.1 GB). The download may take a few minutes depending on your internet speed.

## Step 4: Verify the Model is Available

List all downloaded models:
```bash
ollama list
```

You should see `mistral:7b` in the list.

## Step 5: Test Ollama Locally

Test that Ollama is working:
```bash
ollama run mistral:7b "Say hello"
```

You should get a response from the model.

## Step 6: Verify Ollama Server is Running

Ollama runs as a service on Windows, but you can verify it's accessible:
```bash
curl http://localhost:11434/api/tags
```

Or visit in your browser: `http://localhost:11434/api/tags`

You should see a JSON response with available models.

## Step 7: Test in Your Application

1. **Restart your Next.js dev server** (if it's running):
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Test the AI services:**
   - Go to: `http://localhost:3000/dashboard/ai/test`
   - Click "Run Test Again"
   - Both Groq and Ollama should now show ✅ Success

## Troubleshooting

### Ollama is not starting
- Check Windows Services: Press `Win + R`, type `services.msc`, find "Ollama" service
- Make sure it's set to "Automatic" startup
- Right-click and select "Start" if it's stopped

### Port 11434 is already in use
- Check what's using the port:
  ```powershell
  netstat -ano | findstr :11434
  ```
- Stop the conflicting service or change Ollama's port (requires configuration)

### Model download fails
- Check your internet connection
- Try pulling a smaller model first: `ollama pull llama2:7b`
- Check disk space (models can be large)

### Connection refused in application
- Make sure Ollama service is running
- Verify the service is listening on port 11434:
  ```powershell
  netstat -ano | findstr :11434
  ```
- Restart the Ollama service if needed

## Alternative: Use Cloud Ollama

If you prefer not to run Ollama locally, you can use a cloud instance:

1. Get a cloud Ollama URL (e.g., from a hosting provider)
2. Update your `.env` file:
   ```env
   OLLAMA_BASE_URL="https://your-ollama-cloud-url.com"
   OLLAMA_API_KEY="your-api-key-here"
   OLLAMA_MODEL="mistral:7b"
   ```
3. Restart your dev server

## Quick Commands Reference

```bash
# Check Ollama version
ollama --version

# List downloaded models
ollama list

# Pull a model
ollama pull mistral:7b

# Run a model interactively
ollama run mistral:7b

# Remove a model (if needed)
ollama rm mistral:7b

# Show model information
ollama show mistral:7b
```

---

**Once Ollama is installed and running, your AI chat will use both Groq and Ollama for responses!**
