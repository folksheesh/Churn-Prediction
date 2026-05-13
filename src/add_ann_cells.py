"""
add_ann_cells.py
Run this once: python add_ann_cells.py
It appends Cell 14 (ANN Training) and Cell 15 (ANN Evaluation + Comparison)
into Churn_Prediction.ipynb.
"""

import json, pathlib, sys

NOTEBOOK_PATH = pathlib.Path(__file__).parent / "notebooks" / "Churn_Prediction.ipynb"

# ────────────────────────────────────────────────────────────────
# CELL 14 – ANN Training
# ────────────────────────────────────────────────────────────────
CELL_14_SOURCE = """\
# =============================================================================
# CELL 14: ARTIFICIAL NEURAL NETWORK (ANN) - TRAINING
# =============================================================================
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

print("=" * 60)
print("🧠 CELL 14: TRAINING ARTIFICIAL NEURAL NETWORK (ANN)")
print("=" * 60)

# ── 1. Konversi data ke PyTorch Tensor ─────────────────────────
X_train_t = torch.FloatTensor(X_train_scaled)
y_train_t = torch.FloatTensor(y_train.values).unsqueeze(1)
X_test_t  = torch.FloatTensor(X_test_scaled)
y_test_t  = torch.FloatTensor(y_test.values).unsqueeze(1)

train_ds = TensorDataset(X_train_t, y_train_t)
train_dl = DataLoader(train_ds, batch_size=256, shuffle=True)

input_dim = X_train_scaled.shape[1]
print(f"\\n📐 Jumlah fitur input  : {input_dim}")
print(f"📦 Jumlah data train   : {X_train_scaled.shape[0]}")
print(f"📦 Jumlah data test    : {X_test_scaled.shape[0]}")

# ── 2. Arsitektur ANN (output = logits, tanpa Sigmoid) ────────
class ChurnANNLogits(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),

            nn.Linear(64, 32),
            nn.ReLU(),

            nn.Linear(32, 1)   # logits – Sigmoid dihandle BCEWithLogitsLoss
        )

    def forward(self, x):
        return self.network(x)

device    = torch.device('cpu')
ann_model = ChurnANNLogits(input_dim).to(device)

print("\\n🏗️  Arsitektur ANN:")
print(ann_model)

# ── 3. Loss function & optimizer ──────────────────────────────
n_neg      = (y_train == 0).sum()
n_pos      = (y_train == 1).sum()
pos_weight = torch.tensor([n_neg / n_pos], dtype=torch.float32)
print(f"\\n⚖️  Class ratio (neg/pos) : {pos_weight.item():.2f}")

criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
optimizer = optim.Adam(ann_model.parameters(), lr=0.001, weight_decay=1e-4)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

# ── 4. Training loop ──────────────────────────────────────────
EPOCHS       = 30
history_loss = []

print(f"\\n🚀 Mulai training selama {EPOCHS} epoch...\\n")
ann_model.train()
for epoch in range(EPOCHS):
    epoch_loss = 0.0
    for X_batch, y_batch in train_dl:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        logits = ann_model(X_batch)
        loss   = criterion(logits, y_batch)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item() * X_batch.size(0)
    scheduler.step()
    avg_loss = epoch_loss / len(train_ds)
    history_loss.append(avg_loss)
    if (epoch + 1) % 5 == 0:
        print(f"   Epoch [{epoch+1:02d}/{EPOCHS}] | Loss: {avg_loss:.4f}")

print("\\n✅ Training ANN selesai!")

# ── 5. Plot training loss ──────────────────────────────────────
import matplotlib.pyplot as plt
plt.figure(figsize=(8, 4))
plt.plot(range(1, EPOCHS+1), history_loss, marker='o', color='steelblue', linewidth=2)
plt.title('Training Loss ANN per Epoch', fontweight='bold')
plt.xlabel('Epoch')
plt.ylabel('BCE Loss (with Logits)')
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.show()
print("\\n💡 Grafik menunjukkan konvergensi loss ANN selama training.")
"""

