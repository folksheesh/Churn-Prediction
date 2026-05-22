# 📊 ChurnSight - Predictive Customer Analytics

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![XGBoost](https://img.shields.io/badge/XGBoost-Machine%20Learning-orange.svg)

**ChurnSight** adalah proyek machine learning *end-to-end* yang dirancang untuk memprediksi probabilitas *churn* pelanggan (berhenti berlangganan/menggunakan layanan). Proyek ini menggabungkan pemodelan prediktif **XGBoost**, analisis sentimen adaptif berbasis NLP, dan dilengkapi dengan **Dashboard SaaS Profesional**.

---

## ✨ Fitur Utama

- **End-to-End ML Pipeline**: Arsitektur modular yang rapi mulai dari data cleaning, feature engineering, NLP sentiment analysis, hingga model training.
- **Adaptive Sentiment Analysis**: Menggunakan pendekatan hybrid (label, keywords, dan TextBlob) untuk menganalisis sentimen *feedback* pelanggan secara akurat.
- **SaaS-Style Dashboard**: Dashboard interaktif yang bersih dan modern (SaaS CRM Light Theme) untuk memantau performa model, menganalisis profil pelanggan, dan melakukan prediksi.
- **Interactive Predictions**: Prediksi *real-time* untuk pelanggan individual melalui form, atau *batch prediction* dengan mengunggah dataset CSV.

---

## 🚀 Panduan Instalasi

### 1. Clone Repository & Setup Environment
```bash
# (Opsional) Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
source venv/bin/activate  # Untuk Linux/Mac
venv\Scripts\activate     # Untuk Windows
```

### 2. Install Dependencies
Pastikan Python 3.8+ sudah terinstall.
```bash
pip install -r requirements.txt
```

---

## 💻 Cara Menggunakan

### 1. Melatih Model (Training Pipeline)
Sebelum menjalankan dashboard, Anda **wajib** menjalankan script *training* untuk membersihkan data, melatih algoritma, dan menghasilkan file artefak model (`.pkl`) di folder `models/`.

Pastikan data mentah Anda berada di `data/raw/churn_data.csv`.

```bash
python src/train_model.py
```
*Tunggu hingga proses selesai dan muncul konfirmasi bahwa artefak telah tersimpan.*

### 2. Menjalankan Dashboard
Setelah model berhasil dilatih, Anda dapat menjalankan backend dan frontend (React/Vite).
```bash
# Jalankan backend FastAPI
cd backend
uvicorn app.main:app --reload

# Di terminal lain, jalankan frontend
cd frontend
npm run dev
```

---

## 📁 Struktur Proyek

```text
churn_project/
├── data/
│   ├── raw/                   # Data mentah asli (churn_data.csv)
│   └── processed/             # Data bersih hasil pipeline
├── models/                    # Tempat menyimpan file artefak model (.pkl)
├── notebooks/
│   └── Churn_Prediction.ipynb # Jupyter notebook (Eksplorasi & Prototyping)
├── src/
│   ├── data_preprocessing.py  # Pipeline untuk data cleaning & NLP
│   ├── feature_engineering.py # Pipeline untuk label encoding & scaling
│   ├── train_model.py         # Script eksekusi training XGBoost
│   ├── evaluate_model.py      # Fungsi evaluasi metrik (ROC, Confusion Matrix)
│   ├── predict.py             # Modul inferensi prediksi
│   └── utils.py               # Utilities (save/load artifacts)
├── requirements.txt           # Daftar dependensi library
└── README.md                  # Dokumentasi GitHub
```

---

## 📌 Sekilas Tentang Dataset

- **Target Prediksi**: `churn` (0 = Retained, 1 = Churned)
- **Karakteristik Fitur**: Mencakup data demografis, perilaku login, metrik transaksi (API calls, active days), dan text *feedback* pelanggan.
- **Metrik Evaluasi Utama**: ROC-AUC Score, Recall, dan Precision.

---

## 🛠 Teknologi yang Digunakan

- **Data Processing**: `pandas`, `numpy`
- **Machine Learning**: `scikit-learn`, `xgboost`
- **NLP / Text Analysis**: `textblob`, HuggingFace `transformers`
- **Data Visualization**: `matplotlib`, `seaborn`
- **Web App / Dashboard**: `React`, `FastAPI`
- **Serialization**: `joblib`