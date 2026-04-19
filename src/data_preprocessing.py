"""
data_preprocessing.py
=====================
Fungsi preprocessing data yang konsisten antara training dan inference.
"""

import re
import time
import numpy as np
import pandas as pd
from textblob import TextBlob


# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
REFERENCE_DATE = pd.to_datetime("2018-01-01")

COLS_TO_DROP = ["security_no", "referral_id", "last_visit_time"]

NUMERIC_BOUNDS = {
    "days_since_last_login":    {"min": 0,       "max": None},
    "avg_session_duration":     {"min": 0,       "max": 10_000},
    "avg_frequency_login_days": {"min": 0,       "max": 365},
    "points_in_wallet":         {"min": 0,       "max": 1_000_000},
    "session_minutes_90d":      {"min": None,    "max": 130_000},
}


# ─────────────────────────────────────────────────────────────
# ADAPTIVE SENTIMENT ANALYZER (sama persis dengan notebook)
# ─────────────────────────────────────────────────────────────
class AdaptiveSentimentAnalyzer:
    """Hybrid sentiment analyzer (label-aware + keyword + TextBlob)."""

    def __init__(
        self,
        label_weight=0.60,
        phrase_weight=0.25,
        polarity_weight=0.15,
        neutral_band=0.30,
        score_smoothing=0.20,
        use_dynamic_threshold=False,
    ):
        self.label_weight = label_weight
        self.phrase_weight = phrase_weight
        self.polarity_weight = polarity_weight
        self.neutral_band = neutral_band
        self.score_smoothing = score_smoothing
        self.use_dynamic_threshold = use_dynamic_threshold

        self.label_score_map = {
            "poor product quality":   -1.90,
            "poor website":           -1.55,
            "poor customer service":  -1.75,
            "too many ads":           -1.05,
            "no reason specified":     0.00,
            "reasonable price":        0.85,
            "user friendly website":   1.15,
            "products always in stock":1.45,
            "quality customer care":   1.30,
        }

        self.very_positive_phrases = {
            "excellent", "amazing", "fantastic", "outstanding", "perfect",
            "love", "best", "wonderful", "great", "awesome", "superb",
            "highly recommend", "very happy", "very satisfied", "exceeded",
            "brilliant", "exceptional", "delighted", "impressed", "magnificent",
            "5 star", "five star", "loved it", "incredible", "phenomenal",
            "sangat bagus", "bagus sekali", "sangat puas", "puas sekali",
            "luar biasa", "mantap", "keren banget", "top banget", "recommended banget",
        }
        self.positive_phrases = {
            "good", "nice", "happy", "satisfied", "helpful", "friendly",
            "recommend", "pleased", "enjoy", "thanks", "appreciate",
            "fine", "decent", "pleasant", "quick", "easy", "smooth",
            "reliable", "quality", "professional", "efficient",
            "bagus", "oke", "lumayan", "puas", "ramah", "cepat",
            "mudah", "nyaman", "bagus juga", "cukup bagus", "worth it",
        }
        self.negative_phrases = {
            "bad", "poor", "disappointed", "unhappy", "problem", "issue",
            "slow", "difficult", "frustrating", "annoying", "delay",
            "confusing", "expensive", "complicated", "waiting", "annoyed",
            "unsatisfied", "mediocre", "lacking", "subpar",
            "jelek", "kurang bagus", "lama", "ribet", "mahal",
            "kecewa", "tidak puas", "buruk", "error", "lemot", "boros",
        }
        self.very_negative_phrases = {
            "terrible", "horrible", "worst", "awful", "hate", "angry",
            "unacceptable", "never again", "very disappointed", "waste",
            "scam", "fraud", "disgusting", "pathetic", "useless",
            "ridiculous", "incompetent", "nightmare", "disaster", "appalling",
            "1 star", "one star", "refused", "cancel",
            "parah", "buruk sekali", "kecewa banget", "sangat mengecewakan",
            "sampah", "kapok", "tidak rekomendasi", "penipuan", "gak guna",
            "nggak guna", "gak membantu", "gagal total",
        }
        self.intensifiers = {
            "very", "really", "extremely", "super", "highly",
            "sangat", "banget", "sekali", "amat",
        }
        self.negations = {
            "not", "no", "never", "none", "without",
            "tidak", "tak", "gak", "nggak", "bukan", "jangan",
        }
        self.thresholds = {
            "sangat_puas": 1.00,
            "puas":         0.25,
            "biasa":       -0.25,
            "kecewa":      -1.00,
        }

    # ── helpers ────────────────────────────────────────────────
    def normalize_text(self, text):
        text = str(text).lower().strip()
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def count_phrases(self, text_lower):
        very_pos = sum(1 for p in self.very_positive_phrases if p in text_lower)
        pos      = sum(1 for p in self.positive_phrases      if p in text_lower)
        neg      = sum(1 for p in self.negative_phrases      if p in text_lower)
        very_neg = sum(1 for p in self.very_negative_phrases if p in text_lower)
        return very_pos, pos, neg, very_neg

    def detect_intensity(self, text_lower):
        intensity_hits = sum(1 for w in self.intensifiers if w in text_lower)
        negation_hits  = sum(1 for w in self.negations    if w in text_lower)
        return intensity_hits, negation_hits

    def get_label_base_score(self, text_lower):
        if text_lower in self.label_score_map:
            return self.label_score_map[text_lower]
        for label, score in self.label_score_map.items():
            if label in text_lower:
                return score
        return None

    def score_text(self, text):
        if text is None:
            return 0.0, "Biasa", 3, 0.50
        if isinstance(text, float) and np.isnan(text):
            return 0.0, "Biasa", 3, 0.50
        text_str = str(text).strip()
        if text_str == "" or text_str.lower() == "nan":
            return 0.0, "Biasa", 3, 0.50

        text_norm  = self.normalize_text(text_str)
        label_base = self.get_label_base_score(text_norm)

        very_pos, pos, neg, very_neg    = self.count_phrases(text_norm)
        intensity_hits, negation_hits   = self.detect_intensity(text_norm)

        phrase_score = (very_pos * 2.0) + (pos * 1.0) - (neg * 1.0) - (very_neg * 2.0)
        try:
            polarity = TextBlob(text_str).sentiment.polarity
        except Exception:
            polarity = 0.0

        phrase_score += intensity_hits * 0.35
        if negation_hits > 0:
            phrase_score *= 0.80
            polarity     *= 0.80

        if label_base is None:
            label_base = 0.0

        final_score = (
            self.label_weight   * label_base  +
            self.phrase_weight  * phrase_score +
            self.polarity_weight * polarity
        )
        final_score = np.tanh(final_score) * (2.0 - self.score_smoothing)

        if   final_score >= self.thresholds["sangat_puas"]:
            kategori, score = "Sangat Puas", 5
        elif final_score >= self.thresholds["puas"]:
            kategori, score = "Puas", 4
        elif final_score >  self.thresholds["biasa"]:
            kategori, score = "Biasa", 3
        elif final_score >  self.thresholds["kecewa"]:
            kategori, score = "Kecewa", 2
        else:
            kategori, score = "Sangat Kecewa", 1

        confidence = min(0.50 + abs(final_score) * 0.30 + abs(polarity) * 0.15, 1.0)
        return round(final_score, 4), kategori, score, round(confidence, 3)

    def analyze_single(self, text):
        final_score, kategori, score, confidence = self.score_text(text)
        return {
            "kategori":   kategori,
            "score":      score,
            "confidence": confidence,
            "raw_score":  final_score,
        }

    def analyze_batch(self, texts, verbose=True):
        if verbose:
            print(f"🚀 Menganalisis {len(texts)} feedback…")
        start = time.time()
        results = []
        total = len(texts)
        for i, text in enumerate(texts):
            results.append(self.analyze_single(text))
            if verbose and ((i + 1) % 5000 == 0 or (i + 1) == total):
                elapsed = time.time() - start
                pct  = (i + 1) / total * 100
                rate = (i + 1) / elapsed if elapsed > 0 else 0
                eta  = (total - (i + 1)) / rate if rate > 0 else 0
                print(f"   Progress: {i+1}/{total} ({pct:.1f}%) | Speed: {rate:.0f} t/s | ETA: {eta:.0f}s")
        if verbose:
            elapsed_total = time.time() - start
            print(f"\n✅ Selesai! {elapsed_total:.2f}s")
        return results


