"""
train_model.py
==============
Pipeline training lengkap: load data → preprocess → encode → train → save.

Jalankan dari root project:
    python src/train_model.py
"""

import os
import sys

import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# ── path trick supaya import antar modul src/ berjalan ──────
sys.path.insert(0, os.path.dirname(__file__))

from data_preprocessing  import preprocess
from feature_engineering import encode_and_split, fit_scaler
from utils               import save_artifacts, MODELS_DIR


# ─────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────
DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "raw", "churn_data.csv"
)

XGB_PARAMS = dict(
    n_estimators      = 150,
    learning_rate     = 0.1,
    max_depth         = 6,
    min_child_weight  = 1,
    subsample         = 0.8,
    colsample_bytree  = 0.8,
    random_state      = 42,
    use_label_encoder = False,
    eval_metric       = "logloss",
)

TEST_SIZE   = 0.2
RANDOM_SEED = 42


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def train(data_path: str = DATA_PATH) -> dict:
    """
    Full training pipeline.

    Returns
    -------
    dict dengan key: model, scaler, label_encoders, feature_names,
                     X_test_scaled, y_test, y_pred, y_pred_proba
    """
    print("=" * 60)
    print("📂 Load data …")
    df_raw = pd.read_csv(data_path)
    print(f"   shape: {df_raw.shape}")

    # ── 1. Preprocessing ────────────────────────────────────
    print("\n🔧 Preprocessing …")
    df = preprocess(df_raw, verbose=True)

    # ── 2. Encoding & split ──────────────────────────────────
    print("\n🔢 Encoding & splitting …")
    X, y, label_encoders, feature_names = encode_and_split(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    print(f"   train={X_train.shape[0]}  test={X_test.shape[0]}  features={len(feature_names)}")

    # ── 3. Scaling ───────────────────────────────────────────
    scaler, X_train_scaled = fit_scaler(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 4. Training ──────────────────────────────────────────
    print("\n🤖 Training XGBoost …")
    model = XGBClassifier(**XGB_PARAMS)
    model.fit(X_train_scaled, y_train)

    y_pred       = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    print("✅ Training selesai!")

    # ── 5. Save artifacts ────────────────────────────────────
    print(f"\n💾 Menyimpan artefak ke {MODELS_DIR} …")
    save_artifacts(model, scaler, label_encoders, feature_names)
    print("✅ Artefak tersimpan!")
    print("=" * 60)

    return dict(
        model          = model,
        scaler         = scaler,
        label_encoders = label_encoders,
        feature_names  = feature_names,
        X_test_scaled  = X_test_scaled,
        y_test         = y_test,
        y_pred         = y_pred,
        y_pred_proba   = y_pred_proba,
    )


if __name__ == "__main__":
    train()
