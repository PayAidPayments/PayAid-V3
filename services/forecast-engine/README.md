# Revenue Forecasting Service

Python FastAPI service for advanced time-series forecasting using SARIMA, Exponential Smoothing, and Linear Regression models.

## Setup

1. **Install Python dependencies:**
```bash
cd services/forecast-engine
pip install -r requirements.txt
```

2. **Start the service:**
```bash
python main.py
# Or with uvicorn:
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. **Configure environment variable:**
Add to your `.env` file:
```
FORECAST_SERVICE_URL=http://localhost:8000
USE_ADVANCED_FORECASTING=true
```

## API Endpoints

- `POST /api/forecast/revenue` - Generate revenue forecast
- `GET /health` - Health check

## Models Used

1. **SARIMA** - Seasonal AutoRegressive Integrated Moving Average
2. **Exponential Smoothing** - Holt-Winters method
3. **Linear Regression** - With seasonality features
4. **Ensemble** - Weighted average of all models

## Fallback

If the Python service is unavailable, the TypeScript implementation will automatically fall back to simple moving average forecasting.