# ────────────────────────────────────────────────────────────────
# CELL 15 – ANN Evaluation + Model Comparison Dashboard
# ────────────────────────────────────────────────────────────────
CELL_15_SOURCE = """\
# =============================================================================
# CELL 15: EVALUASI ANN + PERBANDINGAN SEMUA MODEL
# =============================================================================
import torch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from sklearn.metrics import (
    classification_report, roc_auc_score,
    confusion_matrix, accuracy_score, f1_score, roc_curve
)

print("=" * 60)
print("📊 CELL 15: EVALUASI ANN & PERBANDINGAN SEMUA MODEL")
print("=" * 60)

# ── 1. Prediksi ANN pada data test ────────────────────────────
ann_model.eval()
with torch.no_grad():
    logits_test = ann_model(X_test_t.to(device))
    proba_ann   = torch.sigmoid(logits_test).cpu().numpy().flatten()
    pred_ann    = (proba_ann >= 0.5).astype(int)

# ── 2. Metrik ANN ─────────────────────────────────────────────
acc_ann  = accuracy_score(y_test, pred_ann)
f1_ann   = f1_score(y_test, pred_ann)
auc_ann  = roc_auc_score(y_test, proba_ann)
cm_ann   = confusion_matrix(y_test, pred_ann)

tn_a, fp_a, fn_a, tp_a = cm_ann.ravel()
sensitivity_ann = tp_a / (tp_a + fn_a)
specificity_ann = tn_a / (tn_a + fp_a)

print("\\n📋 Classification Report — ANN (PyTorch):")
print(classification_report(y_test, pred_ann, target_names=['Tidak Churn', 'Churn']))
print(f"AUC-ROC       : {auc_ann:.4f}")
print(f"Sensitivity   : {sensitivity_ann:.4f} ({sensitivity_ann*100:.1f}%)")
print(f"Specificity   : {specificity_ann:.4f} ({specificity_ann*100:.1f}%)")

# ── 3. Kumpulkan metrik semua model ───────────────────────────
# XGBoost
proba_xgb = xgb_model.predict_proba(X_test_scaled)[:, 1]
pred_xgb  = (proba_xgb >= 0.5).astype(int)
acc_xgb   = accuracy_score(y_test, pred_xgb)
f1_xgb    = f1_score(y_test, pred_xgb)
auc_xgb   = roc_auc_score(y_test, proba_xgb)
cm_xgb_ev = confusion_matrix(y_test, pred_xgb)

# Logistic Regression
proba_lr  = lr_model.predict_proba(X_test_scaled)[:, 1]
pred_lr   = lr_model.predict(X_test_scaled)
acc_lr    = accuracy_score(y_test, pred_lr)
f1_lr     = f1_score(y_test, pred_lr)
auc_lr    = roc_auc_score(y_test, proba_lr)
cm_lr_ev  = confusion_matrix(y_test, pred_lr)

# Random Forest
proba_rf  = rf_model.predict_proba(X_test_scaled)[:, 1]
pred_rf   = rf_model.predict(X_test_scaled)
acc_rf    = accuracy_score(y_test, pred_rf)
f1_rf     = f1_score(y_test, pred_rf)
auc_rf    = roc_auc_score(y_test, proba_rf)
cm_rf_ev  = confusion_matrix(y_test, pred_rf)

# ── 4. Tabel Ringkasan ────────────────────────────────────────
comparison_data = {
    'Model':     ['XGBoost', 'Random Forest', 'Logistic Regression', 'ANN (PyTorch)'],
    'Accuracy':  [acc_xgb, acc_rf, acc_lr, acc_ann],
    'F1-Score':  [f1_xgb,  f1_rf,  f1_lr,  f1_ann],
    'AUC-ROC':   [auc_xgb, auc_rf, auc_lr, auc_ann],
}
df_cmp = pd.DataFrame(comparison_data).set_index('Model')
df_cmp = df_cmp.sort_values('AUC-ROC', ascending=False)

print("\\n" + "=" * 60)
print("🏆 TABEL PERBANDINGAN SEMUA MODEL")
print("=" * 60)
print(df_cmp.to_string(float_format=lambda x: f"{x:.4f}"))

best_model = df_cmp['AUC-ROC'].idxmax()
print(f"\\n🥇 Model terbaik (AUC-ROC): {best_model} — {df_cmp.loc[best_model, 'AUC-ROC']:.4f}")

# ── 5. Dashboard Visualisasi ──────────────────────────────────
MODELS   = ['XGBoost', 'Random Forest', 'Logistic\\nRegression', 'ANN\\n(PyTorch)']
ACC_VALS = [acc_xgb, acc_rf, acc_lr, acc_ann]
F1_VALS  = [f1_xgb,  f1_rf,  f1_lr,  f1_ann]
AUC_VALS = [auc_xgb, auc_rf, auc_lr, auc_ann]
COLORS   = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0']

fig = plt.figure(figsize=(20, 16))
fig.suptitle('📊 Dashboard Perbandingan Model — Churn Prediction',
             fontsize=16, fontweight='bold', y=0.98)
gs = gridspec.GridSpec(3, 4, figure=fig, hspace=0.55, wspace=0.45)

# 5a. Bar — Accuracy
ax1 = fig.add_subplot(gs[0, 0:2])
bars1 = ax1.bar(MODELS, ACC_VALS, color=COLORS, edgecolor='white', linewidth=0.8)
ax1.set_title('Accuracy Comparison', fontweight='bold')
ax1.set_ylim(0, 1.15)
ax1.set_ylabel('Accuracy')
for bar, v in zip(bars1, ACC_VALS):
    ax1.text(bar.get_x() + bar.get_width()/2, v + 0.01,
             f'{v:.3f}', ha='center', va='bottom', fontsize=9, fontweight='bold')

# 5b. Bar — F1-Score
ax2 = fig.add_subplot(gs[0, 2:4])
bars2 = ax2.bar(MODELS, F1_VALS, color=COLORS, edgecolor='white', linewidth=0.8)
ax2.set_title('F1-Score Comparison', fontweight='bold')
ax2.set_ylim(0, 1.15)
ax2.set_ylabel('F1-Score')
for bar, v in zip(bars2, F1_VALS):
    ax2.text(bar.get_x() + bar.get_width()/2, v + 0.01,
             f'{v:.3f}', ha='center', va='bottom', fontsize=9, fontweight='bold')

# 5c. ROC Curves
ax3 = fig.add_subplot(gs[1, 0:2])
for proba, label, color in [
    (proba_xgb, f'XGBoost (AUC={auc_xgb:.3f})',         '#2196F3'),
    (proba_rf,  f'Random Forest (AUC={auc_rf:.3f})',     '#4CAF50'),
    (proba_lr,  f'Logistic Reg. (AUC={auc_lr:.3f})',     '#FF9800'),
    (proba_ann, f'ANN PyTorch (AUC={auc_ann:.3f})',      '#9C27B0'),
]:
    fpr, tpr, _ = roc_curve(y_test, proba)
    ax3.plot(fpr, tpr, label=label, linewidth=2, color=color)
ax3.plot([0,1],[0,1], 'k--', linewidth=1, alpha=0.6)
ax3.set_title('ROC Curve — Semua Model', fontweight='bold')
ax3.set_xlabel('False Positive Rate')
ax3.set_ylabel('True Positive Rate')
ax3.legend(fontsize=8, loc='lower right')
ax3.grid(True, linestyle='--', alpha=0.4)

# 5d. AUC-ROC Horizontal Bar
ax4 = fig.add_subplot(gs[1, 2:4])
bars4 = ax4.barh(MODELS[::-1], AUC_VALS[::-1],
                 color=COLORS[::-1], edgecolor='white', linewidth=0.8)
ax4.set_title('AUC-ROC Comparison', fontweight='bold')
ax4.set_xlim(0, 1.15)
ax4.set_xlabel('AUC-ROC')
for bar, v in zip(bars4, AUC_VALS[::-1]):
    ax4.text(v + 0.005, bar.get_y() + bar.get_height()/2,
             f'{v:.4f}', ha='left', va='center', fontsize=9, fontweight='bold')

# 5e. Confusion Matrices — 4 model
cms_all   = [cm_xgb_ev, cm_rf_ev, cm_lr_ev, cm_ann]
clbls_all = ['XGBoost', 'Random Forest', 'Logistic Reg.', 'ANN (PyTorch)']
cmaps_all = ['Blues', 'Greens', 'Oranges', 'Purples']

for i, (cm_i, lbl, cmap) in enumerate(zip(cms_all, clbls_all, cmaps_all)):
    ax = fig.add_subplot(gs[2, i])
    sns.heatmap(cm_i, annot=True, fmt='d', cmap=cmap, ax=ax,
                xticklabels=['No Churn', 'Churn'],
                yticklabels=['No Churn', 'Churn'],
                linewidths=0.5, linecolor='white')
    ax.set_title(f'Confusion Matrix\\n{lbl}', fontweight='bold', fontsize=9)
    ax.set_xlabel('Predicted', fontsize=8)
    ax.set_ylabel('Actual', fontsize=8)
    ax.tick_params(axis='both', labelsize=7)

plt.savefig('../reports/model_comparison_dashboard.png', dpi=150,
            bbox_inches='tight')
plt.show()

print("\\n✅ Dashboard perbandingan model selesai!")
print("💾 Grafik disimpan ke '../reports/model_comparison_dashboard.png'")

# ── 6. Insight Ringkas ────────────────────────────────────────
print("\\n" + "=" * 60)
print("💡 INSIGHT PERBANDINGAN")
print("=" * 60)
for idx, row in df_cmp.iterrows():
    rank = list(df_cmp.index).index(idx) + 1
    print(f"  #{rank} {idx:<22} | Acc={row['Accuracy']:.4f} | F1={row['F1-Score']:.4f} | AUC={row['AUC-ROC']:.4f}")
print()
print("  🔑 ANN (PyTorch) digunakan sebagai DEEP LEARNING baseline.")
print("  📌 Model tree-based (XGBoost/RF) umumnya lebih cepat & sering")
print("     mengungguli ANN pada data tabular berukuran sedang.")
print("  📌 ANN dapat ditingkatkan dengan: lebih banyak epoch,")
print("     hyperparameter tuning, atau arsitektur yang lebih dalam.")
"""


def make_cell(source_str: str) -> dict:
    """Convert a raw source string into a Jupyter code-cell dict."""
    lines = source_str.split("\n")
    # Keep newline chars as Jupyter expects
    source_lines = [line + "\n" for line in lines[:-1]] + [lines[-1]]
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source_lines,
    }


def main():
    if not NOTEBOOK_PATH.exists():
        print(f"[ERROR] Notebook not found: {NOTEBOOK_PATH}")
        sys.exit(1)

    with open(NOTEBOOK_PATH, "r", encoding="utf-8") as f:
        nb = json.load(f)

    # Guard: don't add cells twice
    existing_sources = [
        "".join(c.get("source", []))
        for c in nb["cells"]
        if c.get("cell_type") == "code"
    ]
    if any("CELL 14" in s for s in existing_sources):
        print("⚠️  Cell 14 sudah ada di notebook. Script dibatalkan.")
        sys.exit(0)

    nb["cells"].append(make_cell(CELL_14_SOURCE))
    nb["cells"].append(make_cell(CELL_15_SOURCE))

    with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)

    print(f"✅ Berhasil menambahkan Cell 14 & Cell 15 ke:\n   {NOTEBOOK_PATH}")


if __name__ == "__main__":
    main()
