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
        result = run_single_prediction(profile.dict(exclude_none=True))
        
        prob = result.get("probability", 0.0)
        risk_level = "Critical" if prob > 0.7 else "Moderate" if prob > 0.4 else "Low"
        
        return PredictionResponse(
            prediction=int(result.get("prediction", 0)),
            probability=float(prob),
            risk_level=risk_level,
            label=str(result.get("label", ""))
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
