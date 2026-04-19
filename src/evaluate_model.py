"""
evaluate_model.py
=================
Fungsi evaluasi model (classification report, confusion matrix, ROC-AUC).
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
)


def print_classification_report(y_true, y_pred):
    print("=" * 60)
    print("📊 CLASSIFICATION REPORT")
    print("=" * 60)
    print(classification_report(y_true, y_pred, target_names=["Not Churn", "Churn"]))


def compute_roc_auc(y_true, y_pred_proba) -> float:
    score = roc_auc_score(y_true, y_pred_proba)
    print(f"🎯 ROC-AUC Score: {score:.4f}")
    return score


def plot_confusion_matrix(y_true, y_pred, ax=None, save_path: str = None):
    cm = confusion_matrix(y_true, y_pred)
    fig = None
    if ax is None:
        fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues", ax=ax,
        xticklabels=["Not Churn", "Churn"],
        yticklabels=["Not Churn", "Churn"],
    )
    ax.set_title("Confusion Matrix", fontsize=12, fontweight="bold")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    if save_path and fig:
        fig.savefig(save_path, bbox_inches="tight")
    return ax


def plot_feature_importance(model, feature_names, top_n=15, ax=None, save_path=None):
    importances = model.feature_importances_
    fi_df = (
        pd.DataFrame({"Feature": feature_names, "Importance": importances})
        .sort_values("Importance", ascending=True)
        .tail(top_n)
    )
    fig = None
    if ax is None:
        fig, ax = plt.subplots(figsize=(7, 5))
    ax.barh(fi_df["Feature"], fi_df["Importance"], color="steelblue")
    ax.set_title(f"Top {top_n} Feature Importances", fontsize=12, fontweight="bold")
    ax.set_xlabel("Importance")
    if save_path and fig:
        fig.savefig(save_path, bbox_inches="tight")
    return ax


def plot_roc_curve(y_true, y_pred_proba, ax=None, save_path=None):
    fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
    auc = roc_auc_score(y_true, y_pred_proba)
    fig = None
    if ax is None:
        fig, ax = plt.subplots(figsize=(5, 4))
    ax.plot(fpr, tpr, lw=2, label=f"AUC = {auc:.4f}")
    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set_xlim([0, 1])
    ax.set_ylim([0, 1.05])
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve", fontsize=12, fontweight="bold")
    ax.legend(loc="lower right")
    if save_path and fig:
        fig.savefig(save_path, bbox_inches="tight")
    return ax


def full_evaluation(model, feature_names, y_true, y_pred, y_pred_proba, save_dir=None):
    """Jalankan semua evaluasi sekaligus dan simpan gambar jika save_dir diberikan."""
    import os

    print_classification_report(y_true, y_pred)
    compute_roc_auc(y_true, y_pred_proba)

    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    plot_confusion_matrix(y_true, y_pred, ax=axes[0])
    plot_feature_importance(model, feature_names, ax=axes[1])
    plot_roc_curve(y_true, y_pred_proba, ax=axes[2])
    plt.tight_layout()

    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
        fig.savefig(os.path.join(save_dir, "evaluation.png"), bbox_inches="tight")
        print(f"📸 Plot disimpan ke {save_dir}")

    plt.show()
