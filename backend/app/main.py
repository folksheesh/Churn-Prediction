import os
import sys
import math
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to python path to load src/utils and src/predict
ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

try:
    from src.predict import load_pipeline, predict_single
    HAS_ML_PIPELINE = True
except Exception as e:
    print(f"ML Pipeline load error: {e}")
    HAS_ML_PIPELINE = False

app = FastAPI(title="ChurnSense Backend", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data on startup
DATA_PATH = ROOT_DIR / "data" / "processed" / "cleaned_churn_data.csv"

# Global states
class DataState:
    df: pd.DataFrame = None
    uploaded_df_list: List[pd.DataFrame] = []

state = DataState()

def get_live_data() -> pd.DataFrame:
    """Helper to return original dataset merged with temporary uploaded session rows."""
    if state.df is None:
        if DATA_PATH.exists():
            df_loaded = pd.read_csv(DATA_PATH)
        else:
            # Recreate same random demo generator from Streamlit if dataset not found
            rng = np.random.default_rng(42)
            n = 1000
            regions = rng.choice(["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"], n, p=[.28,.24,.22,.16,.10])
            tenure = rng.integers(1, 36, n)
            active = rng.integers(2, 90, n)
            days_inactive = rng.integers(0, 45, n)
            sentiment_score = rng.choice([1,2,3,4,5], n, p=[.08,.12,.32,.30,.18])
            risk_prob = np.clip(0.18 + (days_inactive / 55) + ((3 - sentiment_score) * 0.08) + rng.normal(0, .08, n), 0.02, 0.95)
            churn = (risk_prob > rng.uniform(.45, .85, n)).astype(int)
            names = ["Sarah Johnson", "Michael Chen", "Emma Williams", "James Anderson", "Sofia Martinez", "Oliver Brown", "Nadia Putri", "Rizky Pratama", "Alya Ramadhani", "Daniel Lee"]
            df_loaded = pd.DataFrame({
                "customer_id": [f"CUS-{i+1:05d}" for i in range(n)],
                "name": rng.choice(names, n),
                "region_category": regions,
                "tenure_months": tenure,
                "active_days_90d": active,
                "days_since_last_login": days_inactive,
                "churn": churn,
                "risk_probability": risk_prob,
                "sentiment_score": sentiment_score,
                "sentiment_kategori": pd.Series(sentiment_score).map({1:"Sangat Kecewa",2:"Kecewa",3:"Biasa",4:"Puas",5:"Sangat Puas"}),
                "feedback": rng.choice(["Service is good and easy to use", "Payment failed several times", "Support was slow but finally solved", "The app is helpful for daily work", "Need faster response from support team"], n),
            })
        
        # Standardize columns
        if "customer_id" not in df_loaded.columns:
            df_loaded["customer_id"] = [f"CUS-{i+1:05d}" for i in range(len(df_loaded))]
        if "name" not in df_loaded.columns:
            df_loaded["name"] = [f"Customer {i+1}" for i in range(len(df_loaded))]
        if "region_category" not in df_loaded.columns:
            df_loaded["region_category"] = "All Region"
        if "tenure_months" not in df_loaded.columns:
            df_loaded["tenure_months"] = 12
        if "churn" not in df_loaded.columns:
            df_loaded["churn"] = 0
        
        df_loaded["churn"] = pd.to_numeric(df_loaded["churn"], errors="coerce").fillna(0).astype(int)
        
        if "risk_probability" not in df_loaded.columns:
            if "churn_probability" in df_loaded.columns:
                df_loaded["risk_probability"] = pd.to_numeric(df_loaded["churn_probability"], errors="coerce").fillna(0)
            else:
                base = pd.to_numeric(df_loaded.get("days_since_last_login", pd.Series(np.zeros(len(df_loaded)))), errors="coerce").fillna(0)
                df_loaded["risk_probability"] = np.clip(.18 + base / (base.max() + 1) * .55 + df_loaded["churn"] * .20, .03, .95)
        
        state.df = df_loaded

    res = state.df.copy()
    if state.uploaded_df_list:
        res = pd.concat([res] + state.uploaded_df_list, ignore_index=True, sort=False)
    
    res["risk_probability"] = pd.to_numeric(res["risk_probability"], errors="coerce").fillna(0).clip(0, 1)
    
    # Calculate derived levels
    def risk_label(prob):
        if prob >= 0.70: return "High Risk"
        if prob >= 0.45: return "Medium Risk"
        return "Low Risk"
        
    res["Risk Level"] = res["risk_probability"].apply(risk_label)
    res["Churn Probability"] = (res["risk_probability"] * 100).round(1)
    return res

@app.on_event("startup")
def startup_event():
    # Warm up dataset
    get_live_data()
    print("FastAPI startup: Database successfully initialized.")

@app.get("/api/summary")
def get_summary():
    df = get_live_data()
    total = len(df)
    
    churn_rate = float(df["churn"].mean() * 100) if total else 0.0
    at_risk = int((df["risk_probability"] >= 0.45).sum())
    retained = int((df["churn"] == 0).sum())
    
    high_risk = int((df["risk_probability"] >= 0.70).sum())
    medium_risk = int(((df["risk_probability"] >= 0.45) & (df["risk_probability"] < 0.70)).sum())
    low_risk = int((df["risk_probability"] < 0.45).sum())

    # Churn forecast mock trend (line chart)
    churn_forecast = [
        {"day": "Mon", "predictedChurn": round(churn_rate * 0.95, 2)},
        {"day": "Tue", "predictedChurn": round(churn_rate * 0.98, 2)},
        {"day": "Wed", "predictedChurn": round(churn_rate * 1.02, 2)},
        {"day": "Thu", "predictedChurn": round(churn_rate * 1.05, 2)},
        {"day": "Fri", "predictedChurn": round(churn_rate * 0.97, 2)},
        {"day": "Sat", "predictedChurn": round(churn_rate * 0.91, 2)},
        {"day": "Sun", "predictedChurn": round(churn_rate * 0.88, 2)}
    ]

    # Region Stats (bar chart)
    regions = df["region_category"].unique()
    region_stats = []
    for r in regions:
        region_df = df[df["region_category"] == r]
        total_r = len(region_df)
        risk_pct = float((region_df["risk_probability"] >= 0.45).sum() / max(1, total_r) * 100)
        region_stats.append({
            "region": str(r),
            "total": int(total_r),
            "riskPct": round(risk_pct, 1)
        })

    # Sparkline mock points
    sparkline = [round(churn_rate * f, 2) for f in [0.9, 1.1, 1.3, 0.95, 1.05, 1.0, 1.15]]

    # Low risk customers for region table
    low_risk_df = df.sort_values("risk_probability", ascending=True).head(4)
    low_risk_customers = []
    for _, row in low_risk_df.iterrows():
        name = str(row.get("name", "Customer"))
        names = name.split()
        initials = (names[0][0] + names[1][0] if len(names) > 1 else name[:2]).upper()
        tenure = int(row.get("tenure_months", 12))
        low_risk_customers.append({
            "initials": initials,
            "name": name,
            "region": str(row.get("region_category", "All Region")),
            "tenure": tenure,
            "riskLevel": str(row.get("Risk Level", "Low Risk")),
            "churnProbability": float(row.get("Churn Probability", 0.0)),
            "monthlyValue": max(49, int(90 + tenure * 2.7))
        })

    # Daily Activities
    new_customers_count = max(1, int(total * 0.07))
    activities = [
        {"time": "09:46", "text": "High-risk customers updated after latest prediction run."},
        {"time": "10:12", "text": f"{new_customers_count:,} new customer records detected in active dataset."},
        {"time": "11:20", "text": "Batch upload template is available for clean CSV formatting."},
        {"time": "13:05", "text": "Retention action list generated for priority accounts."}
    ]

    return {
        "totalCustomers": total,
        "churnRate": round(churn_rate, 2),
        "atRiskCount": at_risk,
        "retainedCount": retained,
        "highRiskCount": high_risk,
        "mediumRiskCount": medium_risk,
        "lowRiskCount": low_risk,
        "churnForecast": churn_forecast,
        "regionStats": region_stats,
        "sparkline": sparkline,
        "lowRiskCustomers": low_risk_customers,
        "activities": activities
    }

@app.get("/api/customers")
def get_customers(
    search: Optional[str] = None,
    region: Optional[str] = None,
    risk: Optional[str] = None,
    limit: int = 150
):
    df = get_live_data()
    
    if search:
        df = df[df["name"].str.contains(search, case=False, na=False) | df["customer_id"].str.contains(search, case=False, na=False)]
    if region and region != "All":
        df = df[df["region_category"] == region]
    if risk and risk != "All":
        df = df[df["Risk Level"] == risk]

    # Limit result count for fast loading
    df_limited = df.head(limit)
    
    customers = []
    for _, row in df_limited.iterrows():
        name = str(row.get("name", "Customer"))
        names = name.split()
        initials = (names[0][0] + names[1][0] if len(names) > 1 else name[:2]).upper()
        tenure = int(row.get("tenure_months", 12))
        monthly_value = max(49, int(row.get("avg_transaction_value", 0) / 120) if "avg_transaction_value" in row else int(90 + tenure * 2.7))
        
        # High fidelity details mock/real mappings
        feedback = str(row.get("feedback", "No feedback provided."))
        risk_prob = float(row.get("risk_probability", 0.0))
        days_inactive = int(row.get("days_since_last_login", 0))
        support_tickets = int(row.get("avg_frequency_login_days", 0)) % 10 if "avg_frequency_login_days" in row else int(risk_prob * 10) % 6
        login_freq = "Daily" if risk_prob < 0.3 else "Weekly" if risk_prob < 0.6 else "Monthly" if risk_prob < 0.85 else "Rarely"
        
        # Recommendations generator
        recs = []
        if risk_prob >= 0.70:
            recs = [
                "⚠️ CRITICAL: Schedule an urgent manager feedback call.",
                "💡 Offer a free premium loyalty upgrade or 3-month contract extension promo.",
                "📞 Assign a dedicated VIP retention manager to follow up immediately."
            ]
        elif risk_prob >= 0.45:
            recs = [
                "⚡ Moderate Risk: Trigger an automatic satisfaction feedback questionnaire.",
                "💡 Send an exclusive 25% special discount offer valid for 10 days.",
                "📧 Email a comprehensive onboarding tutorial to boost logins."
            ]
        else:
            recs = [
                "✅ Healthy Account: Maintain standard periodic communication channels.",
                "💡 Check if eligible for up-selling high-value plan tiers."
            ]

        customers.append({
            "customerId": str(row.get("customer_id", f"CUS-{_ + 1}")),
            "name": name,
            "initials": initials,
            "region": str(row.get("region_category", "All Region")),
            "tenure": tenure,
            "riskLevel": str(row.get("Risk Level", "Low Risk")),
            "churnProbability": float(row.get("Churn Probability", 0.0)),
            "monthlyValue": monthly_value,
            "totalSpent": monthly_value * tenure,
            "loginFrequency": login_freq,
            "supportTickets": support_tickets,
            "daysInactive": days_inactive,
            "sentimentKategori": str(row.get("sentiment_kategori", "Biasa")),
            "feedback": feedback,
            "recommendations": recs,
            "phone": f"+62 812-7493-{9000 + _ % 999}",
            "planTier": str(row.get("plan_tier", "Basic" if _ % 3 == 0 else "Enterprise" if _ % 3 == 1 else "Premium"))
        })

    return {
        "count": len(customers),
        "totalMatches": len(df),
        "customers": customers,
        "regions": ["All"] + list(df["region_category"].dropna().unique())
    }

class PredictionRequest(BaseModel):
    tenure: int
    monthly_value: float
    login_frequency: str
    support_tickets: int
    days_inactive: int

@app.post("/api/predict")
def predict_churn(req: PredictionRequest):
    # Call the lightweight heuristic calculator exactly matching Streamlit's formula
    freq_factor = {"Daily": -0.14, "Weekly": 0.02, "Monthly": 0.17, "Rarely": 0.29}.get(req.login_frequency, 0.08)
    tenure_factor = 0.22 if req.tenure < 3 else 0.13 if req.tenure < 12 else -0.04 if req.tenure > 36 else 0.04
    value_factor = 0.08 if req.monthly_value > 180 else 0.03 if req.monthly_value > 100 else -0.02
    ticket_factor = min(0.20, req.support_tickets * 0.035)
    inactive_factor = min(0.25, max(0, req.days_inactive) * 0.009)
    
    prob = 0.28 + freq_factor + tenure_factor + value_factor + ticket_factor + inactive_factor
    prob = float(np.clip(prob, 0.03, 0.96))
    
    # Classify Risk Level
    risk_level = "Low Risk"
    if prob >= 0.70:
        risk_level = "High Risk"
    elif prob >= 0.45:
        risk_level = "Medium Risk"

    # Actionable AI Recommendations
    advice = []
    if req.days_inactive > 14:
        advice.append("⚠️ Days Inactive is high. Schedule a targeted re-engagement email containing a personalized promotion.")
    if req.support_tickets > 3:
        advice.append("🛠️ Ticket count is elevated. Arrange a direct technical review call from a Tier-2 support team lead.")
    if req.tenure < 6 and prob >= 0.45:
        advice.append("🌱 New Customer in Churn zone. Offer a complimentary personalized onboarding session to maximize feature adoption.")
    if req.monthly_value > 150:
        advice.append("💎 High-value customer at risk. Assign a dedicated client relations manager immediately.")
        
    if not advice:
        advice.append("📊 Account is performing well. Maintain standard touchpoints and suggest upselling to a higher plan tier.")

    return {
        "churnProbability": round(prob * 100, 1),
        "riskLevel": risk_level,
        "advice": advice
    }

@app.post("/api/batch-upload")
async def batch_upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    try:
        contents = await file.read()
        # Decode and load
        df_uploaded = pd.read_csv(pd.compat.StringIO(contents.decode('utf-8')))
        
        # Validation checks
        errors = []
        warnings = []
        valid_rows = []

        required_cols = ["tenure_months", "days_since_last_login", "avg_frequency_login_days", "churn"]
        missing_cols = [c for c in required_cols if c not in df_uploaded.columns]
        if missing_cols:
            errors.append(f"Missing required columns in CSV structure: {', '.join(missing_cols)}")
            return {
                "success": False,
                "errors": errors,
                "warnings": warnings,
                "importedRowsCount": 0
            }

        # Validate rows one by one
        for idx, row in df_uploaded.iterrows():
            row_errs = []
            
            # Boundary checks
            tenure = pd.to_numeric(row.get("tenure_months"), errors="coerce")
            if pd.isna(tenure) or tenure < 0:
                row_errs.append(f"Row {idx+1}: Tenure months must be a positive integer.")
            
            inactive = pd.to_numeric(row.get("days_since_last_login"), errors="coerce")
            if pd.isna(inactive) or inactive < 0:
                row_errs.append(f"Row {idx+1}: Inactive days must be positive.")
                
            tickets = pd.to_numeric(row.get("avg_frequency_login_days"), errors="coerce")
            if pd.isna(tickets) or tickets < 0:
                row_errs.append(f"Row {idx+1}: Support tickets count must be positive.")

            if row_errs:
                errors.extend(row_errs)
            else:
                valid_rows.append(row)

        if errors:
            # If any structural or boundary error exists, fail the upload to maintain data integrity
            return {
                "success": False,
                "errors": errors,
                "warnings": warnings,
                "importedRowsCount": 0
            }

        # Map row columns to live database structure
        imported_df_list = []
        for row in valid_rows:
            prob = 0.28 + (0.02) + (0.04) + (0.03) + min(0.20, float(row.get("avg_frequency_login_days", 0)) * 0.035) + min(0.25, float(row.get("days_since_last_login", 0)) * 0.009)
            prob = float(np.clip(prob, 0.03, 0.95))
            
            imported_df_list.append({
                "customer_id": str(row.get("customer_id", f"CUS-{len(get_live_data()) + len(imported_df_list) + 1:05d}")),
                "name": str(row.get("name", f"Customer {len(get_live_data()) + len(imported_df_list) + 1}")),
                "region_category": str(row.get("region_category", "North America")),
                "tenure_months": int(row.get("tenure_months", 12)),
                "days_since_last_login": int(row.get("days_since_last_login", 5)),
                "avg_frequency_login_days": int(row.get("avg_frequency_login_days", 2)),
                "churn": int(row.get("churn", 0)),
                "risk_probability": prob,
                "sentiment_kategori": str(row.get("sentiment_kategori", "Biasa")),
                "feedback": str(row.get("feedback", "Imported via CSV batch upload."))
            })

        if imported_df_list:
            state.uploaded_df_list.append(pd.DataFrame(imported_df_list))
            print(f"Uploaded {len(imported_df_list)} customers. Total is now: {len(get_live_data())}")

        return {
            "success": True,
            "errors": [],
            "warnings": warnings,
            "importedRowsCount": len(imported_df_list)
        }

    except Exception as e:
        return {
            "success": False,
            "errors": [f"CSV parse error: {str(e)}"],
            "warnings": [],
            "importedRowsCount": 0
        }
