"""
feature_engineering.py
=======================
Encoding kategorik dan scaling – konsisten antara training dan inference.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


TARGET_COL = "churn"


def encode_and_split(df: pd.DataFrame, target: str = TARGET_COL):
    """
    Encode kolom kategorik, pisahkan X dan y.

    Returns
    -------
    X : pd.DataFrame
    y : pd.Series
    label_encoders : dict   {col_name: fitted LabelEncoder}
    feature_names  : list
    """
    df = df.copy()

    # Pastikan target numerik
    df[target] = pd.to_numeric(df[target], errors="coerce")
    if df[target].isnull().all():
        df[target] = 0
    elif df[target].isnull().any():
        df[target] = df[target].fillna(df[target].mode()[0])

    cat_cols = df.select_dtypes(include=["object"]).columns
    label_encoders: dict = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    X = df.drop(target, axis=1)
    y = df[target]
    feature_names = X.columns.tolist()

    return X, y, label_encoders, feature_names


def fit_scaler(X_train: pd.DataFrame) -> tuple:
    """Fit StandardScaler pada data training. Kembalikan (scaler, X_train_scaled)."""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_train)
    return scaler, X_scaled


def apply_scaler(scaler: StandardScaler, X: pd.DataFrame) -> np.ndarray:
    """Terapkan scaler yang sudah di-fit ke data baru."""
    return scaler.transform(X)


def encode_inference(df_raw_preprocessed: pd.DataFrame,
                     label_encoders: dict,
                     feature_names: list) -> pd.DataFrame:
    """
    Encode satu baris / batch data baru menggunakan label_encoders dari training.

    Parameters
    ----------
    df_raw_preprocessed : pd.DataFrame
        DataFrame yang sudah melalui preprocessing (preprocess()).
    label_encoders : dict
        Label encoders dari training.
    feature_names : list
        Urutan kolom fitur dari training.

    Returns
    -------
    pd.DataFrame  dengan kolom sesuai feature_names, sudah di-encode.
    """
    df = df_raw_preprocessed.copy()

    # Hapus target jika ada
    df.drop(columns=[TARGET_COL], inplace=True, errors="ignore")

    for col, le in label_encoders.items():
        if col not in df.columns:
            continue
        # Handle nilai unseen → fallback ke mode training
        known = set(le.classes_)
        df[col] = df[col].astype(str).apply(
            lambda v: v if v in known else le.classes_[0]
        )
        df[col] = le.transform(df[col])

    # Pastikan urutan kolom sama dengan training
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0          # kolom yang tidak ada di inference → 0
    df = df[feature_names]

    return df
