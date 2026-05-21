from fastapi import APIRouter, HTTPException
import pandas as pd
import os
import json

router = APIRouter()

# Load the processed data for dashboard analytics
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
PROC = os.path.join(ROOT, "data", "processed", "cleaned_churn_data.csv")

def get_data():
    if os.path.exists(PROC):
        return pd.read_csv(PROC)
    return None

@router.get("/overview")
async def get_overview(region: str = "All Regions"):
    df = get_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Data not found")
        
    if region != "All Regions" and "region_category" in df.columns:
        df = df[df["region_category"] == region]

    total = len(df)
    churned = int(df["churn"].sum()) if "churn" in df.columns else 0
    retained = total - churned
    churn_rate = (churned / total * 100) if total else 0
    
    return {
        "total_customers": total,
        "retained": retained,
        "churned": churned,
        "churn_rate": round(churn_rate, 2)
    }

@router.get("/regions")
async def get_regions():
    df = get_data()
    if df is None or "region_category" not in df.columns:
        return []
    regions = sorted([r for r in df["region_category"].unique().tolist() if pd.notna(r)])
    return ["All Regions"] + regions

@router.get("/risk-distribution")
async def get_risk_distribution(region: str = "All Regions"):
    # In a real app we would compute this via ML model or pre-computed probabilities
    # For now, we'll approximate based on actual churn if probabilities aren't available
    df = get_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Data not found")
        
    if region != "All Regions" and "region_category" in df.columns:
        df = df[df["region_category"] == region]
        
    churned = int(df["churn"].sum()) if "churn" in df.columns else 0
    retained = len(df) - churned
    
    return {
        "low_risk": retained,
        "medium_risk": int(churned * 0.4),
        "high_risk": int(churned * 0.6)
    }
