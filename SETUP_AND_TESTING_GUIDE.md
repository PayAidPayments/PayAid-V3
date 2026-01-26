# Setup and Testing Guide
**Phase 1 Enhancements + Phase 3 Implementation**

---

## 📦 PART 1: PYTHON FORECAST SERVICE SETUP

### **Prerequisites:**
- Python 3.8 or higher
- pip (Python package manager)

### **Windows Setup:**

1. **Check Python Installation:**
```powershell
python --version
# If not installed, download from https://www.python.org/downloads/
```

2. **Navigate to Forecast Service Directory:**
```powershell
cd services\forecast-engine
```

3. **Run Setup Script:**
```powershell
.\setup.ps1
```

4. **Or Manual Setup:**
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

5. **Start the Service:**
```powershell
# With Python
python main.py

# Or with uvicorn (recommended for development)
pip install uvicorn[standard]
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### **Linux/Mac Setup:**

1. **Check Python Installation:**
```bash
python3 --version
```

2. **Navigate to Forecast Service Directory:**
```bash
cd services/forecast-engine
```

3. **Run Setup Script:**
```bash
chmod +x setup.sh
./setup.sh
```

4. **Or Manual Setup:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

5. **Start the Service:**
```bash
# With Python
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### **Environment Variables:**

Add to your `.env` file:
```env
FORECAST_SERVICE_URL=http://localhost:8000
USE_ADVANCED_FORECASTING=true
```

### **Verify Service is Running:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","models_available":true,"service":"revenue-forecasting"}
```

---

## 🧪 PART 2: TESTING

### **Test Forecast Service:**

```bash
# Run TypeScript test script
npx tsx scripts/test-forecast-service.ts
```

**Expected Output:**
- ✅ Service is healthy
- ✅ Models available: true
- ✅ Forecast generated successfully
- ✅ Models used: SARIMA, ExponentialSmoothing, LinearRegression
- ✅ Confidence intervals calculated

### **Test Compliance Features:**

```bash
# Run compliance test script
npx tsx scripts/test-compliance-features.ts
```

**Expected Output:**
- ✅ GDPR deletion API ready
- ✅ India compliance APIs ready
- ✅ Dashboard components ready

### **Manual API Testing:**

#### **1. Forecast API:**
```bash
# Test TypeScript API (requires auth token)
curl -X POST http://localhost:3000/api/ai/forecast/revenue \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"horizonDays": 90, "historicalDays": 180}'
```

#### **2. GDPR Deletion:**
```bash
curl -X POST http://localhost:3000/api/compliance/gdpr/delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "customer",
    "entityId": "test-id",
    "reason": "User requested deletion"
  }'
```

#### **3. GST Compliance:**
```bash
curl http://localhost:3000/api/compliance/india/gst \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **4. Labor Compliance:**
```bash
curl http://localhost:3000/api/compliance/india/labor \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 PART 3: PHASE 3 IMPLEMENTATION STATUS

### **Week 9-10: Custom Fine-Tuned Models** ✅ **IN PROGRESS**

**Completed:**
- ✅ `lib/ai/company-fine-tuning.ts` - Training data collection
- ✅ `lib/ai/model-router.ts` - Model routing logic
- ✅ `app/api/ai/models/[companyId]/route.ts` - Model API

**Remaining:**
- [ ] Python fine-tuning service (`services/fine-tuning/train.py`)
- [ ] Model deployment pipeline (`services/fine-tuning/deploy.py`)
- [ ] Ollama integration for custom models
- [ ] Model versioning system

### **Week 11: What-If Analysis** ⏳ **NEXT**

**To Implement:**
- [ ] `lib/ai/what-if-engine.ts`
- [ ] `app/api/ai/what-if/route.ts`
- [ ] `app/components/WhatIfAnalysis.tsx`

### **Week 11: Team Collaboration** ⏳ **NEXT**

**To Implement:**
- [ ] WebSocket collaboration server
- [ ] `app/components/CollaborativeCofounder.tsx`
- [ ] Real-time message broadcasting

---

## 🚀 QUICK START CHECKLIST

- [ ] Python 3.8+ installed
- [ ] Forecast service dependencies installed
- [ ] Forecast service running on port 8000
- [ ] Environment variables configured
- [ ] Test scripts executed successfully
- [ ] All APIs responding correctly

---

## 📝 NOTES

- **Python Service:** The forecast service runs independently and can be started/stopped without affecting the main Next.js app
- **Fallback:** If Python service is unavailable, TypeScript automatically falls back to simple moving average
- **Testing:** All test scripts verify both success and failure scenarios
- **Production:** In production, run Python service as a systemd service or Docker container

---

## 🐛 TROUBLESHOOTING

### **Python Service Not Starting:**
- Check Python version: `python --version` (needs 3.8+)
- Verify dependencies: `pip list | grep statsmodels`
- Check port 8000 is not in use: `netstat -an | findstr 8000`

### **Models Not Available:**
- Install dependencies: `pip install -r requirements.txt`
- Check health endpoint: `curl http://localhost:8000/health`
- Verify statsmodels installation: `python -c "import statsmodels; print(statsmodels.__version__)"`

### **TypeScript API Errors:**
- Verify environment variable: `FORECAST_SERVICE_URL=http://localhost:8000`
- Check service is running: `curl http://localhost:8000/health`
- Review Next.js logs for connection errors

---

**Status:** ✅ Setup scripts created, Phase 3 Week 9 started
