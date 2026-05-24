from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.api.schemas.prediction import CustomerProfile, PredictionResponse, BatchPredictionResponse
from backend.api.services.ml_service import run_single_prediction, run_batch_prediction
import pandas as pd
import io

router = APIRouter()

@router.post("/single", response_model=PredictionResponse)
async def predict_single(profile: CustomerProfile):
    try:
        # Pydantic dict() includes all fields, exclude None for the ML model if needed
        # but our model handles missing cols via preprocessing
        profile_dict = profile.dict(exclude_none=True)
        result = run_single_prediction(profile_dict)
        
        prob = float(result.get("probability", 0.0))
        risk_level = "Critical" if prob > 0.7 else "Moderate" if prob > 0.4 else "Low"
        
        # User Dashboard mapping
        churn_prob_pct = round(prob * 100, 1)
        risk_level_ui = "High Risk" if prob > 0.7 else "Medium Risk" if prob > 0.4 else "Low Risk"
        
        # Actionable AI Recommendations (advice)
        advice = []
        days_inactive = profile_dict.get("days_since_last_login", 0) or 0
        tickets = profile_dict.get("tickets_opened_90d", 0) or 0
        tenure = profile_dict.get("days_since_joined", 365) or 365
        tenure_months = tenure / 30
        monthly_value = profile_dict.get("avg_transaction_value", 0.0) or 0.0
        
        if days_inactive > 14:
            advice.append("⚠️ Days Inactive is high. Schedule a targeted re-engagement email containing a personalized promotion.")
        if tickets > 3:
            advice.append("🛠️ Ticket count is elevated. Arrange a direct technical review call from a Tier-2 support team lead.")
        if tenure_months < 6 and prob >= 0.45:
            advice.append("🌱 New Customer in Churn zone. Offer a complimentary personalized onboarding session to maximize feature adoption.")
        if monthly_value > 150:
            advice.append("💎 High-value customer at risk. Assign a dedicated client relations manager immediately.")
            
        if not advice:
            advice.append("📊 Account is performing well. Maintain standard touchpoints and suggest upselling to a higher plan tier.")
            
        # Contributing Factors (mockFactors)
        mock_factors = []
        if days_inactive > 7:
            mock_factors.append({"text": f"Days since last login: {days_inactive} days", "impact": "High Impact"})
        if tickets > 2:
            mock_factors.append({"text": f"Active support tickets: {tickets}", "impact": "Medium Impact"})
            
        logins = profile_dict.get("logins_90d", 0) or 0
        if logins < 15:
            mock_factors.append({"text": f"Low logins in last 90 days: {logins}", "impact": "High Impact"})
            
        if not mock_factors:
            mock_factors.append({"text": "Recent login activity is normal", "impact": "Low Impact"})
            mock_factors.append({"text": "Average support tickets count", "impact": "Low Impact"})

        return PredictionResponse(
            prediction=int(result.get("prediction", 0)),
            probability=prob,
            risk_level=risk_level,
            label=str(result.get("label", "")),
            churnProbability=churn_prob_pct,
            riskLevel=risk_level_ui,
            advice=advice,
            mockFactors=mock_factors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch_upload(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Run prediction
        result_df = run_batch_prediction(df)
        
        # Convert to records
        results = result_df.to_dict(orient="records")
        return BatchPredictionResponse(success=True, results=results)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
