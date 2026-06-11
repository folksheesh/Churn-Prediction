import nbformat

def add_ohe_lr_cell(notebook_path):
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = nbformat.read(f, as_version=4)

    # find the index of the "## Data Augmentation" cell
    idx_to_insert = len(nb.cells)
    for i, cell in enumerate(nb.cells):
        if cell.cell_type == 'markdown' and 'Data Augmentation (Mock Data)' in cell.source:
            idx_to_insert = i
            break

    source_code = """\
# =============================================================================
# LOGISTIC REGRESSION CHURN PREDICTION (FEEDBACK ONLY - ONE HOT ENCODING)
# =============================================================================

import re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
)

from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

print("=" * 60)
print("LOGISTIC REGRESSION (OHE) CHURN PREDICTION")
print("=" * 60)

# =============================================================================
# LABEL
# =============================================================================

y = (
    pd.to_numeric(df_original["churn"], errors="coerce")
    .fillna(0)
    .astype(int)
    .values
)

# =============================================================================
# FEEDBACK COLUMN
# =============================================================================

fb_col = next(
    (
        c
        for c in df_original.columns
        if c.lower() in [
            "feedback",
            "comment",
            "review",
            "komentar",
            "ulasan",
        ]
    ),
    None,
)

if fb_col is None:
    raise ValueError("Kolom feedback tidak ditemukan!")

# =============================================================================
# CLEAN TEXT
# =============================================================================

def clean_text(t):
    t = str(t).lower()
    t = re.sub(r"\\s+", " ", t).strip()
    return t

X_text = (
    df_original[fb_col]
    .fillna("")
    .apply(clean_text)
    .astype(str)
    .values
)

# =============================================================================
# SPLIT
# =============================================================================

idx = np.arange(len(y))

idx_tr, idx_te, y_tr, y_te = train_test_split(
    idx,
    y,
    test_size=0.30,
    random_state=42,
    stratify=y,
)

# =============================================================================
# ONE HOT ENCODING
# =============================================================================

ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=True)

X_tr = ohe.fit_transform(X_text[idx_tr].reshape(-1, 1))
X_te = ohe.transform(X_text[idx_te].reshape(-1, 1))
X_all = ohe.transform(X_text.reshape(-1, 1))

print(f"Jumlah fitur OHE: {X_tr.shape[1]}")

# =============================================================================
# MODEL
# =============================================================================

model = LogisticRegression(
    max_iter=5000,
    class_weight="balanced",
    C=2.0,
    random_state=42,
)

print("\\nTraining Logistic Regression (OHE)...")
model.fit(X_tr, y_tr)
print("Training selesai!")

# =============================================================================
# PREDIKSI
# =============================================================================

y_prob = model.predict_proba(X_te)[:,1]
threshold = 0.5
y_pred = (y_prob >= threshold).astype(int)

# =============================================================================
# METRICS
# =============================================================================

acc = accuracy_score(y_te, y_pred)
f1 = f1_score(y_te, y_pred, average="weighted")
auc = roc_auc_score(y_te, y_prob)

print("\\n" + "=" * 60)
print("HASIL EVALUASI")
print("=" * 60)

print(f"Accuracy : {acc:.4f}")
print(f"F1-Score : {f1:.4f}")
print(f"ROC-AUC  : {auc:.4f}")

print("\\nClassification Report:\\n")

print(
    classification_report(
        y_te,
        y_pred,
        target_names=["Tidak Churn", "Churn"],
    )
)

# =============================================================================
# CROSS VALIDATION
# =============================================================================

skf = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)

cv_acc = cross_val_score(
    model,
    X_all,
    y,
    cv=skf,
    scoring="accuracy",
    n_jobs=-1,
)

cv_auc = cross_val_score(
    model,
    X_all,
    y,
    cv=skf,
    scoring="roc_auc",
    n_jobs=-1,
)

print(f"\\nCV Accuracy : {cv_acc.mean():.4f}")
print(f"CV ROC-AUC  : {cv_auc.mean():.4f}")

# =============================================================================
# CONFUSION MATRIX
# =============================================================================

cm = confusion_matrix(y_te, y_pred)

plt.figure(figsize=(6,5))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Reds",
    xticklabels=["Tidak Churn", "Churn"],
    yticklabels=["Tidak Churn", "Churn"],
)

plt.title("Confusion Matrix — Logistic Regression (OHE)")
plt.xlabel("Prediksi")
plt.ylabel("Aktual")
plt.tight_layout()
plt.show()"""

    new_cell = nbformat.v4.new_code_cell(source=source_code)
    nb.cells.insert(idx_to_insert, new_cell)

    with open(notebook_path, 'w', encoding='utf-8') as f:
        nbformat.write(nb, f)

if __name__ == '__main__':
    add_ohe_lr_cell('Churn_Prediction.ipynb')
