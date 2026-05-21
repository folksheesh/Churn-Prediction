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
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
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
    eval_metric       = "logloss",
)

TEST_SIZE   = 0.2
RANDOM_SEED = 42
TOP_N_FEATURES = 10


def _compute_metrics(y_true, y_pred, y_pred_proba) -> dict:
    return dict(
        accuracy = accuracy_score(y_true, y_pred),
        precision = precision_score(y_true, y_pred, zero_division=0),
        recall = recall_score(y_true, y_pred, zero_division=0),
        f1 = f1_score(y_true, y_pred, zero_division=0),
        roc_auc = roc_auc_score(y_true, y_pred_proba),
    )


def _print_metrics(title: str, metrics: dict):
    print(f"\n{title}")
    print("-" * len(title))
    print(f"Accuracy : {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall   : {metrics['recall']:.4f}")
    print(f"F1-score : {metrics['f1']:.4f}")
    print(f"ROC-AUC  : {metrics['roc_auc']:.4f}")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def train(data_path: str = DATA_PATH) -> dict:
    """
    Full training pipeline.

    Returns
    -------
    dict dengan key: model, scaler, label_encoders, feature_names,
                     X_test_scaled, y_test, y_pred, y_pred_proba,
                     selected_features, full_model_metrics, top10_model_metrics
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
    print("\n🤖 Training XGBoost full-feature model …")
    full_model = XGBClassifier(**XGB_PARAMS)
    full_model.fit(X_train_scaled, y_train)

    full_y_pred = full_model.predict(X_test_scaled)
    full_y_pred_proba = full_model.predict_proba(X_test_scaled)[:, 1]
    full_model_metrics = _compute_metrics(y_test, full_y_pred, full_y_pred_proba)

    importances = full_model.feature_importances_
    feature_importance_df = (
        pd.DataFrame({"Feature": feature_names, "Importance": importances})
        .sort_values("Importance", ascending=False)
        .reset_index(drop=True)
    )
    selected_features = feature_importance_df.head(TOP_N_FEATURES)["Feature"].tolist()

    print("\n🔍 Top 10 fitur berdasarkan feature importance:")
    print(feature_importance_df.head(TOP_N_FEATURES).to_string(index=False))

    X_train_top = X_train[selected_features]
    X_test_top = X_test[selected_features]
    scaler_top, X_train_top_scaled = fit_scaler(X_train_top)
    X_test_top_scaled = scaler_top.transform(X_test_top)

    print("\n🤖 Training XGBoost top-10 feature model …")
    model = XGBClassifier(**XGB_PARAMS)
    model.fit(X_train_top_scaled, y_train)

    y_pred = model.predict(X_test_top_scaled)
    y_pred_proba = model.predict_proba(X_test_top_scaled)[:, 1]
    top10_model_metrics = _compute_metrics(y_test, y_pred, y_pred_proba)

    print("✅ Training selesai!")
    _print_metrics("METRIK MODEL FULL FEATURE", full_model_metrics)
    _print_metrics(f"METRIK MODEL TOP {TOP_N_FEATURES} FEATURE", top10_model_metrics)
    print("\n📌 Dampak feature importance:")
    print(
        f"   Model final menggunakan {TOP_N_FEATURES} fitur teratas dari model full-feature, "
        f"jadi interpretasi importance langsung mempengaruhi training dan bukan hanya visualisasi."
    )

    # ── 5. Save artifacts ────────────────────────────────────
    print(f"\n💾 Menyimpan artefak ke {MODELS_DIR} …")
    save_artifacts(model, scaler_top, label_encoders, selected_features)
    print("✅ Artefak tersimpan!")
    print("=" * 60)

    return dict(
        model          = model,
        scaler         = scaler_top,
        label_encoders = label_encoders,
        feature_names  = selected_features,
        selected_features = selected_features,
        full_model_metrics = full_model_metrics,
        top10_model_metrics = top10_model_metrics,
        X_test_scaled  = X_test_top_scaled,
        y_test         = y_test,
        y_pred         = y_pred,
        y_pred_proba   = y_pred_proba,
    )


if __name__ == "__main__":
    train()