# ─────────────────────────────────────────────────────────────
# CORE PREPROCESSING PIPELINE
# ─────────────────────────────────────────────────────────────
def preprocess(df: pd.DataFrame, verbose: bool = True) -> pd.DataFrame:
    """
    Jalankan seluruh pipeline preprocessing (cleaning → feature engineering
    → sentiment analysis).  Mengembalikan DataFrame yang siap di-encode.

    Parameters
    ----------
    df : pd.DataFrame
        Raw dataframe (kolom mentah dari churn_data.csv).
    verbose : bool
        Tampilkan progress sentiment analysis.

    Returns
    -------
    pd.DataFrame
        DataFrame yang sudah bersih (belum di-encode kategorikal).
    """
    df = df.copy()

    # 1. Ganti placeholder string dengan NaN
    df.replace({"?": np.nan, "Unknown": np.nan, "Error": np.nan}, inplace=True)

    # 2. Paksa kolom numerik → angka, lalu terapkan batas valid
    cols_numeric = list(NUMERIC_BOUNDS.keys())
    for col in cols_numeric:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col, bounds in NUMERIC_BOUNDS.items():
        if col not in df.columns:
            continue
        lo, hi = bounds["min"], bounds["max"]
        if lo is not None:
            df.loc[df[col] < lo, col] = np.nan
        if hi is not None:
            df.loc[df[col] > hi, col] = np.nan

    # 3. Hapus kolom tidak relevan
    df.drop(columns=COLS_TO_DROP, inplace=True, errors="ignore")

    # 4. Transformasi tanggal → hari sejak joined
    if "joining_date" in df.columns:
        df["joining_date"] = pd.to_datetime(
            df["joining_date"], format="%d-%m-%Y", errors="coerce"
        )
        df["days_since_joined"] = (REFERENCE_DATE - df["joining_date"]).dt.days
        df.drop("joining_date", axis=1, inplace=True)

    # 5. Simpan feedback untuk NLP sebelum imputasi
    feedback_series = df["feedback"].fillna("").astype(str).copy() if "feedback" in df.columns else None

    # 6. Imputasi missing values
    num_cols = df.select_dtypes(include=["float64", "int64"]).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())

    cat_cols = df.select_dtypes(include=["object"]).columns
    for col in cat_cols:
        if col != "feedback":
            df[col] = df[col].fillna(df[col].mode()[0])

    # 7. Sentiment analysis
    if feedback_series is not None:
        analyzer = AdaptiveSentimentAnalyzer()
        results = analyzer.analyze_batch(feedback_series.tolist(), verbose=verbose)
        df["sentiment_kategori"]  = [r["kategori"]   for r in results]
        df["sentiment_score"]     = [r["score"]       for r in results]
        df["sentiment_confidence"]= [r["confidence"]  for r in results]
        df["sentiment_raw_score"] = [r["raw_score"]   for r in results]
        df.drop("feedback", axis=1, inplace=True, errors="ignore")

    return df
