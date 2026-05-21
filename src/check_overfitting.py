"""
check_overfitting.py
====================
Modul untuk mendeteksi dan memvisualisasikan overfitting pada model XGBoost.

Cara pakai:
    python src/check_overfitting.py

Atau dari notebook / modul lain:
    from check_overfitting import run_overfitting_check
    run_overfitting_check()
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_validate,
    learning_curve,
)
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    roc_auc_score,
    classification_report,
)
from xgboost import XGBClassifier

# ── path trick supaya import antar modul src/ berjalan ──────
sys.path.insert(0, os.path.dirname(__file__))
from data_preprocessing  import preprocess
from feature_engineering import encode_and_split, fit_scaler

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

RANDOM_SEED = 42
CV_FOLDS    = 5          # jumlah fold cross-validation
THRESHOLD   = 0.05       # batas toleransi gap train vs val (5%)


# ─────────────────────────────────────────────────────────────
# 1. LOAD & PREPARE DATA
# ─────────────────────────────────────────────────────────────
def load_and_prepare(data_path: str = DATA_PATH):
    """
    Load CSV → preprocess → encode → scale.

    Returns
    -------
    X_scaled : np.ndarray
    y        : np.ndarray
    """
    print("=" * 60)
    print("📂 Load & prepare data …")
    df_raw = pd.read_csv(data_path)
    df     = preprocess(df_raw, verbose=False)

    X, y, _, _ = encode_and_split(df)

    # Scale seluruh dataset dulu (scaler difit dari semua data)
    from sklearn.preprocessing import StandardScaler
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print(f"   ✅ Data siap: X={X_scaled.shape}, y distribusi: {dict(zip(*np.unique(y, return_counts=True)))}")
    return X_scaled, y


# ─────────────────────────────────────────────────────────────
# 2. CEK 1 — TRAIN vs TEST ACCURACY SEDERHANA
# ─────────────────────────────────────────────────────────────
def check_train_vs_test(X, y):
    """
    Latih model sekali dengan split 80/20, bandingkan skor
    training dan testing.

    Jika (train_acc - test_acc) > THRESHOLD → kemungkinan overfitting.
    """
    print("\n" + "=" * 60)
    print("📌 CEK 1: Train Accuracy vs Test Accuracy")
    print("=" * 60)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    model = XGBClassifier(**XGB_PARAMS)
    model.fit(X_train, y_train)

    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_acc  = accuracy_score(y_test,  model.predict(X_test))
    train_auc = roc_auc_score(y_train, model.predict_proba(X_train)[:, 1])
    test_auc  = roc_auc_score(y_test,  model.predict_proba(X_test)[:, 1])

    gap_acc = train_acc - test_acc
    gap_auc = train_auc - test_auc

    print(f"   Train Accuracy : {train_acc:.4f}")
    print(f"   Test  Accuracy : {test_acc:.4f}")
    print(f"   Gap Accuracy   : {gap_acc:.4f}  {'⚠️  OVERFITTING TERDETEKSI' if gap_acc > THRESHOLD else '✅ Normal'}")
    print(f"")
    print(f"   Train AUC      : {train_auc:.4f}")
    print(f"   Test  AUC      : {test_auc:.4f}")
    print(f"   Gap AUC        : {gap_auc:.4f}  {'⚠️  OVERFITTING TERDETEKSI' if gap_auc > THRESHOLD else '✅ Normal'}")

    return {
        "train_acc": train_acc, "test_acc": test_acc,
        "train_auc": train_auc, "test_auc": test_auc,
        "gap_acc": gap_acc,     "gap_auc": gap_auc,
        "model": model, "X_test": X_test, "y_test": y_test,
    }


# ─────────────────────────────────────────────────────────────
# 3. CEK 2 — STRATIFIED K-FOLD CROSS VALIDATION
# ─────────────────────────────────────────────────────────────
def check_cross_validation(X, y):
    """
    Lakukan Stratified K-Fold CV.

    Model yang TIDAK overfitting akan menunjukkan:
    - Mean CV score mendekati train score
    - Standar deviasi antar fold kecil (< 0.03)
    """
    print("\n" + "=" * 60)
    print(f"📌 CEK 2: {CV_FOLDS}-Fold Stratified Cross-Validation")
    print("=" * 60)

    skf   = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    model = XGBClassifier(**XGB_PARAMS)

    cv_results = cross_validate(
        model, X, y, cv=skf,
        scoring=["accuracy", "f1", "roc_auc"],
        return_train_score=True,
        n_jobs=-1,
    )

    metrics = {
        "accuracy": ("train_accuracy", "test_accuracy"),
        "f1":       ("train_f1",       "test_f1"),
        "roc_auc":  ("train_roc_auc",  "test_roc_auc"),
    }

    summary = {}
    for metric, (train_key, test_key) in metrics.items():
        tr = cv_results[train_key]
        te = cv_results[test_key]
        gap = tr.mean() - te.mean()
        overfitting = "⚠️  OVERFITTING" if gap > THRESHOLD else "✅ OK"
        print(f"\n   [{metric.upper()}]")
        print(f"   Train  : {tr.mean():.4f} ± {tr.std():.4f}")
        print(f"   Val CV : {te.mean():.4f} ± {te.std():.4f}")
        print(f"   Gap    : {gap:.4f}  → {overfitting}")
        if te.std() > 0.03:
            print(f"   ⚠️  Variansi antar fold tinggi ({te.std():.4f}) → model tidak stabil")
        summary[metric] = {"train": tr.mean(), "val": te.mean(), "gap": gap, "std": te.std()}

    return summary, cv_results


# ─────────────────────────────────────────────────────────────
# 4. CEK 3 — LEARNING CURVE
# ─────────────────────────────────────────────────────────────
def compute_learning_curve(X, y):
    """
    Hitung learning curve: skor train dan val untuk berbagai ukuran
    data training.

    Interpretasi:
    - Overfitting  : train score tinggi, val score rendah & jauh terpisah
    - Underfitting : keduanya rendah
    - Ideal        : keduanya tinggi dan mendekati satu sama lain
    """
    print("\n" + "=" * 60)
    print("📌 CEK 3: Learning Curve")
    print("=" * 60)

    model      = XGBClassifier(**XGB_PARAMS)
    train_sizes = np.linspace(0.1, 1.0, 10)

    train_sizes_abs, train_scores, val_scores = learning_curve(
        model, X, y,
        train_sizes=train_sizes,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED),
        scoring="roc_auc",
        n_jobs=-1,
    )

    train_mean = train_scores.mean(axis=1)
    train_std  = train_scores.std(axis=1)
    val_mean   = val_scores.mean(axis=1)
    val_std    = val_scores.std(axis=1)

    final_gap = train_mean[-1] - val_mean[-1]
    print(f"   Gap akhir (100% data): {final_gap:.4f}")
    if final_gap > THRESHOLD:
        print(f"   ⚠️  Kurva menunjukkan tanda OVERFITTING")
    else:
        print(f"   ✅ Model tampak generalizes dengan baik")

    return train_sizes_abs, train_mean, train_std, val_mean, val_std


# ─────────────────────────────────────────────────────────────
# 5. VISUALISASI GABUNGAN
# ─────────────────────────────────────────────────────────────
def plot_overfitting_dashboard(
    cv_summary,
    train_sizes, train_mean, train_std, val_mean, val_std,
    train_vs_test: dict,
    save_path: str = None,
):
    """
    Buat dashboard 4-panel:
      [A] Bar chart: Train vs Val per metric (dari CV)
      [B] Learning Curve (AUC)
      [C] Gap Chart: seberapa besar selisih train-val
      [D] Tabel ringkasan diagnosis
    """
    fig = plt.figure(figsize=(18, 12))
    fig.suptitle(
        "🔍 Overfitting Diagnosis Dashboard — Churn Prediction XGBoost",
        fontsize=16, fontweight="bold", y=1.01,
    )
    gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.45, wspace=0.35)

    # ── PANEL A: Bar Chart Train vs Val ───────────────────────
    ax_a = fig.add_subplot(gs[0, 0])
    metrics   = list(cv_summary.keys())
    train_v   = [cv_summary[m]["train"] for m in metrics]
    val_v     = [cv_summary[m]["val"]   for m in metrics]
    x         = np.arange(len(metrics))
    width     = 0.35

    bars_t = ax_a.bar(x - width/2, train_v, width, label="Train",
                      color="#2563EB", alpha=0.85)
    bars_v = ax_a.bar(x + width/2, val_v,   width, label="Validation (CV)",
                      color="#16A34A", alpha=0.85)

    ax_a.bar_label(bars_t, fmt="%.3f", padding=3, fontsize=8)
    ax_a.bar_label(bars_v, fmt="%.3f", padding=3, fontsize=8)
    ax_a.set_xticks(x)
    ax_a.set_xticklabels([m.upper() for m in metrics])
    ax_a.set_ylim(0, 1.15)
    ax_a.set_title("A. Train vs Validation Score (5-Fold CV)", fontweight="bold")
    ax_a.set_ylabel("Score")
    ax_a.legend()
    ax_a.axhline(0.95, color="red", linestyle="--", alpha=0.4, label="Ref 0.95")
    ax_a.grid(axis="y", alpha=0.3)

    # ── PANEL B: Learning Curve ───────────────────────────────
    ax_b = fig.add_subplot(gs[0, 1])
    ax_b.plot(train_sizes, train_mean, "o-", color="#2563EB",
              label="Train AUC", lw=2)
    ax_b.fill_between(train_sizes,
                      train_mean - train_std, train_mean + train_std,
                      alpha=0.15, color="#2563EB")
    ax_b.plot(train_sizes, val_mean, "s-", color="#16A34A",
              label="Val AUC (CV)", lw=2)
    ax_b.fill_between(train_sizes,
                      val_mean - val_std, val_mean + val_std,
                      alpha=0.15, color="#16A34A")
    ax_b.set_xlabel("Jumlah Data Training")
    ax_b.set_ylabel("AUC Score")
    ax_b.set_title("B. Learning Curve (AUC)", fontweight="bold")
    ax_b.legend(loc="lower right")
    ax_b.set_ylim(0.5, 1.05)
    ax_b.grid(alpha=0.3)

    # Anotasi area overfitting
    final_gap = train_mean[-1] - val_mean[-1]
    ax_b.annotate(
        f"Gap akhir:\n{final_gap:.3f}",
        xy=(train_sizes[-1], (train_mean[-1] + val_mean[-1]) / 2),
        xytext=(train_sizes[-2] * 0.6, 0.72),
        arrowprops=dict(arrowstyle="->", color="gray"),
        fontsize=9, color="gray",
    )

    # ── PANEL C: Gap Bar Chart ────────────────────────────────
    ax_c = fig.add_subplot(gs[1, 0])
    gaps   = [cv_summary[m]["gap"] for m in metrics]
    colors = ["#EF4444" if g > THRESHOLD else "#16A34A" for g in gaps]
    bars_g = ax_c.bar(metrics, gaps, color=colors, alpha=0.85)
    ax_c.bar_label(bars_g, fmt="%.4f", padding=3, fontsize=8)
    ax_c.axhline(THRESHOLD, color="red", linestyle="--", lw=1.5,
                 label=f"Threshold overfitting ({THRESHOLD})")
    ax_c.set_title("C. Gap (Train − Val) per Metric", fontweight="bold")
    ax_c.set_ylabel("Gap")
    ax_c.set_xticklabels([m.upper() for m in metrics])
    ax_c.legend()
    ax_c.grid(axis="y", alpha=0.3)

    # ── PANEL D: Tabel Ringkasan Diagnosis ────────────────────
    ax_d = fig.add_subplot(gs[1, 1])
    ax_d.axis("off")

    rows = []
    for m in metrics:
        s   = cv_summary[m]
        gap = s["gap"]
        std = s["std"]
        status = "⚠️ OVERFITTING" if gap > THRESHOLD else ("⚠️ UNSTABLE" if std > 0.03 else "✅ OK")
        rows.append([m.upper(), f"{s['train']:.4f}", f"{s['val']:.4f}",
                     f"{gap:.4f}", f"{std:.4f}", status])

    # Tambah baris train-vs-test sederhana
    gap_acc = train_vs_test["gap_acc"]
    gap_auc = train_vs_test["gap_auc"]
    rows.append(["ACC (holdout)", f"{train_vs_test['train_acc']:.4f}",
                 f"{train_vs_test['test_acc']:.4f}",
                 f"{gap_acc:.4f}", "—",
                 "⚠️ OVERFITTING" if gap_acc > THRESHOLD else "✅ OK"])
    rows.append(["AUC (holdout)", f"{train_vs_test['train_auc']:.4f}",
                 f"{train_vs_test['test_auc']:.4f}",
                 f"{gap_auc:.4f}", "—",
                 "⚠️ OVERFITTING" if gap_auc > THRESHOLD else "✅ OK"])

    col_labels = ["Metric", "Train", "Val/Test", "Gap", "Std CV", "Diagnosis"]
    tbl = ax_d.table(
        cellText=rows,
        colLabels=col_labels,
        loc="center",
        cellLoc="center",
    )
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(9)
    tbl.scale(1.2, 1.8)

    # Warnai header
    for j in range(len(col_labels)):
        tbl[0, j].set_facecolor("#1E40AF")
        tbl[0, j].set_text_props(color="white", fontweight="bold")

    # Warnai baris overfitting
    for i, row in enumerate(rows, start=1):
        if "OVERFITTING" in row[-1]:
            for j in range(len(col_labels)):
                tbl[i, j].set_facecolor("#FEE2E2")
        elif "UNSTABLE" in row[-1]:
            for j in range(len(col_labels)):
                tbl[i, j].set_facecolor("#FEF3C7")

    ax_d.set_title("D. Ringkasan Diagnosis Overfitting", fontweight="bold", pad=20)

    plt.tight_layout()

    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        fig.savefig(save_path, bbox_inches="tight", dpi=150)
        print(f"\n📸 Dashboard disimpan ke: {save_path}")

    plt.show()


# ─────────────────────────────────────────────────────────────
# 6. CETAK KESIMPULAN AKHIR
# ─────────────────────────────────────────────────────────────
def print_final_verdict(cv_summary, train_vs_test):
    """Cetak verdict akhir apakah model overfitting atau tidak."""
    print("\n" + "=" * 60)
    print("🏁 KESIMPULAN AKHIR")
    print("=" * 60)

    flags = []
    for m, s in cv_summary.items():
        if s["gap"] > THRESHOLD:
            flags.append(f"  ❌ {m.upper()}: gap CV = {s['gap']:.4f} > {THRESHOLD} (overfitting)")
        if s["std"] > 0.03:
            flags.append(f"  ⚠️  {m.upper()}: std CV = {s['std']:.4f} > 0.03 (tidak stabil)")

    if train_vs_test["gap_acc"] > THRESHOLD:
        flags.append(f"  ❌ Accuracy holdout: gap = {train_vs_test['gap_acc']:.4f} (overfitting)")
    if train_vs_test["gap_auc"] > THRESHOLD:
        flags.append(f"  ❌ AUC holdout: gap = {train_vs_test['gap_auc']:.4f} (overfitting)")

    if flags:
        print("⚠️  Model KEMUNGKINAN OVERFITTING. Indikasi:")
        for f in flags:
            print(f)
        print("\n💡 SARAN PERBAIKAN:")
        print("  1. Turunkan max_depth (coba 3–4)")
        print("  2. Kurangi n_estimators atau tambah early_stopping_rounds")
        print("  3. Naikkan min_child_weight (coba 3–5)")
        print("  4. Tambah regularisasi: reg_alpha, reg_lambda")
        print("  5. Kurangi learning_rate (0.01–0.05) + naikkan n_estimators")
    else:
        print("✅ Model TIDAK overfitting!")
        print("   Semua gap (train − val) berada di bawah threshold 5%.")
        print("   Model generalizes dengan baik ke data baru.")


# ─────────────────────────────────────────────────────────────
# 7. ENTRY POINT UTAMA
# ─────────────────────────────────────────────────────────────
def run_overfitting_check(data_path: str = DATA_PATH, save_dashboard: bool = True):
    """
    Jalankan seluruh pipeline pengecekan overfitting.

    Parameters
    ----------
    data_path       : path ke CSV data mentah
    save_dashboard  : simpan gambar dashboard ke reports/
    """
    X, y = load_and_prepare(data_path)

    # Cek 1: Train vs Test sederhana
    tvt = check_train_vs_test(X, y)

    # Cek 2: Cross-Validation
    cv_summary, _ = check_cross_validation(X, y)

    # Cek 3: Learning Curve
    ts, tm, ts_std, vm, vs_std = compute_learning_curve(X, y)

    # Verdict
    print_final_verdict(cv_summary, tvt)

    # Plot dashboard
    save_path = None
    if save_dashboard:
        save_path = os.path.join(
            os.path.dirname(__file__), "..", "reports", "overfitting_dashboard.png"
        )
    plot_overfitting_dashboard(
        cv_summary,
        ts, tm, ts_std, vm, vs_std,
        tvt,
        save_path=save_path,
    )


if __name__ == "__main__":
    run_overfitting_check()
