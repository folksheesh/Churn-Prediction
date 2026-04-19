"""
predict.py
==========
Fungsi prediksi tunggal maupun batch – digunakan dari Streamlit.

Contoh penggunaan:
    from src.predict import predict_single, predict_batch, load_pipeline

    pipeline = load_pipeline()

    # Prediksi 1 pelanggan
    row = {"api_calls_90d": 5000, "logins_90d": 30, ...}
    result = predict_single(row, pipeline)

    # Prediksi batch (DataFrame mentah)
    df_result = predict_batch(df_raw, pipeline)
"""

import os
import sys
import pandas as pd
import numpy as np

# ── path trick ──────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from data_preprocessing  import preprocess
from feature_engineering import encode_inference, apply_scaler
from utils               import load_artifacts


# ─────────────────────────────────────────────────────────────
def load_pipeline(models_dir: str = None) -> dict:
    """
    Load semua artefak (model, scaler, label_encoders, feature_names).
    Kembalikan dict yang bisa langsung dioper ke predict_single/predict_batch.
    """
    if models_dir:
        return load_artifacts(models_dir)
    return load_artifacts()


# ─────────────────────────────────────────────────────────────
def predict_single(row: dict, pipeline: dict) -> dict:
    """
    Prediksi 1 pelanggan.

    Parameters
    ----------
    row : dict
        Satu baris data RAW (kolom sama seperti churn_data.csv, boleh tidak lengkap).
    pipeline : dict
        Output dari load_pipeline().

    Returns
    -------
    dict
        label         : "Churn" | "Not Churn"
        probability   : float (prob kelas Churn)
        prediction    : int   (1 = Churn, 0 = Not Churn)
    """
    df_raw = pd.DataFrame([row])
    return _run_inference(df_raw, pipeline).iloc[0].to_dict()


# ─────────────────────────────────────────────────────────────
def predict_batch(df_raw: pd.DataFrame, pipeline: dict) -> pd.DataFrame:
    """
    Prediksi sekelompok pelanggan.

    Parameters
    ----------
    df_raw : pd.DataFrame
        DataFrame mentah (kolom sama seperti churn_data.csv).
    pipeline : dict
        Output dari load_pipeline().

    Returns
    -------
    pd.DataFrame dengan kolom tambahan:
        prediction  : int
        probability : float
        label       : str
    """
    return _run_inference(df_raw, pipeline)


# ─────────────────────────────────────────────────────────────
# INTERNAL
# ─────────────────────────────────────────────────────────────
def _run_inference(df_raw: pd.DataFrame, pipeline: dict) -> pd.DataFrame:
    model          = pipeline["model"]
    scaler         = pipeline["scaler"]
    label_encoders = pipeline["label_encoders"]
    feature_names  = pipeline["feature_names"]

    # 1. Preprocessing (sama seperti training)
    df_prep = preprocess(df_raw, verbose=False)

    # 2. Encode kategorik dengan encoder dari training
    df_encoded = encode_inference(df_prep, label_encoders, feature_names)

    # 3. Scaling
    X_scaled = apply_scaler(scaler, df_encoded)

    # 4. Prediksi
    predictions = model.predict(X_scaled)
    probabilities = model.predict_proba(X_scaled)[:, 1]

    result = df_raw.copy()
    result["prediction"]  = predictions
    result["probability"] = np.round(probabilities, 4)
    result["label"]       = np.where(predictions == 1, "Churn", "Not Churn")

    return result
