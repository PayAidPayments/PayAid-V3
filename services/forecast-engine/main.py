"""
Revenue Forecasting Service
FastAPI service for advanced time-series forecasting models
Supports SARIMA, Exponential Smoothing, and Linear Regression
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

# Time-series models
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import PolynomialFeatures
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    logging.warning("Advanced forecasting models not available. Install: pip install statsmodels scikit-learn pandas numpy")

app = FastAPI(title="Revenue Forecasting Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ForecastRequest(BaseModel):
    tenant_id: str
    historical_data: List[dict]  # [{"date": "2024-01-01", "revenue": 1000.0}, ...]
    horizon_days: int = 90
    historical_days: int = 180
    include_confidence_intervals: bool = True

class ForecastResponse(BaseModel):
    forecast: List[float]
    dates: List[str]
    confidence: float
    confidence_intervals: Optional[dict] = None
    models_used: List[str]
    summary: dict

def prepare_data(historical_data: List[dict]) -> pd.DataFrame:
    """Convert historical data to pandas DataFrame"""
    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    df = df.set_index('date')
    df = df.resample('D').sum().fillna(0)  # Daily aggregation
    return df

def sarima_forecast(data: pd.Series, horizon: int) -> tuple:
    """SARIMA (Seasonal AutoRegressive Integrated Moving Average) forecast"""
    try:
        # Auto-select best SARIMA parameters (simplified - in production, use auto_arima)
        # Using (1,1,1)(1,1,1,7) - weekly seasonality
        model = SARIMAX(
            data,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 7),
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        fitted_model = model.fit(disp=False)
        forecast = fitted_model.forecast(steps=horizon)
        confidence = min(0.95, max(0.7, 1 - (fitted_model.aic / 10000)))  # Rough confidence estimate
        return forecast.values, confidence
    except Exception as e:
        logging.error(f"SARIMA forecast error: {e}")
        return None, 0.0

def exponential_smoothing_forecast(data: pd.Series, horizon: int) -> tuple:
    """Exponential Smoothing (Holt-Winters) forecast"""
    try:
        # Try additive seasonality first
        try:
            model = ExponentialSmoothing(
                data,
                seasonal_periods=7,  # Weekly seasonality
                trend='add',
                seasonal='add'
            )
            fitted_model = model.fit(optimized=True)
        except:
            # Fallback to multiplicative or no seasonality
            try:
                model = ExponentialSmoothing(
                    data,
                    seasonal_periods=7,
                    trend='add',
                    seasonal='mul'
                )
                fitted_model = model.fit(optimized=True)
            except:
                # No seasonality
                model = ExponentialSmoothing(data, trend='add')
                fitted_model = model.fit(optimized=True)
        
        forecast = fitted_model.forecast(steps=horizon)
        confidence = 0.85  # Exponential smoothing typically has good confidence
        return forecast.values, confidence
    except Exception as e:
        logging.error(f"Exponential Smoothing forecast error: {e}")
        return None, 0.0

def linear_regression_forecast(data: pd.Series, horizon: int) -> tuple:
    """Linear Regression with seasonality forecast"""
    try:
        # Create features: day of week, day of month, trend
        df = pd.DataFrame({'revenue': data.values})
        df['day_of_week'] = data.index.dayofweek
        df['day_of_month'] = data.index.day
        df['trend'] = range(len(data))
        
        # One-hot encode day of week
        df = pd.get_dummies(df, columns=['day_of_week'], prefix='dow')
        
        X = df.drop('revenue', axis=1).values
        y = df['revenue'].values
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate future dates
        last_date = data.index[-1]
        future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=horizon, freq='D')
        
        # Create features for future dates
        future_df = pd.DataFrame({
            'day_of_month': future_dates.day,
            'trend': range(len(data), len(data) + horizon)
        })
        future_df = pd.get_dummies(future_df, columns=[], prefix='dow')
        
        # Ensure all day_of_week columns exist
        for i in range(7):
            col = f'dow_{i}'
            if col not in future_df.columns:
                future_df[col] = 0
        
        # Set correct day of week
        for idx, date in enumerate(future_dates):
            dow = date.dayofweek
            future_df.loc[idx, f'dow_{dow}'] = 1
        
        # Reorder columns to match training data
        future_df = future_df.reindex(columns=df.drop('revenue', axis=1).columns, fill_value=0)
        
        X_future = future_df.values
        forecast = model.predict(X_future)
        forecast = np.maximum(forecast, 0)  # Ensure non-negative
        
        # Calculate confidence based on R²
        r2 = model.score(X, y)
        confidence = max(0.7, min(0.9, r2))
        
        return forecast, confidence
    except Exception as e:
        logging.error(f"Linear Regression forecast error: {e}")
        return None, 0.0

def simple_moving_average_forecast(data: pd.Series, horizon: int) -> tuple:
    """Simple moving average fallback"""
    window = min(30, len(data) // 2)
    if window < 7:
        window = 7
    
    ma = data.rolling(window=window).mean()
    last_ma = ma.iloc[-1]
    trend = (data.iloc[-1] - data.iloc[-window]) / window if len(data) >= window else 0
    
    forecast = []
    for i in range(horizon):
        forecast.append(last_ma + (trend * (i + 1)))
    
    confidence = 0.75
    return np.array(forecast), confidence

def calculate_confidence_intervals(forecast: np.ndarray, historical_std: float) -> dict:
    """Calculate 80% and 95% confidence intervals"""
    z80 = 1.28  # 80% confidence
    z95 = 1.96  # 95% confidence
    
    return {
        "lower_80": (forecast - z80 * historical_std).tolist(),
        "upper_80": (forecast + z80 * historical_std).tolist(),
        "lower_95": (forecast - z95 * historical_std).tolist(),
        "upper_95": (forecast + z95 * historical_std).tolist(),
    }

@app.post("/api/forecast/revenue", response_model=ForecastResponse)
async def forecast_revenue(request: ForecastRequest):
    """Generate revenue forecast using ensemble of models"""
    
    if not MODELS_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="Advanced forecasting models not available. Install dependencies: pip install statsmodels scikit-learn pandas numpy"
        )
    
    try:
        # Prepare data
        df = prepare_data(request.historical_data)
        
        if len(df) < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data. Need at least 30 days, got {len(df)}"
            )
        
        revenue_series = df['revenue']
        
        # Calculate historical standard deviation for confidence intervals
        historical_std = revenue_series.std()
        if historical_std == 0:
            historical_std = revenue_series.mean() * 0.1  # Fallback
        
        # Run multiple models
        forecasts = {}
        confidences = {}
        models_used = []
        
        # 1. SARIMA
        sarima_forecast, sarima_conf = sarima_forecast(revenue_series, request.horizon_days)
        if sarima_forecast is not None:
            forecasts['sarima'] = sarima_forecast
            confidences['sarima'] = sarima_conf
            models_used.append('SARIMA')
        
        # 2. Exponential Smoothing
        es_forecast, es_conf = exponential_smoothing_forecast(revenue_series, request.horizon_days)
        if es_forecast is not None:
            forecasts['exponential_smoothing'] = es_forecast
            confidences['exponential_smoothing'] = es_conf
            models_used.append('ExponentialSmoothing')
        
        # 3. Linear Regression
        lr_forecast, lr_conf = linear_regression_forecast(revenue_series, request.horizon_days)
        if lr_forecast is not None:
            forecasts['linear_regression'] = lr_forecast
            confidences['linear_regression'] = lr_conf
            models_used.append('LinearRegression')
        
        # Fallback to simple moving average if no models worked
        if not forecasts:
            sma_forecast, sma_conf = simple_moving_average_forecast(revenue_series, request.horizon_days)
            forecasts['simple_moving_average'] = sma_forecast
            confidences['simple_moving_average'] = sma_conf
            models_used.append('SimpleMovingAverage')
        
        # Ensemble: Weighted average based on confidence
        if len(forecasts) > 1:
            total_confidence = sum(confidences.values())
            weights = {k: v / total_confidence for k, v in confidences.items()}
            
            ensemble_forecast = np.zeros(request.horizon_days)
            for model_name, forecast in forecasts.items():
                weight = weights[model_name]
                ensemble_forecast += forecast * weight
            
            # Overall confidence is average of model confidences
            overall_confidence = sum(confidences.values()) / len(confidences)
        else:
            # Single model
            ensemble_forecast = list(forecasts.values())[0]
            overall_confidence = list(confidences.values())[0]
        
        # Ensure non-negative
        ensemble_forecast = np.maximum(ensemble_forecast, 0)
        
        # Generate dates
        last_date = revenue_series.index[-1]
        dates = [(last_date + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(request.horizon_days)]
        
        # Calculate summary
        total_forecast = float(np.sum(ensemble_forecast))
        daily_average = float(np.mean(ensemble_forecast))
        recent_avg = float(revenue_series.tail(7).mean())
        projection_vs_current = ((daily_average - recent_avg) / recent_avg * 100) if recent_avg > 0 else 0
        
        # Confidence intervals
        confidence_intervals = None
        if request.include_confidence_intervals:
            confidence_intervals = calculate_confidence_intervals(ensemble_forecast, historical_std)
        
        return ForecastResponse(
            forecast=ensemble_forecast.tolist(),
            dates=dates,
            confidence=float(overall_confidence),
            confidence_intervals=confidence_intervals,
            models_used=models_used,
            summary={
                "total_90day": total_forecast,
                "daily_average": daily_average,
                "projection_vs_current": projection_vs_current,
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_available": MODELS_AVAILABLE,
        "service": "revenue-forecasting"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
