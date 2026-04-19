"""
streamlit_app.py  –  ChurnSight (Azia Template Integration)
============================================================
Jalankan:  streamlit run app/streamlit_app.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import streamlit as st
import pandas as pd
import streamlit.components.v1 as components

from utils import load_artifacts, MODELS_DIR
from predict import predict_batch
from template_renderer import build_dashboard
from sklearn.metrics import confusion_matrix, roc_curve, roc_auc_score
from feature_engineering import encode_inference, apply_scaler

# ── Config ────────────────────────────────────────────────────
st.set_page_config(
    page_title="ChurnSight – Azia Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Hide Streamlit chrome so only the Azia UI shows
st.markdown("""<style>
#MainMenu, footer, header, [data-testid="stToolbar"] {display:none!important}
.block-container {padding:0!important; max-width:100%!important}
[data-testid="stSidebar"] {display:none!important}
iframe {border:none!important}
</style>""", unsafe_allow_html=True)

# ── Paths ─────────────────────────────────────────────────────
ROOT = os.path.join(os.path.dirname(__file__), "..")
PROC = os.path.join(ROOT, "data", "processed", "cleaned_churn_data.csv")

# ── Load Model & Data ─────────────────────────────────────────
@st.cache_resource(show_spinner="Loading XGBoost model…")
def get_pipeline():
    return load_artifacts(MODELS_DIR)

@st.cache_data(show_spinner="Loading dataset…")
def get_data():
    if os.path.exists(PROC):
        return pd.read_csv(PROC)
    return None

try:
    pipeline = get_pipeline()
except Exception as e:
    st.error(f"⚠️ Model not found. Run `python src/train_model.py` first.\n\n{e}")
    st.stop()

df = get_data()

# ── Build Data Payload ────────────────────────────────────────
if df is not None and "churn" in df.columns:
    total   = int(len(df))
    churn_n = int(df["churn"].sum())
    safe_n  = int(total - churn_n)
    rate    = round(churn_n / total * 100, 2) if total else 0.0

    # Feature importance
    fn = pipeline["feature_names"]
    fi = pipeline["model"].feature_importances_.tolist()

    # Sentiment distribution
    if "sentiment_kategori" in df.columns:
        order = ["Sangat Puas","Puas","Biasa","Kecewa","Sangat Kecewa"]
        sc = df["sentiment_kategori"].value_counts()
        sent = {k: int(sc.get(k, 0)) for k in order}
    else:
        sent = {"No Data": total}

    # Plan distribution
    if "plan_tier" in df.columns:
        plan = {str(k): int(v) for k,v in df["plan_tier"].value_counts().items()}
    else:
        plan = {"Unknown": total}

    # Behavior means
    def safe_mean(col, mask):
        return round(float(df.loc[mask, col].mean()), 2) if col in df.columns else 0.0

    r_mask = df["churn"] == 0
    c_mask = df["churn"] == 1

    data_payload = dict(
        total=total,
        churn_n=churn_n,
        safe_n=safe_n,
        churn_rate=rate,
        feature_names=fn,
        feature_importances=fi,
        sentiment_counts=sent,
        plan_counts=plan,
        logins_mean_retained=safe_mean("logins_90d", r_mask),
        logins_mean_churned=safe_mean("logins_90d", c_mask),
        active_days_mean_retained=safe_mean("active_days_90d", r_mask),
        active_days_mean_churned=safe_mean("active_days_90d", c_mask),
    )

    # ── Advanced Metrics (ROC, CM, Predictions) ──
    # Calculate ROC and Confusion Matrix using the model
    try:
        # Encode and scale data for inference
        X_encoded = encode_inference(df.drop(columns=["churn"], errors="ignore"), pipeline["label_encoders"], fn)
        X_scaled = apply_scaler(pipeline["scaler"], X_encoded)
        
        # Get predictions
        y_true = df["churn"].astype(int)
        y_pred = pipeline["model"].predict(X_scaled)
        y_prob = pipeline["model"].predict_proba(X_scaled)[:, 1]

        # Confusion Matrix
        cm = confusion_matrix(y_true, y_pred).tolist()
        
        # ROC Curve
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        auc_score = roc_auc_score(y_true, y_prob)
        
        # Downsample ROC curve for JSON payload (max 50 points) to save bandwidth
        step = max(1, len(fpr) // 50)
        roc_data = [{"x": float(f), "y": float(t)} for f, t in zip(fpr[::step], tpr[::step])]
        if {"x": 1.0, "y": 1.0} not in roc_data:
            roc_data.append({"x": 1.0, "y": 1.0})

        data_payload["cm"] = cm
        data_payload["roc_data"] = roc_data
        data_payload["auc_score"] = float(auc_score)

        # High Risk Table: Predict for a subset and take top 5
        df_scored = df.copy()
        df_scored["probability"] = y_prob
        top_risk = df_scored.sort_values("probability", ascending=False).head(5)
        
        risk_table = []
        for _, row in top_risk.iterrows():
            # Create a simple unique ID or use age+region if no ID exists
            uid = f"USR-{int(row.name):04d}"
            risk_table.append({
                "id": uid,
                "plan": str(row.get("plan_tier", "Unknown")),
                "logins": int(row.get("logins_90d", 0)),
                "sentiment": str(row.get("sentiment_kategori", "Unknown")),
                "prob": float(row["probability"])
            })
        data_payload["risk_table"] = risk_table

        # Business Report Insights
        revenue_at_risk = float(df.loc[y_pred == 1, "avg_transaction_value"].sum() if "avg_transaction_value" in df.columns else 0.0)
        avg_risk_points = float(df.loc[y_pred == 1, "points_in_wallet"].mean() if "points_in_wallet" in df.columns else 0.0)
        
        # Top Complaint causing Churn
        if "feedback" in df.columns:
            churn_feedback = df[df["churn"] == 1]["feedback"].value_counts()
            top_feedback = churn_feedback.index[0] if not churn_feedback.empty else "N/A"
            top_feedback_pct = (churn_feedback.iloc[0] / churn_n * 100) if not churn_feedback.empty and churn_n > 0 else 0
        else:
            top_feedback, top_feedback_pct = "N/A", 0.0
            
        data_payload["report"] = {
            "revenue_at_risk": revenue_at_risk,
            "avg_risk_points": avg_risk_points,
            "top_feedback": top_feedback,
            "top_feedback_pct": float(top_feedback_pct)
        }

    except Exception as e:
        print("Error calculating advanced metrics:", e)
        data_payload["cm"] = [[0,0],[0,0]]
        data_payload["roc_data"] = []
        data_payload["auc_score"] = 0.0
        data_payload["risk_table"] = []
        data_payload["report"] = {"revenue_at_risk":0, "avg_risk_points":0, "top_feedback":"N/A", "top_feedback_pct":0}
else:
    # Fallback dummy data if no dataset
    data_payload = dict(
        total=0, churn_n=0, safe_n=0, churn_rate=0.0,
        feature_names=pipeline["feature_names"],
        feature_importances=pipeline["model"].feature_importances_.tolist(),
        sentiment_counts={"No Data": 1},
        plan_counts={"No Data": 1},
        logins_mean_retained=0, logins_mean_churned=0,
        active_days_mean_retained=0, active_days_mean_churned=0,
        cm=[[0,0],[0,0]], roc_data=[], auc_score=0.0, risk_table=[],
        report={"revenue_at_risk":0, "avg_risk_points":0, "top_feedback":"N/A", "top_feedback_pct":0}
    )

# ── Render Azia Template ──────────────────────────────────────
html_content = build_dashboard(data_payload)

# Render full-page Azia HTML inside Streamlit
components.html(html_content, height=3100, scrolling=True)
