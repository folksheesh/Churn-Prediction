"""
utils.py
========
Helper umum: simpan/load artefak model.
"""

import os
import joblib

# ─────────────────────────────────────────────────────────────
# PATH DEFAULTS
# ─────────────────────────────────────────────────────────────
_SRC_DIR   = os.path.dirname(__file__)
MODELS_DIR = os.path.join(_SRC_DIR, "..", "models")

MODEL_PATH          = os.path.join(MODELS_DIR, "xgb_model.pkl")
SCALER_PATH         = os.path.join(MODELS_DIR, "scaler.pkl")
LABEL_ENCODERS_PATH = os.path.join(MODELS_DIR, "label_encoders.pkl")
FEATURE_COLS_PATH   = os.path.join(MODELS_DIR, "feature_columns.pkl")


# ─────────────────────────────────────────────────────────────
# SAVE / LOAD
# ─────────────────────────────────────────────────────────────
def save_artifacts(model, scaler, label_encoders, feature_names,
                   models_dir: str = MODELS_DIR):
    """Simpan semua artefak ke folder models/."""
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(model,          os.path.join(models_dir, "xgb_model.pkl"))
    joblib.dump(scaler,         os.path.join(models_dir, "scaler.pkl"))
    joblib.dump(label_encoders, os.path.join(models_dir, "label_encoders.pkl"))
    joblib.dump(feature_names,  os.path.join(models_dir, "feature_columns.pkl"))


def load_artifacts(models_dir: str = MODELS_DIR) -> dict:
    """
    Load semua artefak dari folder models/.

    Returns
    -------
    dict dengan key: model, scaler, label_encoders, feature_names
    """
    return dict(
        model          = joblib.load(os.path.join(models_dir, "xgb_model.pkl")),
        scaler         = joblib.load(os.path.join(models_dir, "scaler.pkl")),
        label_encoders = joblib.load(os.path.join(models_dir, "label_encoders.pkl")),
        feature_names  = joblib.load(os.path.join(models_dir, "feature_columns.pkl")),
    )
