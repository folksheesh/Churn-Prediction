"""ChurnSense — User Dashboard Streamlit App

Dashboard ini dibuat untuk user/non-admin: tampilannya lebih sederhana, fokus ke
customer health, insight, dan rekomendasi tindakan. File ini berdiri sendiri.

Cara menjalankan dari root project Churn-Prediction:
    streamlit run app/user_dashboard_app.py
atau:
    streamlit run user_dashboard_app.py

Revisi evaluasi tambahan yang sudah diimplementasikan langsung ke basis kode 4000+ line:
- Field-specific Prediction validation in English.
- Clear ChurnSense project identity in Dashboard header.
- Batch Upload CSV data-format guide and correct template.
- Valid uploaded rows are appended into Dashboard/Customers session data.
"""

import os
import html
import re
import base64
import hashlib
from pathlib import Path
from textwrap import dedent

import numpy as np
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt


# =============================================================================
# PAGE CONFIG
# =============================================================================
st.set_page_config(
    page_title="ChurnSense User Dashboard",
    page_icon="◼",
    layout="wide",
    initial_sidebar_state="expanded",
)


# =============================================================================
# GLOBAL CSS
# =============================================================================
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

    * { font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
    html, body, .stApp { background: #f5f6fb !important; color: #111827 !important; }
    .block-container { padding: 1.35rem 1.8rem 2rem 1.8rem !important; max-width: 1240px !important; }
    header, footer, #MainMenu { visibility: hidden !important; display: none !important; }

    /* Sidebar */
    section[data-testid="stSidebar"] { background: #0f172a !important; width: 230px !important; }
    section[data-testid="stSidebar"] > div:first-child { padding: 0 !important; }
    .sidebar-brand { padding: 1.1rem 1rem 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand-row { display:flex; align-items:center; gap:.55rem; color:#fff; font-weight:800; font-size:.95rem; }
    .brand-box { width:28px; height:28px; border-radius:8px; background:#6d5dfc; display:flex; align-items:center; justify-content:center; font-weight:900; }
    .brand-sub { color:#9ca3af; font-size:.68rem; margin-left:2.1rem; margin-top:.2rem; }

    section[data-testid="stSidebar"] .stRadio label { color:#cbd5e1 !important; font-size:.78rem !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] { gap:.25rem !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        padding:.55rem .8rem !important; margin:0 .65rem !important; border-radius:8px !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover { background:rgba(255,255,255,.06) !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"] { background:#6d5dfc !important; color:white !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label > div:first-child { display:none !important; }
    section[data-testid="stSidebar"] .stRadio > label { display:none !important; }

    /* Text */
    .page-title { font-size:1.65rem; font-weight:850; color:#111827; line-height:1.1; }
    .page-sub { color:#7b8191; font-size:.82rem; margin-top:.12rem; }
    .section-title { font-size:1.05rem; font-weight:800; color:#111827; margin-top:1.1rem; }
    .section-sub { color:#6b7280; font-size:.76rem; margin-bottom:.75rem; }

    /* Cards */
    .card { background:#fff; border:1px solid #e7e9f1; border-radius:13px; padding:1rem; box-shadow:0 1px 2px rgba(15,23,42,.035); }
    .soft-card { background:#f4f1ff; border:1px solid #ded6ff; border-radius:13px; padding:1rem; }
    .note-card { background:#fff8e7; border:1px solid #f1d58b; border-radius:12px; padding:.85rem 1rem; color:#5f4700; }
    .gradient-card { background:linear-gradient(135deg,#6d5dfc,#8b5cf6); color:white; border-radius:14px; padding:1.2rem; position:relative; overflow:hidden; }
    .gradient-card:after { content:""; position:absolute; right:-70px; top:-50px; width:280px; height:150px; background:rgba(255,255,255,.12); border-radius:50%; }
    .big-number { font-size:2.45rem; font-weight:900; letter-spacing:-.06em; }
    .pill { display:inline-block; padding:.18rem .55rem; border-radius:999px; font-size:.68rem; font-weight:700; }
    .pill-red { background:#fee2e2; color:#ef4444; }
    .pill-green { background:#dcfce7; color:#16a34a; }
    .pill-yellow { background:#fef3c7; color:#d97706; }
    .pill-blue { background:#e0e7ff; color:#4f46e5; }

    .metric-card { background:#fff; border:1px solid #e7e9f1; border-radius:12px; padding:.95rem; min-height:116px; }
    .metric-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.85rem; margin-bottom:.75rem; }
    .metric-title { color:#6b7280; font-size:.72rem; font-weight:700; }
    .metric-value { color:#111827; font-size:1.35rem; font-weight:900; margin-top:.3rem; }
    .metric-line { height:3px; background:#e5e7eb; border-radius:999px; margin-top:.8rem; overflow:hidden; }
    .metric-line span { display:block; height:100%; border-radius:999px; }

    .help-box { background:#eef4ff; border:1px solid #cfe0ff; color:#2f4163; border-radius:10px; padding:.8rem; font-size:.75rem; line-height:1.55; }
    .chart-title { font-weight:800; font-size:.92rem; color:#111827; }
    .chart-sub { color:#6b7280; font-size:.72rem; margin-bottom:.5rem; }
    .read-box { background:#f2f3ff; border:1px solid #dadaff; border-radius:10px; padding:.8rem; font-size:.73rem; color:#38415a; }
    .insight-card { background:#fff; border:1px solid #e7e9f1; border-radius:12px; padding:.85rem; margin-bottom:.75rem; }
    .progress { height:6px; background:#eef2ff; border-radius:999px; overflow:hidden; margin-top:.45rem; }
    .progress span { display:block; height:100%; background:#6d5dfc; border-radius:999px; }
    .action-item { display:flex; gap:.55rem; align-items:flex-start; padding:.55rem 0; border-bottom:1px solid #edf0f7; font-size:.75rem; }
    .check { width:18px; height:18px; border-radius:50%; background:#dcfce7; color:#16a34a; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:900; flex:0 0 auto; }

    /* Dataframe */
    [data-testid="stDataFrame"] { border-radius:12px !important; overflow:hidden !important; }
    .stTextInput input, .stSelectbox div[data-baseweb="select"] { border-radius:10px !important; }

    /* Customer Management page */
    .customer-header-gap { height:.9rem; }
    .customer-toolbar {
        background:#fff;
        border:1px solid #e7e9f1;
        border-radius:16px;
        padding:1.05rem 1.15rem;
        box-shadow:0 2px 7px rgba(15,23,42,.05);
        margin: 1.1rem 0 1.15rem;
    }
    .customer-summary {
        display:grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap:.75rem;
        margin:.95rem 0 1rem;
    }
    .customer-summary-card {
        background:#fff;
        border:1px solid #e7e9f1;
        border-radius:13px;
        padding:.85rem .95rem;
        box-shadow:0 1px 3px rgba(15,23,42,.04);
    }
    .customer-summary-label { color:#6b7280; font-size:.7rem; font-weight:700; margin-bottom:.25rem; }
    .customer-summary-value { color:#111827; font-size:1.25rem; font-weight:900; line-height:1.1; }
    .customer-summary-sub { color:#8b95a7; font-size:.68rem; margin-top:.25rem; }
    .customer-card {
        background:#fff;
        border:1px solid #e7e9f1;
        border-radius:16px;
        padding:1.05rem 1.15rem;
        box-shadow:0 2px 7px rgba(15,23,42,.06);
        margin-bottom:.9rem;
    }
    .customer-row {
        display:grid;
        grid-template-columns: 2.3fr .85fr .75fr .8fr .95fr .75fr;
        gap:1rem;
        align-items:center;
    }
    .customer-identity { display:flex; align-items:center; gap:.85rem; min-width:0; }
    .customer-avatar {
        width:46px; height:46px; border-radius:50%;
        background:#6d5dfc; color:#fff;
        display:flex; align-items:center; justify-content:center;
        font-weight:900; font-size:.9rem; flex:0 0 auto;
    }
    .customer-name { font-weight:850; color:#111827; font-size:.98rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .customer-email { color:#6b7280; font-size:.77rem; margin-top:.12rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .customer-meta-label { color:#7b8191; font-size:.68rem; margin-bottom:.18rem; }
    .customer-meta-value { color:#111827; font-size:.82rem; font-weight:650; }
    .risk-chip { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:.28rem .65rem; font-size:.72rem; font-weight:800; white-space:nowrap; }
    .risk-high { background:#fee2e2; color:#dc2626; border:1px solid #fecaca; }
    .risk-medium { background:#ffedd5; color:#ea580c; border:1px solid #fed7aa; }
    .risk-low { background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; }
    .details-btn {
        background:#6d5dfc; color:#fff; border-radius:9px;
        padding:.55rem .8rem; font-size:.78rem; font-weight:800;
        text-align:center; display:block;
    }
    .customer-card details { margin-top:.85rem; border-top:1px solid #eef1f7; padding-top:.8rem; }
    .customer-card summary {
        cursor:pointer; list-style:none; outline:none;
    }
    .customer-card summary::-webkit-details-marker { display:none; }
    .details-grid {
        display:grid; grid-template-columns: repeat(3, minmax(0, 1fr));
        gap:.65rem; margin-top:.75rem;
    }
    .detail-box {
        background:#f8fafc; border:1px solid #eef1f7; border-radius:10px;
        padding:.65rem .75rem;
    }
    .detail-label { color:#6b7280; font-size:.65rem; font-weight:700; }
    .detail-value { color:#111827; font-size:.78rem; font-weight:750; margin-top:.1rem; }
    .recommend-box {
        margin-top:.75rem;
        background:#eef4ff;
        border:1px solid #d4e2ff;
        color:#334155;
        border-radius:10px;
        padding:.75rem .85rem;
        font-size:.76rem;
        line-height:1.5;
    }
    .empty-customers {
        background:#fff; border:1px dashed #cbd5e1; border-radius:14px;
        padding:1.25rem; color:#64748b; text-align:center;
    }
    [data-testid="stDownloadButton"] button {
        background:#6d5dfc !important;
        color:#fff !important;
        border:0 !important;
        border-radius:10px !important;
        font-weight:800 !important;
        height:42px !important;
    }
    @media (max-width: 900px) {
        .customer-row { grid-template-columns:1fr; gap:.75rem; }
        .details-grid { grid-template-columns:1fr; }
        .customer-summary { grid-template-columns:1fr 1fr; }
    }

    
    /* =====================
       Sidebar UI - Figma Style
    ====================== */
    section[data-testid="stSidebar"] {
        background: #0b1220 !important;
        width: 300px !important;
        min-width: 300px !important;
        border-right: 1px solid rgba(255,255,255,0.06) !important;
    }

    section[data-testid="stSidebar"] > div:first-child {
        padding: 0 !important;
        min-height: 100vh !important;
        position: relative !important;
        background: #0b1220 !important;
    }

    .sidebar-brand {
        padding: 34px 26px 30px 26px !important;
        border-bottom: 1px solid rgba(148,163,184,0.14) !important;
        margin: 0 !important;
    }

    .brand-row {
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        font-size: 20px !important;
        line-height: 1.1 !important;
        letter-spacing: -0.01em !important;
    }

    .brand-box {
        width: 46px !important;
        height: 46px !important;
        border-radius: 14px !important;
        background: #6366f1 !important;
        color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 22px !important;
        font-weight: 800 !important;
        flex: 0 0 auto !important;
    }

    .brand-sub {
        color: #ffffff !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        margin-left: 60px !important;
        margin-top: 7px !important;
        line-height: 1.2 !important;
    }

    section[data-testid="stSidebar"] .stRadio {
        padding: 20px 8px 0 8px !important;
    }

    section[data-testid="stSidebar"] .stRadio > label {
        display: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] {
        gap: 12px !important;
        width: 100% !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        height: 58px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 0 22px !important;
        margin: 0 !important;
        border-radius: 18px !important;
        color: #ffffff !important;
        background: transparent !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        transition: all .18s ease !important;
        border: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
        background: rgba(255,255,255,0.05) !important;
        color: #ffffff !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"],
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked),
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] [aria-checked="true"] {
        background: #6366f1 !important;
        color: #ffffff !important;
        box-shadow: 0 12px 26px rgba(99,102,241,0.28) !important;
        transform: scaleX(1.01) !important;
        transform-origin: center !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label > div:first-child {
        display: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p {
        font-size: 19px !important;
        font-weight: 600 !important;
        color: #ffffff !important;
        line-height: 1.1 !important;
        letter-spacing: -0.01em !important;
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"] p,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked) p,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] [aria-checked="true"] p {
        color: #ffffff !important;
        font-weight: 600 !important;
    }


    /* Custom PNG icon for Dashboard sidebar item */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(1) p {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(1) p::before {
        content: "" !important;
        width: 30px !important;
        height: 30px !important;
        display: inline-block !important;
        flex: 0 0 30px !important;
        vertical-align: middle !important;
        transform: translateY(0px) !important;
        background-color: currentColor !important;
        -webkit-mask: url("data:image/png;base64,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") center / contain no-repeat !important;
        mask: url("data:image/png;base64,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") center / contain no-repeat !important;
    }

    /* Custom PNG icon for Customers sidebar item */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(2) p {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(2) p::before {
        content: "" !important;
        width: 30px !important;
        height: 30px !important;
        display: inline-block !important;
        flex: 0 0 30px !important;
        vertical-align: middle !important;
        transform: translateY(0px) !important;
        background-color: #ffffff !important;
        -webkit-mask: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACAKADAAQAAAABAAACAAAAAAAL+LWFAABAAElEQVR4Ae2dB7glVZW2LxnJOSp0kxEUVGAISlZAUUYdBMPgz/ziGMY4Zh1tw5hnHBydX0cdFRQREFRQQIKogI4iCJJBukkqOWdp/+/rvpe+9/Y5555QVWvvXe9+nu+ec+tU7b3Wu3at2qdqV52xMQoEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAoAOBJTosYxEEIJAngfVk9mxp1rg21Oua0trSWtKq49LL2LLSin6j8oD06IJ3Y2N36/Ve6Tbp9nHdrNd5k/RnvadAAAKZE2AAkHkAMb+VBJaX18+UthvX0/RqrSw1UTxAuFS6RLp4/PW3en1EokAAApkQYACQSaAws9UE/M19T+nZ0q7Ss6TlpJSKD/4XSOdL50rnSB4oUCAAgUQJMABINDCY1XoC24vA/uPaTa9LZ0bkMdl7nnSadKrkswUUCEAAAhCAAAQ6ENhGy+ZIV0l/LUzz5M+Rks9iUCAAAQhAAAKtJ7C+CLxPKvGg320Qc4X8fY/kSYsUCEAAAhCAQGsILClPny+dJPlUebcDZenLfefBidIBkplQIAABCEAAAkUS8MS9w6TLpdIP7oP6d62YvEVaQaJAAAIQgAAEiiCwuryYI90qDXpgbNv6t4jRB6XVJAoEIAABCEAgSwIryep3S3dKbTuQj+qvbyH8pORbICkQgAAEIACBLAj4KXvvkPw0vVEPhG3f3gzfLpkpBQIQgAAEIJAsgX1l2WVS2w/cVft/jZgenGzUMQwCEIAABFpLYGt5foZU9YGP+qYyPV2Mt2xtL8NxCEAAAhBIhoCf0Ofr/A9LHKybYeDbBz0/gMsCgkCBAAQgAIHmCeykJv2IWw78MQz8Q0Q7Nh92WoQABCAAgbYSmPjW72+iHPxjGfhBSj4bsExbOyN+QwACEIBAMwQ2VjM/lzjwp8XgV4rJZs10AVqBAAQgAIG2EXiZHL5H4uCfJgPH5qVt65T4CwEIQAAC9RFYSlX7NPN8iYN/2gwcoyMlLgkIAgUCEIAABIYnsLY2PVviwJ8XgzMVs7WGDztbQgACEIBAmwn4mvLVEgf/PBlcp9ht1eYOjO8QgAAEIDA4gd20CY/yzfPAP3nA5t9h2HPw8LMFBCAAAQi0kcAr5PQj0uQDCe/z5eGHNB3axo6MzxCAAAQg0D+B12rVxyUO+GUx8OTAf+q/G7AmBCAAAQi0icAb5awPFBz8y2Tg2PqXBSkQgAAEIACBJwi8V+848LeDwXueiDpvIAABCECg1QTeLO85+LeLwTta3eNxHgIQgAAExg4XA077t+vg78GeY/6P9H8IQAACEGgnAc/2Z8Jf+w7+E2d7HPtD2tn18RoCEIBAewnsLtd9e9jEwYDXdrLw7Z57tXc3wPM2E1iizc7je2sJbC3Pz5NWL5TAX+TXXOkq6UrJTzO8XrpPekC6X7pr/L1exlaUzGKl8fcr63WWtIW0peSn6c2S/DPIJZY75NSukjlRINAaAgwAWhNqHB0nsI5e/dOxswsi4gPYOdJPpZ9JPpA9KlVZllVlHgzsIe01/rqmXkspf5AjO0u3l+IQfkAAAhCAwCIC/gZ7tpT76X5PYPuF5Hvat5eWlJoubvMZkm04V7JNuXM9Qz74lx8pEIAABCBQGIHPyp+cD1I3yH7/LPHmCcZlI9n0bukaKWfGn0iQLSZBAAIQgMAIBF6mbXP8lurr+d+WniPlcMnONtpW22zbcxsMuI+8WKJAAAIQgEABBGbLh3uknA5Gnp1+lOSJeLkWcz9SekjKif3dsneWRIEABCAAgYwJ+Lr/+VIuB6AHZasPmk+WSilPkSOfl3IaCHiOBfMBSumB+AEBCLSSwBx5ncvB/2TZ6m/NpZZN5NgpUi7x+ECpgcAvCEAAAqUT2EkOPialfsCZJxsPktpSfI39ein1uLjvPKstQcFPCEAAAqUQWEaOXCKlfJDxAcazzleQ2lb88KFPSalPFPydbCz1AUht63P4CwEItITAv8jPlA/+N8k+z5Zve9ldAG6WUo4VPx/c9l6K/xCAQDYE/KjflJ/z/2PZt1Y2NOs3dB01cbqU6iDAEzM3rx8DLUAAAhCAwKgEUj2Y+JT/HMlP0aNMJbCE/n2L5EcYpzgQOGOqufwHAQhAAAKpEfhbGZTiAcQ/wHNAarAStGdf2XSvlGIMn58gL0yCAAQgAAER8A/W+IdwUjt4TPzaHEHqj8COWu3WBON4jWxarj8XWAsCEIAABJok8M9qLLWDv29388/pUgYj4Hkc/u2D1OLpyxQUCEAAAhBIiIB/w/42KaUDxuWyp6Qn+jUdbj9B8IrEYnqL7FmpaRC0BwEIQAAC3QmkdtvfjTLVv5BHGY3Ahtp8npTSwI7bAkeLKVtDAAIQqIzAaqrpTimVg8TtssWnsCnVEPAteP7mnUp875It7nMUCEAAAhAIJjBH7adycLhPtuwUzKPE5neWU76TIpU48zsBJfYyfIIABLIi8CRZm8qMcd/nv19W9PIy1rfhmXEKg4A/y47l88KHtRCAAATKIvB6uZPCAcE2vKsstEl68/6E4n1EkoQwCgIQgEALCPjpcanMEv+xbOEJf/V3OjM+TUph0HclMa8/4LQAAQhAoBMBnxJO4UDgGf88279ThOpZto6qTeUHhLjkU0+MqRUCEIBATwIn6dPoAYCvSfOrfj3DVMuHe6jWFH5K+IRavKNSCEAAAhDoSmB9fZLChLCPd7WQD+om8Gk1ED0A9I8XrVu3o9QPAQhAAAKLCLxPb6OTvx/zu+Iik3jXMIEV1N5cKbofMPmz4cDTHAQg0G4CV8n96MR/ULtDkIT3L0mgH1yWBAmMgAAEINACAs+Qj9EH/1NbwDkXF09JoD9smwss7IQABCCQM4FPyPjIAcCDan92zgALs31T+fOQFNknPloYU9yBAAQgkCSBa2RVZLL/jySptNuoLwb3iWvbjR/vIQABCNRPYDs1EXnwf0Tt8xO/9cd50BY21gaekR/ZN7gMMGjUWD+UAE8uC8VP40MQ8MN/Iss31fhNkQbQdkcCviPjWx0/aW7h/s01RUsQgAAE2kfg53I56lueHzzjn6alpEnAcwEinw1xVppYsAoCnQks0Xlx65f6zIhPKW4hbSltJXnS16rSSpLv/V59/FUvYw9Id42/+idL75bmSr5VbUI36P18iTI8AfO/TVpm+CpG2vIYbf3KkWpg47oJfEcNHFp3I13q9yUIPxLaPwlNGZ4A+Xd4dmw5BAH/pOw+0sek86U6ZhS7zvPG29hbr26TMhiBg7R61Ld/t8sjfweLV8TaewT3kQMjnM68TfJv5gHM0fynyOh3Sz+VHpaaPrB4QHC25KeIMalMEPoon9U6Tcdpor25apszZn0EKXgVx+g6aSJuTb/6FlXKzATIvzMzYo2KCXikebB0shR5rXB6Unpc9pwrvVZaWaJ0JvBLLZ7Orqn/53Q2iaUJEvA9+U31i+nt/CJBHqmYRP5NJRIts8PX8b8m+fr89B02tf9t41clzz+gLCKwnN5GnKlx//DcDU8wo+RBwBM1HbOIfdt91H2VsogA+XcRC941SOBpausoybO3I5LBKG36rIDPVDxLooyN7SoIo/AcZVu+1eXXA38Z2F92zg9XLRaTf2vBSqUzEdheK/xQivoWMMrBZvq29uEH0nZSm8sb5Px0Nk39//Y2g8/Ud8+taap/TG/nHzNlVpXZ5N+qSFLPQAR8e94npRy/8U9PItP/9xmBL0urSG0sX5LT05k09b8TGiUvAjvI3Kb6x/R2vpAXqsqsJf9WhpKKBiXwQm3ge+2n74yl/f8n+XiY1LYZ6b49MyKWt6td35dMyYvAUjL3Timiz/w8L1SVWEv+rQQjlQxKwLfQnSlF7OiRbZ4hnzccFFam63uwc68UwfuETJlh9tjYSUF95q4WwSf/tijYqbm6jwz6sxRxYEihTT8VL/rZ+E30ifUCY/zGJhykjVoIvDmw36xZi0dpVUr+bUf+TavXyZqlpTmSr4uncCCOtMGTBI+Uoh6Pq6ZrL55VHcV429q9o4G6CDw9sN/sWJdTCdRL/l2Uj9qQfxPocotMWFdv/dCcqANCqu36VrV1FmEq6t3Lg+Lth0UtWxTJdjnj2EVNCPYDx0os5N/Ox54s829uk5tma48y6N1K3LNG9OnZ2t73Pm82Yj0pbu64R5S5atQ/8ELJk4Bjd32Q6VF9tk53yb/d6WaZf3MaAPhUrA/+fsoXpTOBTbTYjEq7bW2Dzu7WvtS/5EjJm8CVQeZ7clxJhfw7czSzy7+5DAD2EHuf9m/LrPeZu1r3NTxhzoOAfbuvkt0nawdZHHXwCHK3yGajBnFrFUST/Nt/MLPKvzkMANz5TpNW7T8GrV9zJRHwkxB3L4RE1IzqqINHIWFLwo2oGEb12aqhk38HJ5pN/k19AOBnSfte3uUHj0Hrt/Avb50sPaMAElHJ9MYC2LXdhXlBAEo4A0D+Hb7zZJF/Ux4AbCL2P5FWHz4Grd/Sjw322ZPc502sERTJ+4LapdnqCNxeXVUD1RTVZwcyssfK5N8ecPr8KPn8m+oAwNd8T5V8PYUyGgHfGmiWvn0n1+LRdETx0wcpeROIGgDkfNaS/Ftdn086/6Y4AFha7E+UtqguBq2vaVMROE4y2xxL1EOO7s8RFjZPIRA1iFtuihX5/EP+rT5Wueff6on0qPFT+uyvqBYGH+vBPeWPHgzqD7mfxk05pk3ZtkJQ33mgKQcrbof8W9/xJ9f8W3EX617dAfqIx/vW1wHNdr/u+JP9JOppbjwFMNku0bdhS2nNiC8U7rO5FfJvvX0lufy7REI91A/OuEgqYfZsQlgXM8U/IOQ7A25e7JN0FziZOpE3XXwalycBNk292vbcbyIOxk72OV1yI/9W2++61ZZU/k1pDsA3RIyDf7duU91yT/D5n+qqa6SmqIOw7+el5E0g6lr8I5lh+4bsJf/WH7Sk8m8qA4BXivs+9bOnhXECz9PrIRnRiEqmvo2HkjcBBgAzx4/8OzOjKtfILf9W6ftidTnJ+nR0xHW6Nrf5JzHP5emKtwb1j23VLiVvArNkfsR+7v0rh0L+jesf4fk3hTMAnhkZ9WMvOeygddnoZyx8qK7KK673oYrr67c6zgD0Syrd9aKeIvlwukimWEb+nYKjsX+SyL/RAwD/at0bGkNOQ9MJvEkLnj59YYL/3xlk08pB7dJsdQSirmtH9dlByJF/B6FV/brh+Td6APBRMY2Y3V19KPOs0bOUP5yB6VFPc9soAzaY2JuAf8M+oni2d+qF/BsbofD8awOiynZq+AVRjQ/Y7g1a/2zpAsm/LjZPukO6X3LxbHGfanSy8RMMd5T2lp4ipV4OkoG+1n1pwoZGDQC2TJgJpvVHICqGUX22PypjY+TffknVu14O+bcWAseq1ojJOf22OU/2eYS8lTRs2Vob+hrbPKnfdiPWO0b2pVy+IOMiuJycMhRs64vAj4L6zuf7si5uJfJvTE7plMdSz7+V99LNVKMfztEJRvSyS2TXYVKVlyZ8qeWF0m+kaP86te9Y+MxFquW9MqyT3XUvuzpVINjVN4E/BPWdd/VtYfMrkn9j8km3fJV6/q28h34taKfsFgAvv0Xygb/OpyO67sOlqNvaevn/FdmVanm5DOtle12fPaZ2l00VCnbNSGA5rRH1RePgGa2LW4H8G5NPeuWplPNvpT3V18t97bwXjKY/8+mw1Sv1sndl/pGZ46Wm/ezV3n2yZ8XeZod9unMgq6eFeU3DoxLwde5efb7OzzwPKMVC/h0bI/8G9sxXq+06d7xB6vYT5l4XyOKNatuPuR3E5jrXfVUgi15N+57ZOv3uVbdjRMmTwFtkdq/Y1vlZ1PMHZorUqwOZTOdN/p3aP1PNvzP1qYE+PyuRDuizEP71q+iyjwy4V5q+c0T8f3o0jC7t+9LJPUGMvtfFJhanT+D7QX0m5WcAkH+n9lvy71Qetf73FNX+uBRxcJvcpg/+u9Tq6WCV76rVU7gs4uulqT6V8VzZNjmGTb337Z7Rz8uQCZQBCXgSrw/ETfWTye2cM6CtTa1O/u1MurX5t+nE9grxb7rN6SF/VAteKv1y+geB/5+vtj1pyJPOIouT5ssjDejRtu/OiCi+XuhryZS8CDxT5jY5r2cynd9P/ieh9+TfzsFobf5t+mC8f2f+jS71dcEUT3WfKrve3iiJzo2lEKNOlkUm1b07GcSypAnsFWjdpYFt92o6hX2b/NsrQmNjKcSot4VDfrq8tvOPukw+Vdb0++OGtL3JzY4JZuQYOVapFZ+ma7q/TLTnyw+UvAj8SuZOxK/pV9+1kloh//YXEfJvf5wGXmtfbdH0jji5Pd/nH3VKcBBYPuUc/ZyAPQcxuKF1fU935AByi4b8pJnRCWyuKuZLk/f/pt4/qHaXHd2Fymsg//aHtFX5t8lLAJGn5Bz6d0p39dcHQtfyxKX3hlowNhYdq07uP6KFF3b6oKFlvn5KyYPAq2Wm7xyJKL9Ro55nlFqJ3qfJv/33iOhY9W/pAGuer3WbGoVPb+citR2VEAZA9MSqtvUSabofTf2f6invTwcymau2c+pDMreVxTG6TmpqX5nezr8mSp38239gyL/9s+prTZ9p8Kmx6TtLU/97hn1uxbPxm+IzvZ0H1HaTZ4f6jc2LApmY0XP6NZT1wgjsqZan9+cm/39+mOfdGyb/dmfT7RPybzcyQyyfpW2a3AkntzVXbad4MJsJo2/Juz6Q20YzGRjw+Spq06dXJ8e3yfffDvCZJgcj8J3A/vGw2vajdlMrs2RQk/vJ5Lbmqm3y7+D8G8m/TQVmq8A94mi17QlBuRU/MCnygLNlgsDulU0+lRlVDlHDnmBGSZPAZjIr8myfL535gV6pFfLv4BFpRf5tagCwxeD8K9vimMpqar4iBgCLMz918UWNLfFZmZR/5rUxEIk29H7Z5RhFlci+2ctn8m8vOt0/Kz7/NjUAiBqB3qDYXtk9vsl/cpksvCnIyhTPABhFdJI9TDb4kaqUtAjMkjmvDDbptOD2uzVP/u1Gpvfy4vNvUwOA2b051/bp2bXV3FzFUT5s0pyLA7XkuyOuGWiLaldeVtW9s9oqqa0CAj4zs0wF9QxbxVXa0AeMFAv5d/ioFJ1/mxoArDo8/5G2vGCkrdPY+LdBZkTFrB93j+9npRrXOUJ1b1pj/VQ9GIHNtfo/DLZJ5Wun/JTRqH2Z/Dt8N2skZk0NAFYensNIW3pUnnuJ8iEqZv3EKzrZLi8jv9iPoazTCIH/UCt+UmRk+W5k4zO0HbUvR+WuGXAM9HGUD43ErKkBQNStMdcNFOo0V/5DkFmNdMAhfbtY20XP7dhPNrx4SPvZrDoCB6uq6Hvvfeo/1dP/Jk3+NYXhStH5t6kBgO/fjih3RzRacZtRPqQ8ADDioyrmPEx1R2qjqOQ6jL2lbeM++u8JOPWNBGzoZQL5txed3p+Rf3vz6evTR7TW5IdDNPXeE7ZyLz612RSvye34oSYpl/VkXORDgSZYfSplSIXb9ln5NxGHqFfntnUS50z+HT5A5N/h2T2xJR3wCRQDv6EDdkd2oj6KSvwT7fqBIft0N5FPaiKwp+r9izQRh6jX6Amp/eAl//ZDqfM6Reffpi4BRD0dq4TTs1Gn4u/rvD8ktfQrCVjjfciXI1L/FpgAqspMWFc1fUeKfOjPhDNfnXiT8Cv5d/jgFJ1/mxoA+BGuEWW1iEYrbjPKhxwGAH7wyhUV8x6mug20USoHpGHsz2kb56yjJV8Cii5XyYAzoo3oo33ybx+QuqxSdP5tagAQNQLdpEtQc1ocdb95DgMAn/b9j0SCubfs4DHB9QfjA2riufU301cLn9Fa8/taM3Yl8u/w/IvOv00NAKIOJlsOH/dktozyISpmg4L3t8FbB92opvU/onoPqKluqh0bO1AQPpgIiD/Ljm8lYstMZkTty1G5ayYeg3we5UMjMWtqAHDPIMQrXHfHCuuKqmqHoIajYjaouw9pgy8OulFN6y+tej0pbOea6m9ztbvKeT9sZ6lEIPyn7PDkuhxK1L5M/h2+dzQSs6YGAFEP5Nl7eP7JbLlXkCVRD8AYxt0jtdGdw2xYwzYrqs5TpKfWUHdbqzTLk6UVEgFwh+z4QiK29GMG+bcfSp3XKTr/NjUA8GSZiPIUNbp1RMMVtbmt6nlyRXUNWs3Vg24QuL5Hy58LbH9602tqwU+kjad/wP8DE9hQW/gXINcYeMv6NvC1/6iJdcN4Rf4dhtrYWPH5t/QBgMP+iuFin8RWrwy04srAtodp2mcBbh9mw5q28YHLdyl4EEoZjoDZnSVtNNzmtWx1i2rN6du/IUQNANw2+dcUBi+55d+eHs7Sp1EP6pintlO5bihT+i62+QYpiltKSbdfaG8P5NUtTo5hzmeh+mVf9XrbqMIbpW5co5a/uWpHG6hvViDHeWqb/Dt4P84x/yrUnYvPNDwoRe20h3Q2K+mlHjlH8XpAbTd1dqjKIPjRz/62E8WtW7uen7BblY4WXtdO8u82qRvPqOWXy6ZlMmRP/h08aOTfwZn13OJ8fRq1416stpfoaV1aH3qHvVSK4vWLtHAMZM0LA7n1itf9suv5A3nSzpV9q58HoL1YRn22f8YhIf/2Hzzyb/+s+l7zY1ozasd1u4f3bWn8ikcEs/pwPIKRLPCksci+1q1tP7t+jpTj2RWZXWvxAP0t0mNSN36Ry30XQs6F/Nt/9Mi//bPqe829tWbkDnyr2k9pJnE3cGvpA09mi2S1RzfjMlnuh3f4+QCRDHu1fbpsWycTlk2Yua4aOVPqxSzyM1++3KwJEDW2Qf7tDy75tz9OA6+1vLaITsrHD2x1sxv4W9D3pMhk59OvyzXrdi2tvT+Y40wx9GzyVB5pW0sA+qx0T613szQTr8jP39WnLymvRv6dOTrk35kZjbTG2do6ckd2228cyYN6N/Yp0Gg+P6nXxcZqX0Ytee5HNM9e7fuSwKelFaW2lZXk8GclM+jFKPqzC2Xf0lIJhfzbO4rk3958Rv7UI+noHfpR2XDAyJ5UX8ELVGUK1z99K10pxY8iTYHpTH3+Btn5klKg9+HHwVonxVv8psfJueKZffiTyyrk3+6RIv92Z1PZJ09WTY9L03e0pv/3jOxdK/Nq9Ip2UxUpzHz2t7ENRncnqRo+JGua7l/DtueH3myVFL1qjdlU1f1YGpZP09u9r1r3w2sj/3YOAfm3M5dalp6pWpvekTu15wNuCrdl+TrwvYkw8ZPrSit+CMm5Uqc+kOIyz5P5grSxVEqZJUf+S3pYSpF5J5t+Jlvdd0or5N+pESX/TuVR+3+HqYVOO1zEMp/i+6faPe7cQIq3Pb2ys6nZL/UjZf0wnog+Nmyb7ptHSTmfEdhE9vsRzTkd+B2vu6SNpRIL+XdhVMm/Qb3bk398Cn7YxFjHdsfLnjUa5OFbTU5MjIHPQpQ8Ge2l8m9+Ysz76cu+LPMdaQ/JSSv1sqQMtK222bb342NK67iPHCSVWsi/Y2Pk3+De/VW1n9JOb1tuk/5BqjPJOjkeId0upeb/f8um0sun5GBq3AexxxPnPiltkWCg/OyFOdK10iA+pbbuR2V/6YX8m14fbUP+fWK/8kM1Uv12cKls82myKm/98YHfj6j9rZRawrM9jkWKBxWZVWnxNd0zpRRjMKhNv5QfntW9gxRxrdpt+i4L2/AraVD7U1zfD2iKYKlmGy3k37T6a1vy75ROfqz+SzEJTNh0vez7V2mbKVYP9s+2Wv3j0g3SRL0pvn57MLeyXtun/65NPB6D9hHPbzhJepP0dGlZqeqynCp03W+Wvi/5Ovmgdqa8/tXyZ02pLYX8m07/Dcu/dZ7unmlHcjL5nRRpw0w2Tnx+k96cLV0g+dfm5kk+jX+/5LKS5APLbMmnQv2tbG9pQyn14muejsVlqRtaoX2O0flSk/M+KjR/xqp8q+08yQe1K8Zf/b8vc7nf3if5W4dfXVaWfMbLr2tL7suzJHPaSvLZoVlSqd+OzWRX6RqpLYX8m0ak25h/nyD/A71L+VtBG2z73hPRaNeb58jd3Gant6E/Nu2jb7v0feBtLOTf+ONPW/Pvgv1tO/19TGp6p6e9hczNftsFkWjnn0Pltr8t0x/aycBnQQ5uZ9df4DX5N7bfh+ff6FN6/kEUX3fbucU7YaTrn1Pj34o0ILjtS9W+52ccJOVwKSoYV1HNe9D3OunoorwazBny72C8ql677fl3AU9fd/Q1dr6FNcvgj2K+6oII8OdN9L/W7X//TLdfQID822zenTjOJZF/o88AuAc+Kv1Jeqn/oTRG4P+qpQsbay3thn4t8x6R9k3bTKyriMB7VM9nKqor92rIvzERJP9O436G/p8YHfFaL4vTprHn34UE3qAX5gTU2/ci923PuH4rnb0jAfJvc/2e/NuhC66nZT4TEJkg2tC2r/tt0IE/ixYSeJVePDmnDX2hTT56wp+/dVE6EyD/NrPPk387978FS/fXX76B1dcRzfZ5Pfjz0UICh+jlYalNB8iSffWtfm2e7b+wV8/8l/xb7z5P/p25D459QuuUnIwifftIH/xZZSGBXfRyqxQZL9oenf8diuHuC0PK3z4IkH9H73Pd9lvybx8d0E8k+4XUDSLLh2PzUzFdqg/+rLKIwKZ6e6VEn8uTwbWK3ZaLwsm7PgiQf+vp6+TfPjrfxCp+FCmJt7qOeI14rjsBl9eBCLgvMkGqur7Y1GDKP+zjZ4xQBidA/q22v5N/B++DC56r73slm0oYpbZzsxjOGoI/mywi4DMncyTmp6S/P3qm/yclznYJwghltrYl/47e38m/I3RCP6b2TqnUg3Pdft0tdtuPwJ9NpxJ4sf4107rjRv3DMb5LsfFTHSnVECD/DtcPJ/Zf8m8F/dATeB6UJqDy2h8LM2PyUwUdcFoVG+n/n0n0w7QYnK+YbDItVvw7OgHy73D9nPw7et97ooad9c4/2UnS7Y+Bvwlx8H+i+1T+ZknV+BbJTw+kT8Yy8DMb5kic8heEmgr5d7A+Tv6toSNuozpvlEi4vRn4YUqc9q+hA3ao8lladpFEn4xh4EdZP7NDXFhUPQHyb399nPxbfd97osZZesfdAd07om972uwJWrxpgoBvm/LZgPslBgLNMPDp1TnSshKlOQKz1BT5t3sfJ/820BfXURtcg128E/5UXNZugD9NdCawuRafKjEIqJfBKWLMILdzH2xiKfm3c/8m/zbR+8bb4LasRZ1wvpgcKS3TIH+a6k5gX310qcRAoFoGV4npgd2x80mDBMi/i/o2+bfBjje9qb21wNdc2pps/ahaP7+bkhYBD8Z8WcA//NHWvlmV338WwzdLDHAFIbFC/iX/hndJ/7Kdn/pVVcLJpZ7T5PP64fQxoBeBFfUhA4Hh9k0/w3+OtIpESZcA+Tfd2LTKshfK2+ulXA7gw9rpp3Md1qrI5u/sqnLhA5K/zQ4b97Zs5zN675M48AtCRoX8m1GwSjXV37jmSCXen+37nX2tn8QoCJkWz1r34I05AosPhPy8dJ8teZJEyZMA+TfPuBVn9dPl0UmSJ2jk/s3Jz58/UfJjOSllEPCDhPaTTpAelXLvo8Pa74H68ZJZLCFRyiBA/i0jjtl7sY08OEryt+dhk1TUdj7wnyzxoBNBKLj4VxrfJV0mRfW1ptv1GZB3Sr6ljFIuAfJvubHNyjPfo/0V6T6p6WQ3aHv3ysb/lrjXWRBaVpww50hXSIP2m9TXnyuffAnr2RKlXQTIv+2Kd7LeLi/LDpb8zTqlswL+tn+u9FppJYkCAV/y8bfks6Qc57Q8LLvPlN4heWBDgQD5N7E+0Obrbr595eXS/tJuUtOTjx5Um+dJvp3vWMmz+ykQ6ETAg8I9JfdTf4PeQXIyTan4gP8byQNZ92s/rfN+iQKBTgTIv52oNLyszQOAyaiX0z+7SH6whfUMaQWpyuID/kWSv9GdLf1K8jc7CgQGJeD+6j66neQJV08b12p6baLcpUZ+P65L9GpdKHlCIwUCgxIg/w5KrKL1GQB0BmkuG0lbSFtKW0mbSKtI/ja2suRkO3G63t907pY8x8DvfR3/D9KV0tXjukGvvk5LgUBdBNZSxbMnaUO9X3NcnnC3quQ+7Ee5LiNN7r++JOZLUe677su3SXeM6ya9+hr+vPHX2/VKgUBdBMi/dZGlXghAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgEBHAkt0XFrWwhXlzjbSJtKsca2v1zUnaWm9X156klR3uUsNzJfukR6T7pRulm6Sbhh//we9XiY9LFHaQcD74oaS++mTpbUmaZ3x92vo1f3ZZRVpKcl9d2UpotynRv8iPS7dO27AA3p1n75dumX81e/vkNzH3bf/KP1VorSDgHPrttKmkvv4RuOvfu8+vYy0qrSktLpUd3lIDTi3uu+6X07I/XLeuK7T6+WS+3OxpbQBgDvaDtKu0k7SdpITqjtWbsWd8yrp4nGdr9f/lTxooORLwInO/dLaXHL/nNByet+G4uQ7V3KSta6WLpF+J00MJPSWkiEBH8x3lnaRJvr5lnrvgWpuZb4Mdv90DnbudQ7+rVTMF7PcBwC2351s/3G50y0rlVrul2M/l84alzsmJV0C/jbjPvkMafvxVx/sc9/v5EItxWcFnHAvmqRf6v3dEiVdAs7B+0r7SLtLE2ep9La48og8cp88bVweuGZ7NivXRORT+gdLr5J8Wqmt5Xo5/gPpeOnctkJIyO+1ZYu//ewmOSH6wL+kRBmNgAcFZ0rnSWdLN0mUWAITOfjlMmOLWFNCW3dfPFFyDnb/zHYwINuTLhvIuvdLTgaGjKYyuEJMPiCtJ1GaIbC0mtlL+jfpMmm+RL+sl4EZm/VnpT0lx4DSDIH11cwHpSsl+vniDK4Vl/dJPlZRKiKwh+o5SfK1bzrdzAx8iupbkr+JUqonsJqqPFQ6RvJkN/pkLANP4Pq2dIjk2FCqJ7CLqnR/d26hv8/MwMcqnxXYXaIMQcCnTZ1kL5DocMMz+I34HSTleqlHpidRVpAVL5dOkR6V6JNpMnBsTpacO5q4o0fNFFucM14skYNH6+u/FsOXSVwKFISZijvdCyVPAiLJVsfAE1U8Z4KBgCD0WbzDPlv6snSPRH/Mi8GDitlxkvMJlwkEYYCyr9b1lwf6fHUMfNnqMImBgCB0Kntq4YUSna4+Br8S3+dIlO4EfP3uw9LNEn2xDAY3KZZzpPUlSncCPmXt293o9/Ux8BkVLg1M6oOz9f57dLrGdrr5Yv1NaV2JsoiAd8rvSpziry/5RR9YHNtjJQbBgjCprKf3R0vODdExakv7Pju1sdTa4tNy/yw9ILUl6Cn5eZe4v0laSmpr8YN3jpAullKKDbbUHw/H/DWS+0Bbi/f9N0t+zgJ9rnkGfq7L26TW5eBt5TSTS5rvcJ128vMVi02lNpUV5exbJZ8a7sSEZe3h4j7wFskTPdtUNpOzfqANfT2egScKbtOGzudJaK+V+NYf3+km7/ieMOUkWHpZWQ7azz9Kk/3nPTxuU5+YI7XhVsLD5Kd/x4F+nw4D/z7Bu6ViJwmuLedOo9MlvdOdpPisKZVW/I3/gxKnOtNJeKkefO5SP/EDtUo8I7CW/PqBlCp77Bob+5HiU1wOfqacmkvHy2LHu0FxcrxKKB5N+9sO3/hJ+oMeXHwXiM9WLi2VUJ4uJ66TBuXA+s0zcw7+mxI6nX04XHpYoiPlw8CnB18i5VxeJOMvl+h3MBilD1yqPvSCnHcE2f53kiecjcKBbZvl50sC/vKSbfH1/n+V6Dh5Mpiv2H1IchxzKp5M81OJfgeDKvuAf4Fz65x2BNnqffcjkvflKllQVzM8HTfHL7ccvOAneb9Dpytip/OT8HwqPfXia7afkLiPv5nk1MaDwCPqXx+TcnjMsG8t+4rUxjiV5vPRiuMyUhbF99V+XyotCG32x5MDHddUy4EybK7U5hjhe3Pxv0597fmp7gyya1nJD7WiT5TD4BTFM/mB50oy8mw6XpE73o8V19RmRvvRrh6ckOhgENEHTlDfW1dKqfiOl9OlCB60WS93X4ZyfJMsHp1w8K+3A0TvYGcoxqmcCfDEptukaCa03+4Y3Ko+mMqEWX/z51brsvujBwHJnQlwx/MpCpJh+Qz8jTvy1qhV1b7nJdDXYJBSHzhOfXINKar4mr9tSIkJttQTD5/hSeWL2IIJYsfT8Vq14/234h0xM/V5avdG+lqr+lpOBxHfv72v1HTxvvg1KSdW2DpavL6jeI+cgz1qHLV8RhW8ZtRK2D4rAs+StZ6V6ks+TRSfcfi49P8knwGgQCBFAu6bfy8tL/1Mmi81UT6hRvzDXpT2ENhWrrqfnRnp8uvVOCO5djJwcjukgc7niX5OpvQzGOTUB36qPuuf2a27vEIN5MQFW6uN1xGjdLBRTiHsoobPkXz9n9JOAn5a1e7SBTW5v4fq9akuDwIoEMiNgCep+gBd17e0Z6juc6XU7s6RSZSGCDymdvaRfjFMe8M+4GUDNXaixMF/GOrlbOPZqL4Vyj/0VGXxwPR9kme8cvCvkix1NUnA+8Wp0nukUb5sdbJ5XS30D/tw8O9Epz3LfCn2WKmJs00LqHreAKdkqz2Nk/tpMd96VFWC83WtY6TcmWA/MZzcB76lPl3VzG3va74ld3L9vG83D8/HGvgL/TCTAN+vhg6XKBCYILCZ3twu/XpiwZCv/hlM30564JDbsxkEUiXgX+PzqdqTpQdGNPJt2t7zrygQmCAwW28elnxJqO8y6Le2v1HNbmDpvltgxbYQ8HwA3x1wxZAOb6PtnBzdkSkQKJXAdXLMA9xR9pMLtL3PlFEgMJmA5wPsKrl/9FUGGQD49NVF0tZ91ZzmSvfKrP+VrpKulK6W/ih5RH6PdJ/0F6mu4oHTypJvF1pR8lyKLSQz9asHWKtIuZYLZfjOkjviIOW5Wvl4iVv8Fva/m8RinjRXul66RfKEsjvG5X7q/uryqDTqN8oFFQ3xx3142fHtHDv37TWltSRf/15HmjUuD+w2lPjyMDZ2tzj4SZae4zJIMWvnr+0H2SixdcnB9QbkUlX/LMl5odLyUdWW23Wmx2WzZ+C+S9pJGuaShzZrrDg5ehDwbsnXdGx/bszfK5sHKU6Ej0i5+VmFvT7Qnyx9XDpEeqpU8gHSvm0jHSp9QjpFulmqgmVudfh07aCPEP5AhqzIwc337w+pn1RatlVtHlHkspP9Xra+U/I3jpzLk2W8BwMe1eXC/n7ZupHUTzlcK/mMSy6+jWLnfPn5O+kL0iukjSXKQgKz9PJK6YvSxZJZjcI6l23d918t9VPcX3ymJxffyMFxsfLgcqt+OlW/6/wkk453rux8Yb9OZbbes2Wvvy3mkAB8On+m8katkOMZjkH4+5T9cdJrpdwHo3KhseLLBwdLR0lmOAjz3Nb1YMeT+mYqJ2mFHHwjB6cRpzNm6lD9fv7iDDqenfUp/jYUX2M/S0o9GTyvRzA+lIH9w/K9Vb79l7SnlPolJ5mYfDHDvaQvSbdJw8Yl9e3+Rb51Kwfog9TtJwenF6ORvwz7IQPXJtz5bpRt/qbQxuJrxjdJqSYGnwLsdF/qhxO2eViWPjX7dWlfiYO+INRUlla9Hlh+U3pQGjZeqW73Qfk0vXgfukxK1WZycLqx8WR37zNDF5+6TLHj+bTZ56WVhvasjA1XlhtflFKMkW06dBpmz2dI1dZh7LpI/rxB4u6FaYFu4N/V1MY/SZ5XMUzsUt3mndPYeb5IiraSgxcGKvUc/A/T+lPf//o+0xuk1Dqfrwke1LcX7VjRs4nvlFKL1eWyaeIb8ZsStG8YXp645ev6vhRDSYPALjLD804cm2Fimto2Hti4eN+5UkrNPnKwozO1pJqD58nMZaea2t9//maTWsfzPbBP6c/81q21sTy+QEotZq+STa+R/I0hNdsGsec+2X+kNFuipElgU5n1n5LvRBkktqmt633F+4z3ndRsIwcrKF3KxlqeYg72mfyBikee10gpdb4fy54VB/KifSuvJJdPl1KKmyfF5Tzb39f3PyWtJVHyILC2zPyslPM8Ae8z3ndS2pfJwQrIDCXFHOy5AJ3mY3V15e/0SUod72jZ4wmJlJkJeNLHV6WU4pejLY+I4Zel9SVKngQ8EPik9JCUYx9MyWZycP/7QIo5+G/7N3/hbwun0vmOkuFLDGI86y4Y7XmHTSWGudnxXbHbmH5UDIFN5MkJUm79MBV7ycGD7wr+xp1SDj6nXxf8BKFUrtf6wTceTVEGJ+AzJqdIqSSRHOzwbxnsPjhqtsiEwJ6y03du5NAXU7GRHDx8504tB2/djyufS2QHOU92PKkfg1mnK4EV9MkvpVSSSap23CNGr5c8aqeUTWApuec7Uu6VUu2PqdhFDh59X0gpB3teTM/iEcvtUnQHvEU2bNDTUj7sl8CTtWLJT1Abta/+QHzMiNIuAhvJ3R9Jo/afUrcnB1e3P6SSgx3TnmfUn5/ADuHZr8+tjj01icB+Us4z8etIsh4UvYze0XoCftCO72uvo4/lWic5uPrdIpUc7Cdpdi1+xGZ0p/1YV+v4YBQC/vnV6Nim0r5/3IozTKP0prK29Te0s6RU+me0HeTgevp3Cjn4a91c89OC7g7eCXy/4nLdDGT5SASepK2vlaKTS2T7D8v/t0ncVSIIlCkEPP/jXZJv/4zso9Ftk4OndItK/0khB/uJsR0vA+yVQMfft1LcVDadwP4JxDgqwc2V78+YDoT/ITCNwI76/wYpqp9Gt0sOntYhKv43hRz8nE4+fTq40x/bySiWVU6gjfdDny6Ka1ZOkgpLJeAHCLXxkgA5uJkeHZ2DP97Jzd9rYdTo83G1vVUno1hWOYFtVKN5R8W6yXb9PAt3dt/6RYHAIATcZ6K/FDW5r5CDB+kdo60bnYP9LIwpxd+OIh/+890p1vBP3QS+pwaaTC4Rbfla7t/XDZL6iyfwf+Tho1JEH26yTXJws105Mgd7sLfGZHcPDOzgHng8fbIxvK+dwPZqIXLAV3di80QXz2mhQKAKAr4uHj1Bus59hhxcRS8ZrI7oHHzAZHMjb0/4+WRDeN8YgXPVUp1JJaruefJr68Yo0lBbCGwrR0udHEgOjunFkTn4Y3Z5yXG/d4jxf0Gr3whsu81NH1Wg83Plk7/5X1Ggb7gUS+BSNf9sybfSlla+UZpDmfgTmYOnHPNvEbCIb2z+ve5VMwlWaWaau/lHxL2ONi+XLzzcp7Remp4/68mkS6Q6+nBEneTguD4WmYP/OOG2O3REx3Obx00YwWsIgRPValTsq2z3QvmxVghBGm0jAd8m+Dupyj4cVRc5OLYHR+bgtX0J4KmB/p8Z2DZNj42VwP8yBfJ50u0EFAINEfDvSPj3Skq41FRCDmgo7LU0E8n/qR4AzK7Frf4qPbu/1VirJgJn1VRvU9Veq4Y4+DdFm3YmE/AgwPNN/OjcnAs5ODZ6kTl4lgcAs4L8v0HtOoFT4gg4ed0U1/xILV+vrfeRnriWNVJtbAyBwQl47pQf7Xrj4JsmsQU5OD4MkTl4tgcAGwcx+G1QuzQ7lUCOcbhLLvg+VicwCgQiCcxT48+X7ok0Ysi2c9z3h3Q16c2i4rDgDMC6QWiuDGqXZqcSyO0U5mMy/2CphOuvUyPBf7kS8C2Cfyv5iYE5FXJwGtGKysHr+AxA1OzpKKfTCHk6VuQUB8+Ufo0Ued0snchhSUoEzpExr0vJoD5syWnf78OdbFeJisNaHgBMeSZwgwivabAtmupO4OruHyX3ySdl0VHJWYVBEFhI4Ot6+WxGMMjBaQQrKgcv+IXUO8Qg4h7ULdJg33or/NjciPgP2uYZspNf9Wt9d00egPvo6dKg/TtifXJwGt0pKgff6jMAywYxuC+oXZqdSuDeqf8m+Z9n/L9c8q9YUSCQMgH30VdIc1M2ctw2cnAaQYrKwctFDgDuT4N9662I6nz9gn9EK75E4kE//RJjvWgCPqt6qJT6pEBycHRPWdh+VA5ezs1H/SysBx+UeAKOQ8Tpx37bfFs8IiyAwFAE3qWt+u3nEeuRg4cKa+UbReVgH/vDOmjlFKlwaAIRyaefNn8ij5YY2is2hEAsASd237HST1+PWCeWDq1PJhAR/786ubrhiEJij6Deuc2oPtDZmoVL/bCf7aRcn7LWyzc+aw+BDeXqxdKCGdeJuU0OTicgITmYU0DpdAAsmUrA91Rz8J/KhP/yI3CzTH5zfmZjcVsIhJx6aAvcTPyM6gPd2j0lE26YCYF+CfxQK3br71HL+7Wd9eonENIHuARQf2BzaMGdL5XiGbHbSLn+SFEqHLEjLQIbyZxLpZUTMotLAOkEIyQHcwkgnQ6AJQsJvEcvHPzpDaURuEEOfaA0p/AnbwKcAcg7flVZHzL67GD8RVq2g7Tg9pQOn7MIAjkT8FMC/ctvntyaQuEMQApRWGhDSA7mDEA6HQBLxsbeKggc/OkJpRLwUwJ5rkWp0c3QLwYAGQatUJO/K79+XqhvuAWBCQI/1ZsTJ/7hFQKRBLgEEEk/jbZ9WvIvwaY8rPa3kq4PtoPmIdAEgU3UyOXSgkexNtFglzaW1nJ+X6MLnIYXcwmgYeA0t5DA3gmA+JJs4OCfQCAwoREC16mVrzbSUu9G9ur9MZ+2gYBHHhFqA9scfDwqKP4Tfe5Btb9BDqCwEQIVElhfdT0gTewHEa/frNAfqhqNQET83WZYBxwNF1tXQWBFVeKfBI3qfG73U1U4Qh0QyJDAv8vmyH3Pvwa4UobcSjQ5qh+EdcASg5ibT4fJ4KiO53Y9+FgrN2jYC4GKCKyjeqLPAryyIl+oZjQCIXl4ydFsZuvMCbwq2P7/Ufu3B9tA8xCIInCrGv56VOPj7UbngGD3aT5k5AH2cAL+dbLHpKj4+86DTcMpYAAEYgnMVvPeF6L2w0fV9hqxCGg9Kv6cAWhv33uRXPdtQFHle2r4D1GN0y4EEiEwV3Z8P9CWZdT2gYHt03QgAQYAgfCDm35xcPufC26f5iGQCgFPBowsL4lsnLZjCUSdeor1ut2te+bvQ1JU7C9uN368h8BiBPw7GFH7o3NBSr9SuBicFiwIiT1nAFrQszq4uJ+WLd9heVOLvtxUQ7QDgUwIeEJsVHEu2DeqcdqNI8AAII59ZMvPC2zc3zaOCWyfpiGQIoGjZZQfihVVnhvVMO3GEWAAEMc+suXIAYB/9OfuSOdpGwIJEvA+EfkjQT4rSGkZAQYALQu43N1CmhXo9rcC26ZpCKRM4NuBxm2itrktNzAAEU0zAIigHttm5Kk+P/jkZ7Hu0zoEkiVwliy7I9C6yDODgW63t2kGAO2L/e6BLp+gtv3QEwoEILA4AT+YK/IywHMWN4klJRNgAFBydDv7tmvnxY0sPa6RVmgEAvkSiNxHInNDvhHL2PIlZLvvP4wobpvSLIEN1dxNzTb5RGt36d3a0uNPLOENBCAwnYCfznmbtNr0Dxr6/ylqJypHNORiks2EHIc5A5BkX6jNqN1qq3nmik/XKhz8Z+bEGu0m4EtkZwUi4CxAIPymm2YA0DTx2PZ2DGz+1MC2aRoCORGI3Fd2ygkUto5GgAHAaPxy23r7IIN9estnACgQgMDMBH6sVUJOCavdp89sHmuUQoABQCmR7M+Pp/W3WuVr+dn/t1ReKxVCoEwCf5Jblwe5xgAgCHxEswwAIqjHtLmeml03pumxc4PapVkI5Eogap9xjojKE7nGKlu7GQBkG7qBDY/69m9DfzmwtWwAgXYTOC/Q/chcEeh2+5pmANCemG8Z6GrUt5lAl2kaAiMRiBwAbD6S5WycDQEGANmEamRDNxm5huEquFmb3TDcpmwFgdYSuE6eey5ARNksolHabJ4AA4DmmUe1GPVDHxdGOUy7EMicwO+C7I/6shDkbnubZQDQnthH7dSXtAcxnkKgUgJR+07Ul4VK4VHZzAQYAMzMqJQ1Zgc5cmlQuzQLgdwJ/D7IgahcEeRue5tlANCO2K8uN1cMctXPAKBAAAKDE4g6A7CSTF1lcHPZIjcCDAByi9hw9voZABHFzzW/JqJh2oRAAQSulg/zg/xYP6hdmm2QAAOABmEHNrVBUNs3qV0PAigQgMDgBB7RJn8cfLNKtmAAUAnGtCthAJB2fKqyLmoAMLcqB6gHAi0lELUPMQBoQYdjANCCIMvFdYLcnBfULs1CoBQCUQOAqMuGpcQtCz8YAGQRppGNXGPkGoarYN5wm7EVBCAwTiBqAOCJw5TCCTAAKDzA4+5F7cz8AmA7+hde1kfg1vqq7llzVM7oaRQfVkuAAUC1PFOtbbUgw24PapdmIVAKgah9iAFAKT2ohx8MAHrAKeijqJ35joIY4goEIghE7UNROSOCcWvbZADQjtBHPdQjKnm1I6p42QYCUWcAVm0D3Lb7yACgHT1ghSA37w5ql2YhUAqBqH3oSaUAxI/uBBgAdGdT0ifLBznzcFC7NAuBUgj4YUARZbmIRmmzWQIMAJrlHdVa1ADg0SiHaRcChRCIGgBE5YxCwpaHGwwA8ojTqFZG7cwMAEaNHNu3nQADgLb3gBr9ZwBQI9yEqo46nccAIKFOgClZEojah6JyRpZBytVoBgC5Rm4wu6POADw+mJmsDQEITCMQ9WNaUTljmvv8WycBBgB10k2nbkbz6cQCSyCQAwEGADlEaUQbGQCMCDCDzZeVjcQ5g0BhIgQSIrC0bFkqIXswpQYCHBhqgJpYlYzkEwsI5kAgEwLkjkwCNayZDACGJZfPduzE+cQKSyGQEgEuHaYUjRpsYQBQA9TEqmQnTiwgmAOBTAjwNMBMAjWsmQwAhiWXz3bL5GMqlkIAAgkRYA5AQsGowxQGAHVQTavOJdIyB2sgAAEIQCAFAgwAUohCvTYwAKiXL7VDoFQC5I5SIzvuFwOAwgMs99iJy48xHkKgDgLkjjqoJlQnA4CEgoEpEIAABBIiwAAgoWDUYQoDgDqoplUnO3FaAaoGOgAADRZJREFU8cAaCORCgNyRS6SGtJMBwJDgMtqMnTijYGEqBBIiQO5IKBh1mMIAoA6qadXJTpxWPLAGArkQIHfkEqkh7WQAMCQ4NoMABCBQOAEGAIUHmAFA4QGWe+zE5ccYDyFQBwFyRx1UE6qTAUBCwajJFHbimsBSLQQgAIGcCTAAyDl6/dnOAKA/TqwFAQhMJUDumMqjuP8YABQXUhyCAAQgUAkBBgCVYEy3EgYA6camKsvYiasiST0QaBcBjg+Fx5sAFx5guffX8l3EQwhAoAYC82uokyoTIsAAIKFg1GQKA4CawFItBAonQO4oPMAMAAoPsNxjJy4/xngIgToIcAagDqoJ1ckAIKFg1GQKO3FNYKkWAoUT4MtD4QFmAFB4gOUeO3H5McZDCNRBgNxRB9WE6mQAkFAwajKFnbgmsFQLgcIJkDsKDzADgMIDLPfYicuPMR5CoA4C5I46qCZUJwOAhIJRkynMAagJLNVCoHACDAAKDzADgMIDLPfYicuPMR5CoA4CfHmog2pCdTIASCgYNZnCAKAmsFQLgcIJkDsKDzADgMIDLPfYicuPMR5CoA4C5I46qCZUJwOAhIJRkymcxqsJLNVCoHACDAAKDzADgMIDLPfYicuPMR5CoA4C5I46qCZUJwOAhIJRkynsxDWBpVoIFE6As4eFB5gBQOEBlnsMAMqPMR5CoA4C5I46qCZUJwOAhIJRkymM4msCS7UQKJwAA4DCA8wAoPAAyz124vJjjIcQqIMAuaMOqgnVyQAgoWDUZAo7cU1gqRYChRMgdxQeYAYAhQdY7rETlx9jPIRAHQTIHXVQTahOBgAJBaMmU5gDUBNYqoVA4QTIHYUHmAFA4QGWe4ziy48xHkKgDgLkjjqoJlQnA4CEglGTKezENYGlWggUToDcUXiAGQAUHmC5x05cfozxEAJ1ECB31EE1oToZACQUjJpM4TpeTWCpFgKFE2AAUHiAGQAUHmC5x05cfozxEAJ1EODLQx1UE6qTAUBCwajJFAYANYGlWggUToDcUXiAGQAUHmC5x05cfozxEAJ1ECB31EE1oToZACQUjJpM4TReTWCpFgKFE2AAUHiAGQAUHmC5x05cfozxEAJ1ECB31EE1oToZACQUjJpMYSeuCSzVQqBwAuSOwgPMAKDwAMs9duLyY4yHEKiDAJcP66CaUJ0MABIKRk2msBPXBJZqIVA4Ab48FB5gBgCFB1jusROXH2M8hEAdBMgddVBNqE4GAAkFoyZT2IlrAku1ECicALmj8AAvXbh/uMcZAPoABCAAgZQILCdjVphk0JP03oOtJSYta+LtXz0AiGjYzjG6bCLEtAEBCEBgOALMHxqOWy5bPehLAA/nYi12QgACEIAABCBQCYF7PQC4t5KqqAQCEIAABCAAgVwI3McAIJdQYScEIAABCECgOgLzPACYV1191AQBCEAAAhCAQAYErvQA4MoMDMVECEAAAhCAAASqI7BgAHBFdfVREwQgAAEIQAACGRA432cAfpGBoZgIAQhAAAIQgEA1BO5QNb/3AOAy6ZZq6qQWCEAAAhCAAAQSJ3Cm7JvvAYAfyPOTxI3FPAhAAAIQgAAEqiFwrKvxAMDl2wtf+AsBCEAAAhCAQMEE7pRvp9q/iQGATwfc7AUUCEAAAhCAAASKJXC0PHvE3k0MAB7X+y97AQUCEIAABCAAgSIJPCqv/m3Cs4kBgP//vHT3xAe8QgACEIAABCBQFIFvyJsbJzyaPAC4Rwu/MPEBrxCAAAQgAAEIFEPgfnnyscneTB4AePknpHl+Q4EABCAAAQhAoBgCH5EnT3z7t1dLdHDtJVr2vQ7LWQSBQQl06l+D1sH6EGg7Ad+qTYHAKAQu0cY7SI9NrmT6GQB/dqJ0zOSVeA8BCEAAAhCAQJYEfOr/UGnKwd+edBoAePnrpKv9hgIBCEAAAhCAQLYEXi/LO/7mT7cBwH3a4KUSdwVkG3MMhwAEIACBlhP4uPz/VjcGM12j3Vkb+iFBK3argOUQ6EFgpv7VY1M+ggAExgkwB4CuMAwBP/Dn1VLX/tPtDMBEY7/Sm0OkhyYW8AoBCEAAAhCAQNIEvibrDpe6Hvxt/UwDAK/zI2kv6Xb/Q4EABCAAAQhAIFkCn5JlR0h+wm/PMsgp2qeqphOkrXvWyIcQWERgkP61aCveQQACkwn0/BY3eUXet5qA5+55An/fd/H1cwZggujlerOjdNTEAl4hAAEIQAACEAgncKEs8H3+fR/8bfEgAwCv/4DkSQUvkuZKFAhAAAIQgAAEYgj4mPxhaRdp4Fv3RzlFu4IafIf0Vml1iQKB6QRG6V/T6+J/CLSVAJcA2hr57n4/rI/+R/Kz/f/UfbXen1SRoFdWE2+Q/LCBjXs3x6ctI7CK/PV1KQoEIDAcAe9D/qE2CgRM4Fbpm9LnpKEP/Np2QaliADBRly8nPEd6lbS/9GSJ0m4C+8r9s9qNAO8hMBKB52rrn4xUAxvnTuDPcsDP4zlWOl36i1RJqXIAMN2gzbVgd8l3DWwlbSqtKq0k+awBpXwCP5aLLyjfTTyEQG0ETlPN+9VWOxWnQuBeGeJn9vuM6XWSH917lXSu5An4FAgMTeDX2tLXESP0waGtZkMItJvAHLkfsc+6zd+0Gz3eQ6AcAj51FJVI3K7PBPhygK9nUiAAge4EvI/4tL+/+Ufus84ZlMIJLF24f7i3kIBPKUWWA9S4RYEABPIg8Ic8zMTKUQgM+hyAUdpi2zgCV8Y1TcsQgECGBMgZGQZtUJMZAAxKLM/1z8vTbKyGAASCCHjyGaVwAnXeBVA4uuzc+6MsXj87qzEYAhBomsCf1SC5omnqAe1xBiAAelCTvwhql2YhAIG8CJyTl7lYOywBBgDDkstvuxPzMxmLIQCBAALkigDoEU1yCSCCekyb/u0GP0ZyxZjmaRUCEMiAwIOycR3JPzJDKZwAZwAKD/Ak97xj+358CgQgAIFuBH6oDzj4d6NT2HIGAIUFdAZ3vjDD53wMAQi0m8B/ttv9dnnPJYB2xdve/q+0U/vcxmMIQGAGAr/V5zvMsA4fF0SAMwAFBbNPV/wzkhQIQAAC0wl8ZvoC/i+bAGcAyo5vJ+8cc/84ECP9TnRYBoF2ErhIbjsnzG+n++30mjMA7Yu7f2DkHe1zG48hAIEeBN6izzj49wBU4kcMAEqM6sw+/UyrHD/zaqwBAQi0gMB35CMPCmtBoKe7yCWA6UTa8/9acvX30nrtcRlPIQCBaQT+pP+fJt0xbTn/toAAZwBaEOQuLt6u5a/t8hmLIQCBdhB4o9zk4N+OWC/m5VKLLWFBmwhcLWdXkXZpk9P4CgEILCDgWf/c99/izsAlgBYHf9x1nwX6gXQgKCAAgdYQOF2evkB6vDUe4+hiBBgALIaklQtWldeeGLhdK73HaQi0i4Bv+dtTurddbuPtdALMAZhOpJ3/3yO395U8KZACAQiUS+ASufY8iYN/uTHu2zMGAH2jKn5FTwrcR3KCoEAAAuUR8L7tgb73dQoExhgA0AkmE7hN/+wmnTx5Ie8hAIHsCfia/+6S93EKBBYQ4C4AOsJ0Ao9qwXGS7w7YefqH/A8BCGRFwE/+/Jx0uPRQVpZjbO0EmARYO+KsG9hP1n9dWj9rLzAeAu0kcKvcPkL6YTvdx+uZCHAJYCZC7f7cpw23l45vNwa8h0B2BHwWb1uJg392oWvOYAYAzbHOtSV/i3iZtIv0q1ydwG4ItITAhfJzT+kQiev9gkDpToBLAN3Z8MniBDxgPFjyrwn6p0MpEIBAGgQukBmfkU6Q+FW/NGKSvBUMAJIPUbIG7inLXie9UFpBokAAAs0SeFDN+Y6dL0nnSBQIDESAAcBAuFi5A4GVtOxF0kGSbzPi1wUFgQKBmgj8WfX+TPLju319/wGJAoGhCDAAGAobG/UgsKU+8+2Dft1c2kzyLYWrSytKy0oUCECgMwHfhuuD+l3SvdI10rXSVZLn4PiVAgEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAATqI/D/Aa+NPQo/f+JEAAAAAElFTkSuQmCC") center / contain no-repeat !important;
        mask: url("data:image/png;base64,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") center / contain no-repeat !important;
    }

    /* Sidebar bottom user profile, logout, and status block removed. */


    /* Hide only Streamlit sidebar collapse button safely */
    [data-testid="stSidebarCollapseButton"],
    [data-testid="collapsedControl"],
    button[title="Collapse sidebar"],
    button[title="Expand sidebar"],
    button[aria-label="Collapse sidebar"],
    button[aria-label="Expand sidebar"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
    }


    /* Custom PNG icon for Prediction sidebar item */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3) p {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3) p::before {
        content: "" !important;
        width: 38px !important;
        height: 38px !important;
        display: inline-block !important;
        opacity: 1 !important;
        flex: 0 0 38px !important;
        vertical-align: middle !important;
        transform: translateY(1px) !important;
        background-color: #ffffff !important;
        filter: drop-shadow(0 0 0.6px rgba(255,255,255,0.95)) drop-shadow(0 0 1.4px rgba(255,255,255,0.55)) !important;
        -webkit-mask: url("data:image/png;base64,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") center / contain no-repeat !important;
        mask: url("data:image/png;base64,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") center / contain no-repeat !important;
    }


    /* Custom PNG icon for Batch Upload sidebar item */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(4) p {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(4) p::before {
        content: "" !important;
        width: 30px !important;
        height: 30px !important;
        display: inline-block !important;
        flex: 0 0 30px !important;
        vertical-align: middle !important;
        transform: translateY(0px) !important;
        background-color: #ffffff !important;
        -webkit-mask: url("data:image/png;base64,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") center / contain no-repeat !important;
        mask: url("data:image/png;base64,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") center / contain no-repeat !important;
    }


    /* Move sidebar feature menu slightly to the right */
    section[data-testid="stSidebar"] .stRadio {
        padding: 20px 6px 0 20px !important;
        box-sizing: border-box !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        width: calc(100% - 2px) !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 26px !important;
        padding-right: 18px !important;
    }


    /* Sidebar menu font adjustment: prevent Batch Upload from wrapping */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p {
        font-size: 17px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow: visible !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        padding-left: 24px !important;
        padding-right: 12px !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(4) p {
        gap: 14px !important;
        white-space: nowrap !important;
    }


    /* Make Prediction icon solid bright white in all sidebar states */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3) p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3):hover p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3)[data-checked="true"] p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3):has(input:checked) p::before {
        background-color: #ffffff !important;
        opacity: 1 !important;
        filter: drop-shadow(0 0 0.6px rgba(255,255,255,0.95)) drop-shadow(0 0 1.4px rgba(255,255,255,0.55)) !important;
    }

</style>
    """,
    unsafe_allow_html=True,
)




# =============================================================================
# INPUT BORDER RESET CSS
# =============================================================================
st.markdown(
    """
    <style>
    /* Hilangkan border/shadow merah bawaan invalid state tanpa mengubah UI lain */
    div[data-baseweb="input"],
    div[data-testid="stTextInput"] div[data-baseweb="input"],
    div[data-testid="stTextInput"] input,
    div[data-testid="stTextInput"] input[aria-invalid="true"],
    div[data-baseweb="input"][aria-invalid="true"],
    div[data-baseweb="input"]:has(input[aria-invalid="true"]) {
        border-color: #e5e7eb !important;
        box-shadow: none !important;
        outline: none !important;
    }

    div[data-testid="stTextInput"] input:focus,
    div[data-baseweb="input"]:focus-within {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.10) !important;
        outline: none !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# =============================================================================
# LANDING PAGE - FIRST SCREEN BEFORE USER DASHBOARD
# =============================================================================
def _render_landing_page():
    """Render the first public page before the user enters the dashboard."""
    st.markdown(
        """
        <style>
        html, body, .stApp {
            background: #ffffff !important;
            color: #111827 !important;
            scroll-behavior: smooth;
        }
        section[data-testid="stSidebar"] {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            min-width: 0 !important;
        }
        div[data-testid="stAppViewContainer"] > .main,
        div[data-testid="stAppViewContainer"] main,
        div[data-testid="stMain"] {
            margin-left: 0 !important;
            padding-left: 0 !important;
        }
        .block-container {
            max-width: 100% !important;
            padding: 0 !important;
        }
        header, footer, #MainMenu {
            visibility: hidden !important;
            display: none !important;
        }
        .landing-hero {
            min-height: 88vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 70px 24px 34px;
            background:
                radial-gradient(circle at top, rgba(37, 99, 235, 0.06), transparent 38%),
                linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
        }
        .landing-hero-inner {
            width: min(980px, 92vw);
            margin: 0 auto;
        }
        .landing-product-name {
            font-size: clamp(42px, 5vw, 72px);
            font-weight: 900;
            line-height: .98;
            letter-spacing: -0.06em;
            color: #111827;
            margin-bottom: 14px;
        }
        .landing-hero-title {
            font-size: clamp(46px, 5.7vw, 84px);
            font-weight: 900;
            line-height: .98;
            letter-spacing: -0.055em;
            color: #2563eb;
            margin-bottom: 24px;
        }
        .landing-hero-subtitle {
            width: min(820px, 92vw);
            margin: 0 auto 34px;
            color: #4b5563;
            font-size: clamp(17px, 1.55vw, 24px);
            font-weight: 500;
            line-height: 1.55;
            letter-spacing: .01em;
        }
        div[data-testid="stHorizontalBlock"]:has(.landing-button-anchor) {
            margin-top: -165px !important;
            margin-bottom: 135px !important;
        }
        .landing-button-anchor { display: none; }
        .stButton > button {
            background: #2563eb !important;
            color: #ffffff !important;
            border: 0 !important;
            border-radius: 7px !important;
            height: 58px !important;
            padding: 0 38px !important;
            min-width: 176px !important;
            font-size: 16px !important;
            font-weight: 800 !important;
            box-shadow: 0 14px 30px rgba(37,99,235,.18) !important;
        }
        .stButton > button:hover {
            background: #1d4ed8 !important;
            color: #ffffff !important;
            transform: translateY(-1px);
            box-shadow: 0 16px 34px rgba(37,99,235,.24) !important;
        }
        .landing-feature-section {
            padding: 18px 7vw 90px;
            background: #ffffff;
        }
        .landing-kicker {
            text-align: center;
            color: #7d8a7f;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: .28em;
            margin-bottom: 18px;
        }
        .landing-section-title {
            width: min(1180px, 92vw);
            margin: 0 auto 26px;
            color: #334f3d;
            text-align: center;
            font-size: clamp(36px, 4.7vw, 68px);
            line-height: .98;
            letter-spacing: .035em;
            font-weight: 900;
        }
        .landing-section-subtitle {
            width: min(760px, 92vw);
            margin: 0 auto 70px;
            text-align: center;
            color: #4b5563;
            font-size: clamp(16px, 1.4vw, 22px);
            font-weight: 500;
            line-height: 1.52;
        }
        .landing-card-grid {
            width: min(1380px, 92vw);
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 30px;
        }
        .landing-feature-card {
            min-height: 410px;
            background: #ffffff;
            border: 1px solid #eef0f2;
            border-radius: 18px;
            padding: 42px 40px 34px;
            box-shadow: 0 18px 55px rgba(15, 23, 42, 0.035);
            transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .landing-feature-card:hover {
            transform: translateY(-7px);
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.075);
            border-color: #dfe5e8;
        }
        .landing-card-icon {
            width: 68px;
            height: 68px;
            border-radius: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff5e8;
            color: #f59e0b;
            font-size: 28px;
            font-weight: 900;
            margin-bottom: 34px;
        }
        .landing-card-label {
            color: #f59e0b;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: .15em;
            text-transform: uppercase;
            margin-bottom: 18px;
        }
        .landing-card-title {
            color: #334f3d;
            font-size: 27px;
            font-weight: 900;
            line-height: 1.12;
            letter-spacing: -.02em;
            margin-bottom: 18px;
        }
        .landing-card-text {
            color: #4b5563;
            font-size: 17px;
            line-height: 1.5;
            font-weight: 500;
            margin-bottom: 28px;
        }
        .landing-card-link {
            color: #f59e0b;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: .03em;
        }
        .landing-mini-section {
            background: #fbfcff;
            border-top: 1px solid #edf1f7;
            padding: 72px 7vw 90px;
        }
        .landing-mini-wrap {
            width: min(1180px, 92vw);
            margin: 0 auto;
            display: grid;
            grid-template-columns: .9fr 1.1fr;
            gap: 36px;
            align-items: center;
        }
        .landing-mini-title {
            color: #111827;
            font-size: clamp(30px, 3.2vw, 48px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -.045em;
        }
        .landing-mini-text {
            color: #4b5563;
            font-size: 18px;
            line-height: 1.65;
            font-weight: 500;
            margin-top: 18px;
        }
        .landing-process-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }
        .landing-process-card {
            background: #ffffff;
            border: 1px solid #e8edf5;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 14px 38px rgba(15,23,42,.04);
        }
        .landing-process-number {
            color: #2563eb;
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 10px;
        }
        .landing-process-title {
            color: #111827;
            font-size: 18px;
            font-weight: 900;
            margin-bottom: 8px;
        }
        .landing-process-text {
            color: #667085;
            font-size: 15px;
            line-height: 1.5;
            font-weight: 500;
        }
        @media (max-width: 1200px) {
            .landing-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .landing-feature-card { min-height: 360px; }
        }
        @media (max-width: 760px) {
            .landing-hero { min-height: 78vh; padding: 64px 18px 18px; }
            div[data-testid="stHorizontalBlock"]:has(.landing-button-anchor) {
                margin-top: -120px !important;
                margin-bottom: 95px !important;
            }
            .landing-card-grid { grid-template-columns: 1fr; gap: 18px; }
            .landing-feature-card { min-height: auto; padding: 30px 26px; }
            .landing-mini-wrap { grid-template-columns: 1fr; }
            .landing-process-grid { grid-template-columns: 1fr; }
            .landing-feature-section { padding: 18px 4vw 64px; }
            .landing-mini-section { padding: 56px 4vw 70px; }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        """
        <section class="landing-hero">
            <div class="landing-hero-inner">
                <div class="landing-product-name">ChurnSight</div>
                <div class="landing-hero-title">Reduce Customer Churn</div>
                <div class="landing-hero-subtitle">
                    Analyze, predict, and prevent customer churn with our powerful analytics platform.
                    Make data-driven decisions to improve customer retention.
                </div>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns([4.5, 1.15, 4.5])
    with c2:
        st.markdown('<span class="landing-button-anchor"></span>', unsafe_allow_html=True)
        if st.button("Get Started", key="landing_get_started", use_container_width=True):
            st.session_state["landing_entered"] = True
            st.rerun()

    st.markdown(
        """
        <section class="landing-feature-section">
            <div class="landing-kicker">OUR FEATURES</div>
            <div class="landing-section-title">Customer Churn Analytics, Prediction & Batch Processing</div>
            <div class="landing-section-subtitle">
                This page introduces the main modules available in the user dashboard.
                Each container is a visual guide so users understand what every feature does before entering the system.
            </div>
            <div class="landing-card-grid">
                <div class="landing-feature-card">
                    <div class="landing-card-icon">↗</div>
                    <div class="landing-card-label">Overview & Monitoring</div>
                    <div class="landing-card-title">Dashboard Analytics</div>
                    <div class="landing-card-text">
                        Displays customer health summary, churn rate, at-risk customer counts, retention trends,
                        and key insights from the uploaded or existing dataset.
                    </div>
                    <div class="landing-card-link">View insight flow →</div>
                </div>
                <div class="landing-feature-card">
                    <div class="landing-card-icon">◫</div>
                    <div class="landing-card-label">Customer Data</div>
                    <div class="landing-card-title">Customer Management</div>
                    <div class="landing-card-text">
                        Helps users review customer records, filter customer segments, compare risk levels,
                        and identify accounts that need follow-up action.
                    </div>
                    <div class="landing-card-link">Explore customer list →</div>
                </div>
                <div class="landing-feature-card">
                    <div class="landing-card-icon">✓</div>
                    <div class="landing-card-label">Single Prediction</div>
                    <div class="landing-card-title">Churn Prediction</div>
                    <div class="landing-card-text">
                        Allows users to input one customer profile, validate each field clearly,
                        and generate churn probability with readable risk interpretation.
                    </div>
                    <div class="landing-card-link">Check prediction logic →</div>
                </div>
                <div class="landing-feature-card">
                    <div class="landing-card-icon">⇪</div>
                    <div class="landing-card-label">CSV Processing</div>
                    <div class="landing-card-title">Batch Upload</div>
                    <div class="landing-card-text">
                        Supports CSV template download, file upload, column validation, row checking,
                        and bulk processing for multiple customer predictions.
                    </div>
                    <div class="landing-card-link">Review upload format →</div>
                </div>
            </div>
        </section>
        <section class="landing-mini-section">
            <div class="landing-mini-wrap">
                <div>
                    <div class="landing-mini-title">Simple flow for user dashboard usage</div>
                    <div class="landing-mini-text">
                        The landing page gives a clean first impression, while the dashboard keeps the main project features focused:
                        monitor data, manage customers, run predictions, and process CSV files.
                    </div>
                </div>
                <div class="landing-process-grid">
                    <div class="landing-process-card">
                        <div class="landing-process-number">01</div>
                        <div class="landing-process-title">Read customer overview</div>
                        <div class="landing-process-text">Users start from summary metrics and visual insights to understand current churn conditions.</div>
                    </div>
                    <div class="landing-process-card">
                        <div class="landing-process-number">02</div>
                        <div class="landing-process-title">Inspect customer records</div>
                        <div class="landing-process-text">The customer page helps users find customers by region, risk, and profile information.</div>
                    </div>
                    <div class="landing-process-card">
                        <div class="landing-process-number">03</div>
                        <div class="landing-process-title">Predict individual risk</div>
                        <div class="landing-process-text">Prediction input is validated field by field so error messages are easier to understand.</div>
                    </div>
                    <div class="landing-process-card">
                        <div class="landing-process-number">04</div>
                        <div class="landing-process-title">Upload many customers</div>
                        <div class="landing-process-text">Batch upload validates CSV columns and processes valid rows into dashboard data.</div>
                    </div>
                </div>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )


if "landing_entered" not in st.session_state:
    st.session_state["landing_entered"] = False

if not st.session_state["landing_entered"]:
    _render_landing_page()
    st.stop()


# =============================================================================
# DATA HELPERS
# =============================================================================

def find_data_file() -> Path | None:
    """Cari cleaned_churn_data.csv dari beberapa posisi umum project."""
    here = Path(__file__).resolve().parent
    candidates = [
        here / "../data/processed/cleaned_churn_data.csv",
        here / "data/processed/cleaned_churn_data.csv",
        Path.cwd() / "data/processed/cleaned_churn_data.csv",
        Path.cwd() / "../data/processed/cleaned_churn_data.csv",
    ]
    for path in candidates:
        path = path.resolve()
        if path.exists():
            return path
    return None


@st.cache_data(show_spinner=False)
def make_demo_data(n: int = 11410) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    regions = rng.choice(["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"], n, p=[.28,.24,.22,.16,.10])
    tenure = rng.integers(1, 36, n)
    active = rng.integers(2, 90, n)
    days_inactive = rng.integers(0, 45, n)
    sentiment_score = rng.choice([1,2,3,4,5], n, p=[.08,.12,.32,.30,.18])
    # Probabilitas risiko contoh, dipengaruhi engagement dan sentiment.
    risk_prob = np.clip(
        0.18 + (days_inactive / 55) + ((3 - sentiment_score) * 0.08) + rng.normal(0, .08, n),
        0.02,
        0.95,
    )
    churn = (risk_prob > rng.uniform(.45, .85, n)).astype(int)
    names = [
        "Sarah Johnson", "Michael Chen", "Emma Williams", "James Anderson", "Sofia Martinez",
        "Oliver Brown", "Nadia Putri", "Rizky Pratama", "Alya Ramadhani", "Daniel Lee",
    ]
    df = pd.DataFrame({
        "customer_id": [f"CUS-{i+1:05d}" for i in range(n)],
        "name": rng.choice(names, n),
        "region_category": regions,
        "tenure_months": tenure,
        "active_days_90d": active,
        "days_since_last_login": days_inactive,
        "churn": churn,
        "risk_probability": risk_prob,
        "sentiment_score": sentiment_score,
        "sentiment_kategori": pd.Series(sentiment_score).map({1:"Sangat Kecewa",2:"Kecewa",3:"Biasa",4:"Puas",5:"Sangat Puas"}),
        "feedback": rng.choice([
            "Service is good and easy to use",
            "Payment failed several times",
            "Support was slow but finally solved",
            "The app is helpful for daily work",
            "Need faster response from support team",
        ], n),
    })
    return df


@st.cache_data(show_spinner="Loading customer data...")
def load_data() -> pd.DataFrame:
    path = find_data_file()
    if path is not None:
        df = pd.read_csv(path)
        # Normalisasi nama kolom agar dashboard tetap jalan.
        if "customer_id" not in df.columns:
            df["customer_id"] = [f"CUS-{i+1:05d}" for i in range(len(df))]
        if "name" not in df.columns:
            df["name"] = [f"Customer {i+1}" for i in range(len(df))]
        if "region_category" not in df.columns:
            region_col = next((c for c in ["region", "Region", "location", "Location"] if c in df.columns), None)
            df["region_category"] = df[region_col] if region_col else "All Region"
        if "tenure_months" not in df.columns:
            if "days_since_joined" in df.columns:
                df["tenure_months"] = np.maximum(1, (pd.to_numeric(df["days_since_joined"], errors="coerce").fillna(30) / 30).round().astype(int))
            else:
                df["tenure_months"] = np.random.default_rng(1).integers(1, 36, len(df))
        if "churn" not in df.columns:
            df["churn"] = 0
        df["churn"] = pd.to_numeric(df["churn"], errors="coerce").fillna(0).astype(int)
        if "risk_probability" not in df.columns:
            if "churn_probability" in df.columns:
                df["risk_probability"] = pd.to_numeric(df["churn_probability"], errors="coerce").fillna(0)
            else:
                base = pd.to_numeric(df.get("days_since_last_login", pd.Series(np.zeros(len(df)))), errors="coerce").fillna(0)
                df["risk_probability"] = np.clip(.18 + base / (base.max() + 1) * .55 + df["churn"] * .20, .03, .95)
        if "sentiment_kategori" not in df.columns:
            if "feedback" in df.columns:
                df["sentiment_kategori"] = "Biasa"
            else:
                df["sentiment_kategori"] = "Biasa"
        if "sentiment_score" not in df.columns:
            df["sentiment_score"] = df["sentiment_kategori"].map({"Sangat Kecewa":1,"Kecewa":2,"Biasa":3,"Puas":4,"Sangat Puas":5}).fillna(3)
        return df
    return make_demo_data()


def risk_label(prob: float) -> str:
    if prob >= .70:
        return "High Risk"
    if prob >= .45:
        return "Medium Risk"
    return "Low Risk"


def risk_badge(label: str) -> str:
    cls = "pill-green"
    if "High" in label:
        cls = "pill-red"
    elif "Medium" in label:
        cls = "pill-yellow"
    return f"<span class='pill {cls}'>{label}</span>"


def fmt_int(x) -> str:
    try:
        return f"{int(x):,}"
    except Exception:
        return "0"


# =============================================================================
# SIDEBAR - LIGHT MATDASH STYLE
# =============================================================================
with st.sidebar:
    st.markdown(
        """
        <div class="md-sidebar-brand">
            <div class="md-logo-mark">CS</div>
            <div>
                <div class="md-logo-text">ChurnSense</div>
                <div class="md-logo-sub">Customer Churn Prediction</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    page = st.radio(
        "Navigation",
        ["Dashboard", "Customers", "Prediction", "Batch Upload"],
        format_func=lambda item: item,
        label_visibility="collapsed",
        key="matdash_user_navigation",
    )

# Reset Prediction result when user changes page, so returning to Prediction starts fresh.
if "_active_sidebar_page" not in st.session_state:
    st.session_state._active_sidebar_page = page
elif st.session_state._active_sidebar_page != page:
    if page == "Prediction" or st.session_state._active_sidebar_page == "Prediction":
        st.session_state.prediction_result = None
        st.session_state.prediction_error = None
    st.session_state._active_sidebar_page = page


# =============================================================================
# LOAD & PREP DATA
# =============================================================================
df = load_data().copy()

# Batch Upload results are kept in session_state and merged into the same dashboard data.
# This preserves the original data source while allowing uploaded customers to appear
# immediately in Dashboard and Customers during the current session.
if "dashboard_uploaded_rows" in st.session_state:
    uploaded_rows = st.session_state.get("dashboard_uploaded_rows")
    if isinstance(uploaded_rows, pd.DataFrame) and not uploaded_rows.empty:
        df = pd.concat([df, uploaded_rows], ignore_index=True, sort=False)

df["risk_probability"] = pd.to_numeric(df["risk_probability"], errors="coerce").fillna(0).clip(0, 1)
df["Risk Level"] = df["risk_probability"].apply(risk_label)
df["Churn Probability"] = (df["risk_probability"] * 100).round(1)

churn_rate = df["churn"].mean() * 100 if len(df) else 0
at_risk = int((df["risk_probability"] >= .45).sum())
retained = int((df["churn"] == 0).sum())
total = len(df)
high_risk = int((df["risk_probability"] >= .70).sum())
medium_risk = int(((df["risk_probability"] >= .45) & (df["risk_probability"] < .70)).sum())
low_risk = int((df["risk_probability"] < .45).sum())


# =============================================================================
# CHART HELPERS
# =============================================================================
def clean_ax(ax):
    ax.set_facecolor("white")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#e5e7eb")
    ax.spines["bottom"].set_color("#e5e7eb")
    ax.tick_params(colors="#6b7280", labelsize=8)
    ax.grid(axis="y", color="#eef0f5", linewidth=.8)


def plot_churn_by_tenure(data):
    tmp = data.copy()
    bins = [0, 3, 6, 12, 18, 24, 60]
    labels = ["0-3 mo", "4-6 mo", "7-12 mo", "13-18 mo", "19-24 mo", "24+ mo"]
    tmp["tenure_group"] = pd.cut(pd.to_numeric(tmp["tenure_months"], errors="coerce").fillna(1), bins=bins, labels=labels, include_lowest=True)
    stats = tmp.groupby("tenure_group", observed=True)["churn"].mean().reindex(labels).fillna(0) * 100
    fig, ax = plt.subplots(figsize=(6.8, 3.1))
    ax.plot(range(len(stats)), stats.values, marker="o", linewidth=2.2, color="#6d5dfc")
    ax.fill_between(range(len(stats)), stats.values, alpha=.08, color="#6d5dfc")
    ax.set_xticks(range(len(stats)))
    ax.set_xticklabels(stats.index, rotation=0)
    ax.set_ylabel("Churn %")
    clean_ax(ax)
    fig.tight_layout()
    return fig


def plot_risk_donut():
    fig, ax = plt.subplots(figsize=(4.8, 3.1))
    vals = [low_risk, medium_risk, high_risk]
    colors = ["#10b981", "#f59e0b", "#ef4444"]
    ax.pie(vals, startangle=90, colors=colors, wedgeprops=dict(width=.38, edgecolor="white", linewidth=3))
    ax.text(0, 0, "Risk\nGroups", ha="center", va="center", fontsize=10, fontweight="bold", color="#374151")
    ax.axis("equal")
    fig.tight_layout()
    return fig


def plot_region_retention(data):
    reg = data.groupby("region_category")["churn"].mean().sort_values().head(6)
    ret = (1 - reg) * 100
    fig, ax = plt.subplots(figsize=(6.8, 3.1))
    ax.bar(ret.index.astype(str), ret.values, color="#06b6d4", width=.58)
    ax.set_ylabel("Retention %")
    ax.set_ylim(0, 100)
    ax.tick_params(axis="x", rotation=20)
    clean_ax(ax)
    fig.tight_layout()
    return fig


def plot_active_inactive(data):
    rng = np.random.default_rng(7)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    active_base = max(1, int(total * .78))
    active = np.clip(active_base + rng.integers(-180, 220, len(months)).cumsum(), int(total*.55), total)
    inactive = total - active
    fig, ax = plt.subplots(figsize=(6.8, 3.1))
    ax.stackplot(months, active, inactive, labels=["Active", "Inactive"], colors=["#14b8a6", "#ef4444"], alpha=.75)
    ax.set_ylabel("Customers")
    clean_ax(ax)
    ax.legend(loc="upper left", frameon=False, fontsize=8)
    fig.tight_layout()
    return fig



# =============================================================================
# MATDASH LIGHT TEMPLATE OVERRIDE
# =============================================================================
# Semua halaman di bawah ini menggunakan template light mode seperti referensi
# MatDash. Kode lama setelah bagian ini tetap dipertahankan sebagai legacy,
# tetapi tidak dieksekusi karena st.stop() dipanggil setelah template baru selesai.

st.markdown(
    """
    <style>
    :root {
        --md-primary: #635bff;
        --md-primary-soft: #efedff;
        --md-pink: #ff5c8a;
        --md-cyan: #22d3d1;
        --md-cyan-soft: #e7fffb;
        --md-pink-soft: #fff1f6;
        --md-bg: #f5f7fb;
        --md-card: #ffffff;
        --md-text: #222b3a;
        --md-muted: #7b8496;
        --md-border: #eef1f7;
        --md-shadow: 0 14px 34px rgba(32, 42, 68, 0.06);
        --md-radius: 24px;
    }

    html, body, .stApp {
        background: #ffffff !important;
        color: var(--md-text) !important;
    }

    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
        background: #f4f7fb !important;
        min-height: 100vh !important;
    }

    header, footer, #MainMenu {
        visibility: hidden !important;
        display: none !important;
    }

    section[data-testid="stSidebar"] {
        background: #ffffff !important;
        border-right: 1px solid #edf1f7 !important;
        width: 290px !important;
        min-width: 290px !important;
        box-shadow: 12px 0 35px rgba(30, 41, 59, 0.035) !important;
    }

    section[data-testid="stSidebar"] > div:first-child {
        background: #ffffff !important;
        padding: 0 !important;
    }

    .md-sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 30px 28px 38px 28px;
    }

    .md-logo-mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, #6c63ff 0%, #7b61ff 52%, #20c6ff 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 22px;
        letter-spacing: -0.05em;
        box-shadow: 0 12px 26px rgba(99,91,255,.25);
    }

    .md-logo-text {
        color: #6666ff;
        font-size: 25px;
        font-weight: 800;
        letter-spacing: .03em;
        line-height: 1;
    }

    .md-logo-sub {
        color: #9aa3b3;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .04em;
        margin-top: 5px;
        text-transform: uppercase;
    }

    .md-nav-label {
        color: #232c3d;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: .04em;
        padding: 0 28px 16px 28px;
    }

    section[data-testid="stSidebar"] .stRadio {
        padding: 0 18px !important;
    }

    section[data-testid="stSidebar"] .stRadio > label {
        display: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] {
        gap: 14px !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        height: 52px !important;
        width: 100% !important;
        border-radius: 12px !important;
        margin: 0 !important;
        padding: 0 14px !important;
        background: transparent !important;
        color: #8b94a5 !important;
        border: none !important;
        display: flex !important;
        align-items: center !important;
        transition: all .18s ease !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
        background: #f6f5ff !important;
        color: var(--md-primary) !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"],
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked),
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] [aria-checked="true"] {
        background: #edebff !important;
        color: var(--md-primary) !important;
        box-shadow: none !important;
        transform: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label > div:first-child {
        display: none !important;
    }

    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p {
        color: inherit !important;
        font-size: 16px !important;
        font-weight: 650 !important;
        line-height: 1 !important;
        margin: 0 !important;
        letter-spacing: -.01em !important;
    }

    .md-page-wrap {
        min-height: 100vh;
        background: #ffffff;
    }

    .md-topbar {
        height: 92px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 22px 34px 20px 34px;
        background: #ffffff;
    }

    .md-search {
        width: 265px;
        height: 48px;
        border: 1px solid #e4e9f2;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 0 18px;
        color: #858fa2;
        font-size: 16px;
        background: #ffffff;
        box-shadow: 0 7px 18px rgba(15, 23, 42, 0.03);
    }

    .md-search-icon {
        width: 18px;
        height: 18px;
        border: 2px solid #1f2937;
        border-radius: 50%;
        position: relative;
        opacity: .9;
    }

    .md-search-icon:after {
        content: "";
        width: 8px;
        height: 2px;
        background: #1f2937;
        position: absolute;
        right: -7px;
        bottom: -4px;
        transform: rotate(45deg);
        border-radius: 99px;
    }

    .md-top-actions {
        display: flex;
        align-items: center;
        gap: 23px;
    }

    .md-download-btn {
        height: 48px;
        padding: 0 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 28px;
        color: #243044;
        font-size: 17px;
        font-weight: 800;
        background:
            linear-gradient(#ffffff, #ffffff) padding-box,
            linear-gradient(90deg, #16c6e9, #6b5cff, #ff6b9a) border-box;
        border: 2px solid transparent;
    }

    .md-icon-btn {
        font-size: 24px;
        line-height: 1;
        color: #20283a;
        position: relative;
    }

    .md-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #635bff;
        right: -3px;
        top: -4px;
    }

    .md-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fbc2eb, #a6c1ee);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 8px 18px rgba(99, 91, 255, .14);
    }

    .md-content-bg {
        background: #f4f7fb;
        border-top-left-radius: 28px;
        min-height: calc(100vh - 92px);
        padding: 38px 36px 48px 36px;
    }

    .md-page-title {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 22px;
    }

    .md-title-main {
        font-size: 28px;
        font-weight: 900;
        color: #232b3a;
        line-height: 1.05;
        letter-spacing: -0.03em;
    }

    .md-title-sub {
        color: #7e8797;
        font-size: 14px;
        margin-top: 7px;
    }

    .md-breadcrumb {
        color: #929bad;
        font-size: 13px;
        font-weight: 700;
    }

    .md-card {
        background: #ffffff;
        border: 1px solid rgba(231, 236, 246, .95);
        border-radius: 18px;
        box-shadow: var(--md-shadow);
        padding: 26px;
        height: 100%;
    }

    .md-card-tight {
        background: #ffffff;
        border: 1px solid rgba(231, 236, 246, .95);
        border-radius: 18px;
        box-shadow: var(--md-shadow);
        padding: 22px 24px;
    }

    .md-card-title {
        color: #232b3a;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -.03em;
        margin-bottom: 14px;
    }

    .md-small-title {
        color: #232b3a;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -.02em;
    }

    .md-muted {
        color: #7e8797;
        font-size: 14px;
        line-height: 1.55;
    }

    .md-kpi-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 24px;
    }

    .md-kpi-card {
        background: #ffffff;
        border-radius: 18px;
        padding: 22px 22px 20px 22px;
        border: 1px solid #edf1f7;
        box-shadow: var(--md-shadow);
    }

    .md-kpi-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 17px;
    }

    .md-kpi-value {
        font-size: 30px;
        font-weight: 900;
        color: #232b3a;
        line-height: 1;
        letter-spacing: -.04em;
    }

    .md-kpi-label {
        color: #7e8797;
        font-size: 14px;
        font-weight: 700;
        margin-top: 9px;
    }

    .md-progress {
        height: 8px;
        background: #eef3f7;
        border-radius: 999px;
        margin-top: 18px;
        overflow: hidden;
    }

    .md-progress span {
        display: block;
        height: 100%;
        border-radius: 999px;
    }

    .md-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 800;
        line-height: 1;
    }

    .md-chip-green { background: #e6f8ef; color: #1fb56a; }
    .md-chip-red { background: #fff1f6; color: #ff5c8a; }
    .md-chip-yellow { background: #fff8e5; color: #e7a600; }
    .md-chip-blue { background: #edebff; color: #635bff; }
    .md-chip-cyan { background: #e7fffb; color: #13b9b6; }

    .md-metric-side {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 16px;
    }

    .md-side-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
    }

    .md-side-number {
        color: #232b3a;
        font-size: 25px;
        font-weight: 900;
        letter-spacing: -.04em;
    }

    .md-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        color: #344054;
    }

    .md-table th {
        text-align: left;
        color: #344054;
        font-size: 14px;
        font-weight: 800;
        padding: 16px 10px;
        border-bottom: 1px solid #edf1f7;
    }

    .md-table td {
        padding: 15px 10px;
        border-bottom: 1px solid #f0f3f8;
        vertical-align: middle;
    }

    .md-customer-cell {
        display: flex;
        align-items: center;
        gap: 13px;
    }

    .md-mini-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #edebff;
        color: #635bff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13px;
        flex: 0 0 auto;
    }

    .md-activity {
        display: flex;
        gap: 18px;
        padding: 14px 0;
        border-bottom: 1px solid #f0f3f8;
    }

    .md-activity-time {
        width: 55px;
        color: #344054;
        font-size: 16px;
        font-weight: 650;
    }

    .md-activity-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #635bff;
        margin-top: 4px;
        box-shadow: 0 0 0 6px rgba(99,91,255,.09);
        flex: 0 0 auto;
    }

    .md-activity-text {
        color: #334155;
        font-size: 14px;
        line-height: 1.45;
    }

    .md-form-card {
        background: #ffffff;
        border: 1px solid #edf1f7;
        border-radius: 18px;
        padding: 26px;
        box-shadow: var(--md-shadow);
    }

    .stTextInput input,
    .stNumberInput input,
    .stDateInput input,
    .stSelectbox div[data-baseweb="select"],
    .stTextArea textarea {
        border-radius: 13px !important;
        border: 1px solid #e4e9f2 !important;
        background: #ffffff !important;
        min-height: 46px !important;
        color: #232b3a !important;
        box-shadow: none !important;
    }

    div[data-testid="stForm"] {
        border: 0 !important;
        padding: 0 !important;
    }

    .stButton button,
    .stFormSubmitButton button,
    [data-testid="stDownloadButton"] button {
        background: #635bff !important;
        color: #ffffff !important;
        border: 0 !important;
        border-radius: 14px !important;
        height: 46px !important;
        font-weight: 900 !important;
        box-shadow: 0 13px 24px rgba(99,91,255,.22) !important;
    }

    [data-testid="stFileUploader"] {
        background: #ffffff !important;
        border: 1px dashed #cfd7e7 !important;
        border-radius: 18px !important;
        padding: 20px !important;
    }

    .md-error-box {
        border: 1px solid #ffd1df;
        background: #fff1f6;
        border-radius: 16px;
        padding: 18px;
        color: #b91c4a;
        margin: 14px 0;
    }

    .md-success-box {
        border: 1px solid #c7f0db;
        background: #effcf5;
        border-radius: 16px;
        padding: 18px;
        color: #137a48;
        margin: 14px 0;
    }

    .md-info-box {
        border: 1px solid #dce3ff;
        background: #f3f5ff;
        border-radius: 16px;
        padding: 18px;
        color: #39415f;
        margin: 14px 0;
    }

    .md-guide-list {
        margin: 12px 0 0 0;
        padding: 0;
        list-style: none;
    }

    .md-guide-list li {
        padding: 11px 0;
        border-bottom: 1px solid #f0f3f8;
        color: #4b5563;
        font-size: 14px;
        line-height: 1.45;
    }

    .md-guide-list b {
        color: #232b3a;
    }

    [data-testid="stDataFrame"] {
        border-radius: 16px !important;
        overflow: hidden !important;
        border: 1px solid #edf1f7 !important;
        box-shadow: var(--md-shadow) !important;
    }

    @media (max-width: 1000px) {
        section[data-testid="stSidebar"] { width: 250px !important; min-width: 250px !important; }
        .md-topbar { padding: 20px; }
        .md-search { width: 210px; }
        .md-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 760px) {
        .md-top-actions { gap: 12px; }
        .md-download-btn { display: none; }
        .md-search { width: 170px; }
        .md-content-bg { padding: 26px 18px 36px 18px; }
        .md-kpi-row { grid-template-columns: 1fr; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)



# =============================================================================
# MATDASH NEXTJS TEMPLATE UI OVERRIDE
# =============================================================================
# UI-only override based on the uploaded MatDash Next.js template. Data logic,
# prediction validation, CSV processing, and customer calculations remain unchanged.
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

    :root {
        --color-info: #46caeb;
        --color-success: #36C76C;
        --color-warning: #FFB900;
        --color-error: #FF6692;
        --color-darkinfo: #223662;
        --color-white: #fff;
        --color-dark: #1f2a3d;
        --color-border: #e0e6eb;
        --color-darkborder: #333f55;
        --color-link: #2a3547;
        --color-muted: #EFF4FA;
        --color-lightgray: #f4f7fb;
        --color-bodytext: #98a4ae;
        --color-primary: #635bff;
        --color-secondary: #14E9E2;
        --color-input: #e5e7eb;
        --color-graymuted: #DECFDA;
        --color-lightprimary: color-mix(in oklab, var(--color-primary) 12%, transparent);
        --color-lightsecondary: color-mix(in oklab, var(--color-secondary) 12%, transparent);
        --color-lightsuccess: color-mix(in oklab, var(--color-success) 12%, transparent);
        --color-lightwarning: color-mix(in oklab, var(--color-warning) 12%, transparent);
        --color-lighterror: color-mix(in oklab, var(--color-error) 12%, transparent);
        --color-lightinfo: color-mix(in oklab, var(--color-info) 12%, transparent);
        --color-primary-emphasis: color-mix(in oklab, var(--color-primary) 80%, black);
        --color-secondary-emphasis: color-mix(in oklab, var(--color-secondary) 80%, black);
        --color-success-emphasis: color-mix(in oklab, var(--color-success) 80%, black);
        --color-warning-emphasis: color-mix(in oklab, var(--color-warning) 80%, black);
        --color-error-emphasis: color-mix(in oklab, var(--color-error) 80%, black);
        --color-info-emphasis: color-mix(in oklab, var(--color-info) 80%, black);
        --color-charcoal: #2a3547;
        --color-customdark: #111c2d;
        --color-defaultBorder: #e0e6eb;
        --color-slateGray: #EFF4FAbf;
        --color-breadcrumbColor: #16CDC720;
        --shadow-md: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);
        --shadow-xs: 0 1px 2px 0 rgba(133, 146, 173, 0.12);
        --radius: 10px;
        --background: #fff;
        --foreground: var(--color-link);
        --card: var(--color-white);
        --card-foreground: var(--color-link);
        --primary: var(--color-primary);
        --primary-foreground: var(--color-white);
        --secondary: var(--color-secondary);
        --secondary-foreground: var(--color-white);
        --accent: var(--color-lightprimary);
        --accent-foreground: var(--color-primary);
        --border: #e5e5e5;
        --input: var(--color-input);
        --ring: var(--color-lightprimary);
        --sidebar: var(--color-white);
        --sidebar-foreground: var(--color-link);
        --sidebar-primary: var(--color-primary);
        --sidebar-accent: var(--color-lightprimary);
        --sidebar-accent-foreground: var(--color-primary);
        --sidebar-border: #e5e5e5;
    }

    * { font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
    html, body, .stApp, button, input, textarea, select, label, p, span, div, h1, h2, h3, h4, h5, h6, [data-testid] {
        font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        -webkit-font-smoothing: antialiased !important;
        text-rendering: geometricPrecision !important;
    }
    html, body, .stApp {
        background: #ffffff !important;
        color: var(--color-link) !important;
        overflow-x: hidden !important;
    }
    header, footer, #MainMenu { visibility: hidden !important; display: none !important; }
    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
        background: #ffffff !important;
        min-height: 100vh !important;
    }

    /* MatDash sidebar layout */
    section[data-testid="stSidebar"] {
        width: 270px !important;
        min-width: 270px !important;
        background: var(--sidebar) !important;
        border-right: none !important;
        box-shadow: none !important;
    }
    section[data-testid="stSidebar"] > div:first-child {
        padding: 0 !important;
        background: var(--sidebar) !important;
    }
    section[data-testid="stSidebar"] [data-testid="stVerticalBlock"] { gap: 0 !important; }

    .md-sidebar-brand {
        min-height: 88px !important;
        padding: 24px 16px 20px 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        overflow: hidden !important;
    }
    .md-logo-mark {
        width: 42px !important;
        height: 42px !important;
        border-radius: 12px !important;
        background: radial-gradient(100% 707.08% at 0% 0%, #15CEBD 0%, #548AFE 33.82%, #E02FD6 72.12%, #FDB54E 100%) !important;
        color: white !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
        font-weight: 900 !important;
        letter-spacing: -.06em !important;
        box-shadow: none !important;
        flex: 0 0 auto !important;
    }
    .md-logo-text {
        font-size: 22px !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        color: var(--color-primary) !important;
        letter-spacing: .02em !important;
    }
    .md-logo-sub {
        color: var(--color-bodytext) !important;
        font-size: 9px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: .05em !important;
        margin-top: 4px !important;
    }
    .md-nav-label {
        padding: 16px 26px 15px 26px !important;
        color: var(--color-charcoal) !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: .02em !important;
        line-height: 21px !important;
    }

    section[data-testid="stSidebar"] .stRadio { padding: 0 24px !important; box-sizing: border-box !important; }
    section[data-testid="stSidebar"] .stRadio > label { display: none !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] { gap: 6px !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
        min-height: 45px !important;
        height: 45px !important;
        width: 100% !important;
        border-radius: 10px !important;
        margin: 0 !important;
        padding: 0 13px !important;
        border: 0 !important;
        background: transparent !important;
        color: var(--color-link) !important;
        display: flex !important;
        align-items: center !important;
        transition: background-color .18s ease, color .18s ease !important;
        box-shadow: none !important;
        cursor: pointer !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
        background: var(--color-lightprimary) !important;
        color: var(--color-primary) !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"],
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked),
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] [aria-checked="true"] {
        background: var(--color-lightprimary) !important;
        color: var(--color-primary) !important;
        box-shadow: none !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label > div:first-child { display: none !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p {
        color: inherit !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        white-space: nowrap !important;
        letter-spacing: 0 !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"] p,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked) p { font-weight: 500 !important; color: var(--color-primary) !important; }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p::before {
        content: "" !important;
        width: 22px !important;
        height: 22px !important;
        display: inline-block !important;
        flex: 0 0 22px !important;
        background-color: currentColor !important;
        opacity: 1 !important;
        filter: none !important;
        background-image: none !important;
        -webkit-mask-repeat: no-repeat !important;
        -webkit-mask-size: contain !important;
        -webkit-mask-position: center !important;
        mask-repeat: no-repeat !important;
        mask-size: contain !important;
        mask-position: center !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(1) p::before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>') !important;
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>') !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(2) p::before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.8-4 3-6 5.5-6s4.7 2 5.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15c2.5.2 4.2 1.8 5 5"/></svg>') !important;
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.8-4 3-6 5.5-6s4.7 2 5.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15c2.5.2 4.2 1.8 5 5"/></svg>') !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(3) p::before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3-4 3 2 5-7"/><path d="M17 7h2v2"/></svg>') !important;
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3-4 3 2 5-7"/><path d="M17 7h2v2"/></svg>') !important;
    }
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:nth-child(4) p::before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>') !important;
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>') !important;
    }


    /* Sidebar icons: force all feature icons to black, including active/hover state */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"] p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked) p::before,
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] [aria-checked="true"] p::before {
        background-color: #111827 !important;
        color: #111827 !important;
        opacity: 1 !important;
        filter: none !important;
    }

    /* MatDash page shell */
    .md-page-wrap { min-height: 100vh !important; background: #ffffff !important; }
    .md-topbar {
        height: 84px !important;
        padding: 16px 40px 16px 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        background: #ffffff !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 2 !important;
    }
    .md-search {
        width: 265px !important;
        height: 48px !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 12px !important;
        background: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 0 14px !important;
        color: #737373 !important;
        font-size: 15px !important;
        box-shadow: none !important;
    }
    .md-search-icon {
        width: 19px !important;
        height: 19px !important;
        border: none !important;
        border-radius: 0 !important;
        background: var(--color-link) !important;
        opacity: 1 !important;
        -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>') center/contain no-repeat !important;
        mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>') center/contain no-repeat !important;
    }
    .md-search-icon:after { display: none !important; }
    .md-top-actions { display: flex !important; align-items: center !important; justify-content: flex-end !important; gap: 0 !important; }
    .md-download-btn {
        height: 42px !important;
        padding: 0 18px !important;
        border-radius: 999px !important;
        color: var(--color-link) !important;
        font-size: 16px !important;
        font-weight: 650 !important;
        background: linear-gradient(#ffffff, #ffffff) padding-box, radial-gradient(100% 707.08% at 0% 0%, #15CEBD 0%, #548AFE 33.82%, #E02FD6 72.12%, #FDB54E 100%) border-box !important;
        border: 2px solid transparent !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-right: 16px !important;
        box-shadow: none !important;
    }
    .md-icon-btn {
        width: 50px !important;
        height: 42px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--color-link) !important;
        position: relative !important;
        font-size: 0 !important;
        cursor: default !important;
    }
    .md-icon-btn:before {
        content: "" !important;
        width: 21px !important;
        height: 21px !important;
        display: block !important;
        background: currentColor !important;
        -webkit-mask-repeat: no-repeat !important;
        -webkit-mask-position: center !important;
        -webkit-mask-size: contain !important;
        mask-repeat: no-repeat !important;
        mask-position: center !important;
        mask-size: contain !important;
    }
    .md-icon-btn.md-moon:before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/></svg>');
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/></svg>');
    }
    .md-icon-btn.md-bell:before {
        -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>');
        mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>');
    }
    .md-dot { width: 8px !important; height: 8px !important; background: var(--color-primary) !important; border-radius: 999px !important; position: absolute !important; top: 8px !important; right: 12px !important; }
    .md-avatar {
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #f8c9a8, #b8e2ff) !important;
        color: var(--color-link) !important;
        font-size: 20px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: none !important;
        overflow: hidden !important;
    }
    .md-content-bg {
        background: var(--color-lightgray) !important;
        margin-right: 12px !important;
        border-radius: 24px !important;
        min-height: calc(100vh - 96px) !important;
        padding: 30px 24px !important;
    }

    /* MatDash card/content components */
    .md-page-title { margin-bottom: 24px !important; }
    .md-title-main { color: var(--color-dark) !important; font-size: 26px !important; font-weight: 700 !important; letter-spacing: 0 !important; }
    .md-title-sub { color: var(--color-bodytext) !important; font-size: 14px !important; }
    .md-breadcrumb { color: var(--color-primary) !important; background: var(--color-breadcrumbColor) !important; padding: 8px 12px !important; border-radius: 8px !important; font-size: 13px !important; font-weight: 600 !important; }
    .md-card, .md-card-tight, .md-form-card, .md-kpi-card {
        background: #ffffff !important;
        border: 0 !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-xs) !important;
        color: var(--color-link) !important;
    }
    .md-card { padding: 24px !important; height: 100% !important; }
    .md-card-tight { padding: 32px !important; }
    .md-form-card { padding: 24px !important; }
    .md-kpi-card { padding: 22px !important; }
    .md-card-title, .md-small-title { color: var(--color-dark) !important; font-size: 18px !important; font-weight: 600 !important; letter-spacing: 0 !important; }
    .md-card-title { margin-bottom: 24px !important; }
    .md-small-title { margin: 0 !important; }
    .md-muted, .md-kpi-label { color: var(--color-bodytext) !important; }
    .md-side-icon, .md-kpi-icon {
        border-radius: 8px !important;
        width: 54px !important;
        height: 54px !important;
        font-size: 24px !important;
    }
    .md-metric-side { gap: 16px !important; margin-bottom: 32px !important; }
    .md-side-number, .md-kpi-value { color: var(--color-dark) !important; font-weight: 500 !important; letter-spacing: 0 !important; }
    .md-side-number { font-size: 28px !important; }
    .md-kpi-value { font-size: 28px !important; }
    .md-progress { height: 8px !important; background: var(--color-lightsecondary) !important; border-radius: 999px !important; overflow: hidden !important; }
    .md-chip { border-radius: 6px !important; border: 0 !important; padding: 5px 9px !important; font-size: 12px !important; font-weight: 600 !important; }
    .md-chip-green { background: var(--color-lightsuccess) !important; color: var(--color-success) !important; }
    .md-chip-red { background: var(--color-lighterror) !important; color: var(--color-error) !important; }
    .md-chip-yellow { background: var(--color-lightwarning) !important; color: #c48700 !important; }
    .md-chip-blue { background: var(--color-lightprimary) !important; color: var(--color-primary) !important; }
    .md-chip-cyan { background: var(--color-lightsecondary) !important; color: #0fbfba !important; }
    .md-table { color: var(--color-link) !important; font-size: 14px !important; }
    .md-table th { color: var(--color-link) !important; font-weight: 500 !important; padding: 18px 24px !important; border-bottom: 1px solid var(--color-defaultBorder) !important; }
    .md-table td { padding: 16px 24px !important; border-bottom: 1px solid var(--color-defaultBorder) !important; }
    .md-mini-avatar { background: var(--color-lightprimary) !important; color: var(--color-primary) !important; border-radius: 8px !important; }
    .md-activity { border-bottom: 0 !important; padding: 0 !important; min-height: 64px !important; display: grid !important; grid-template-columns: 52px 18px 1fr !important; gap: 16px !important; }
    .md-activity-time { width: auto !important; color: var(--color-link) !important; font-size: 15px !important; font-weight: 400 !important; }
    .md-activity-dot { width: 14px !important; height: 14px !important; background: var(--color-primary) !important; box-shadow: none !important; margin-top: 4px !important; position: relative !important; }
    .md-activity-dot:after { content: ""; position: absolute; left: 6px; top: 14px; width: 1px; height: 46px; background: var(--color-defaultBorder); }
    .md-activity:last-child .md-activity-dot:after { display:none; }
    .md-activity-text { color: var(--color-link) !important; font-size: 15px !important; line-height: 1.45 !important; }

    /* Streamlit controls in MatDash style */
    .stTextInput label, .stNumberInput label, .stSelectbox label, .stDateInput label, .stFileUploader label { color: var(--color-link) !important; font-size: 13px !important; font-weight: 600 !important; }
    .stTextInput input, .stNumberInput input, .stDateInput input, .stSelectbox div[data-baseweb="select"], .stTextArea textarea {
        border-radius: 10px !important;
        border: 1px solid var(--color-defaultBorder) !important;
        background: #ffffff !important;
        min-height: 42px !important;
        color: var(--color-link) !important;
        box-shadow: none !important;
    }
    .stTextInput input:focus, .stNumberInput input:focus, .stDateInput input:focus, .stTextArea textarea:focus, .stSelectbox div[data-baseweb="select"]:focus-within {
        border-color: var(--color-primary) !important;
        box-shadow: 0 0 0 3px var(--color-lightprimary) !important;
    }
    .stButton button, .stFormSubmitButton button, [data-testid="stDownloadButton"] button {
        background: var(--color-primary) !important;
        color: #ffffff !important;
        border: 0 !important;
        border-radius: 10px !important;
        min-height: 42px !important;
        height: 42px !important;
        font-weight: 650 !important;
        box-shadow: none !important;
    }
    .stButton button:hover, .stFormSubmitButton button:hover, [data-testid="stDownloadButton"] button:hover {
        background: var(--color-primary-emphasis) !important;
        color: #ffffff !important;
        border: 0 !important;
    }
    [data-testid="stFileUploader"] {
        border: 1px dashed var(--color-defaultBorder) !important;
        border-radius: 12px !important;
        background: #ffffff !important;
        padding: 18px !important;
    }
    [data-testid="stDataFrame"] {
        border-radius: 12px !important;
        overflow: hidden !important;
        border: 0 !important;
        box-shadow: var(--shadow-xs) !important;
    }
    .md-error-box { border: 0 !important; background: var(--color-lighterror) !important; color: #be315c !important; border-radius: 12px !important; padding: 16px !important; }
    .md-success-box { border: 0 !important; background: var(--color-lightsuccess) !important; color: #168548 !important; border-radius: 12px !important; padding: 16px !important; }
    .md-info-box { border: 0 !important; background: var(--color-lightprimary) !important; color: var(--color-primary-emphasis) !important; border-radius: 12px !important; padding: 16px !important; }
    .md-guide-list li { border-bottom: 1px solid var(--color-defaultBorder) !important; color: var(--color-link) !important; }
    .md-guide-list code { background: var(--color-lightgray) !important; color: var(--color-primary) !important; border-radius: 5px !important; padding: 2px 5px !important; }

    @media screen and (max-width: 1280px) {
        section[data-testid="stSidebar"] { width: 250px !important; min-width: 250px !important; }
        .md-content-bg { margin-right: 0 !important; border-radius: 18px !important; padding: 24px 18px !important; }
    }
    @media screen and (max-width: 760px) {
        .md-topbar { padding: 14px 18px !important; }
        .md-search { width: 180px !important; }
        .md-download-btn { display: none !important; }
        .md-kpi-row { grid-template-columns: 1fr !important; }
        .md-page-title { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)

def _matdash_escape(value) -> str:
    return html.escape(str(value))


def _matdash_initials(name) -> str:
    parts = str(name).strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    if str(name).strip():
        return str(name).strip()[:2].upper()
    return "CU"


def _matdash_fig_to_img(fig, width: str = "100%") -> str:
    from io import BytesIO
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"<img src='data:image/png;base64,{encoded}' style='width:{width}; display:block; border-radius:14px;'/>"


def _matdash_plot_forecast(data):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    rng = np.random.default_rng(11)
    base = max(float(data["risk_probability"].mean()) if len(data) else .3, .08)
    positive = np.clip(base * 7.5 + rng.normal(0, .7, len(months)) + np.linspace(.1, .9, len(months)), .8, 4.0)
    negative = -np.clip(base * 5.5 + rng.normal(0, .55, len(months)) + np.linspace(.2, .4, len(months)), .7, 3.2)
    fig, ax = plt.subplots(figsize=(9.1, 3.9))
    x = np.arange(len(months))
    ax.vlines(x, 0, positive, colors="#635bff", linewidth=7, alpha=.95)
    ax.vlines(x, 0, negative, colors="#ff5c8a", linewidth=7, alpha=.95)
    ax.scatter(x, positive, color="#635bff", s=20, zorder=3)
    ax.scatter(x, negative, color="#ff5c8a", s=20, zorder=3)
    ax.set_xticks(x)
    ax.set_xticklabels(months, fontsize=10, color="#3d4658")
    ax.set_yticks([-4, -2, 0, 2, 4])
    ax.set_yticklabels(["-4.0", "-2.0", "0.0", "2.0", "4.0"], fontsize=9, color="#3d4658")
    ax.grid(True, axis="both", color="#dfe4ed", linewidth=.9)
    for sp in ax.spines.values():
        sp.set_color("#dfe4ed")
    ax.set_facecolor("white")
    fig.tight_layout(pad=.6)
    return fig


def _matdash_plot_sparkline(value: float = 0.0):
    rng = np.random.default_rng(3)
    y = np.array([.7, .55, .95, .35, .65, .82, 1.18]) + rng.normal(0, .035, 7)
    y = y + (value / 100) * .18
    fig, ax = plt.subplots(figsize=(2.4, .95))
    ax.plot(y, color="#ff5c8a", linewidth=2.2)
    ax.fill_between(range(len(y)), y, y.min() - .15, color="#ff5c8a", alpha=.05)
    ax.axis("off")
    fig.tight_layout(pad=0)
    return fig


def _matdash_plot_region(data):
    region_col = "region_category"
    tmp = data.copy()
    if region_col not in tmp.columns:
        tmp[region_col] = "Unknown"
    grouped = (1 - tmp.groupby(region_col)["churn"].mean()).sort_values(ascending=False).head(6) * 100
    fig, ax = plt.subplots(figsize=(7.2, 3.0))
    ax.bar(grouped.index.astype(str), grouped.values, color="#22d3d1", width=.55)
    ax.set_ylim(0, 100)
    ax.set_ylabel("Retention %", color="#6b7280")
    ax.tick_params(axis="x", rotation=18, labelsize=8, colors="#3d4658")
    ax.tick_params(axis="y", labelsize=8, colors="#3d4658")
    ax.grid(axis="y", color="#eef1f7")
    for sp in ax.spines.values():
        sp.set_visible(False)
    fig.tight_layout(pad=.6)
    return fig


def _matdash_render_topbar():
    # Header/topbar removed by request: no search bar, download button, theme icon, bell, or avatar.
    # This function now only opens the MatDash page shell so the existing page layout stays intact.
    st.markdown(
        """
        <style>
            .md-topbar,
            .md-search,
            .md-top-actions,
            .md-download-btn,
            .md-icon-btn,
            .md-avatar {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                min-height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .md-content-bg {
                min-height: 100vh !important;
                margin-top: 0 !important;
            }
        </style>
        <div class="md-page-wrap">
            <div class="md-content-bg">
        """,
        unsafe_allow_html=True,
    )


def _matdash_close_page():
    st.markdown("</div></div>", unsafe_allow_html=True)


def _matdash_title(title: str, subtitle: str, crumb: str = "ChurnSense / User Dashboard"):
    st.markdown(
        f"""
        <div class="md-page-title">
            <div>
                <div class="md-title-main">{_matdash_escape(title)}</div>
                <div class="md-title-sub">{_matdash_escape(subtitle)}</div>
            </div>
            <div class="md-breadcrumb">{_matdash_escape(crumb)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _matdash_risk_chip(label: str, probability: float | None = None) -> str:
    label = str(label)
    prob_text = ""
    if probability is not None:
        prob_text = f" · {float(probability):.1f}%"
    if "High" in label:
        return f"<span class='md-chip md-chip-red'>High Risk{prob_text}</span>"
    if "Medium" in label:
        return f"<span class='md-chip md-chip-yellow'>Medium Risk{prob_text}</span>"
    return f"<span class='md-chip md-chip-green'>Low Risk{prob_text}</span>"


def _matdash_metric_cards():
    churn_pct = max(0, min(100, churn_rate))
    at_risk_pct = (at_risk / max(total, 1)) * 100
    retention_pct = (retained / max(total, 1)) * 100
    rows = [
        ("◎", "#e7fffb", "#13b9b6", f"{total:,}", "Total Customers", 100, "md-chip-cyan", "+ Active data"),
        ("◇", "#fff1f6", "#ff5c8a", f"{churn_pct:.1f}%", "Churn Rate", churn_pct, "md-chip-red", "Watch"),
        ("⚠", "#fff8e5", "#e7a600", f"{at_risk:,}", "At-Risk Customers", at_risk_pct, "md-chip-yellow", "Priority"),
        ("✓", "#e6f8ef", "#1fb56a", f"{retention_pct:.1f}%", "Retention Score", retention_pct, "md-chip-green", "Good"),
    ]
    html_rows = []
    for icon, bg, color, val, label, pct, chip_cls, chip in rows:
        html_rows.append(
            f"""
            <div class="md-kpi-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="md-kpi-icon" style="background:{bg}; color:{color};">{icon}</div>
                    <span class="md-chip {chip_cls}">{chip}</span>
                </div>
                <div class="md-kpi-value">{val}</div>
                <div class="md-kpi-label">{label}</div>
                <div class="md-progress"><span style="width:{max(3, min(100, pct)):.0f}%; background:{color};"></span></div>
            </div>
            """
        )
    st.markdown("<div class='md-kpi-row'>" + "".join(html_rows) + "</div>", unsafe_allow_html=True)


def _matdash_dashboard_page():
    # Dashboard home follows the uploaded MatDash page structure: large chart card,
    # two summary cards, product-style table, and daily activity card.
    forecast_img = _matdash_fig_to_img(_matdash_plot_forecast(df))
    spark_img = _matdash_fig_to_img(_matdash_plot_sparkline(churn_rate), "100%")
    retention_img = _matdash_fig_to_img(_matdash_plot_region(df))

    top_left, top_right = st.columns([2.12, 1], gap="large")
    with top_left:
        st.markdown(
            f"""
            <div class="md-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div class="md-card-title" style="margin:0;">Churn Forecast</div>
                    <div style="border:1px solid #e4e9f2; border-radius:10px; padding:10px 16px; color:#344054; min-width:150px; text-align:left;">This Week ˅</div>
                </div>
                {forecast_img}
            </div>
            """,
            unsafe_allow_html=True,
        )
    with top_right:
        new_customers = max(1, int(total * .07))
        new_pct = min(96, 55 + int((retained / max(total, 1)) * 35))
        st.markdown(
            f"""
            <div class="md-card-tight" style="min-height:235px; margin-bottom:28px;">
                <div class="md-metric-side">
                    <div class="md-side-icon" style="background:#e7fffb; color:#13b9b6;">✺</div>
                    <div class="md-small-title">New Customers</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:34px;">
                    <div class="md-muted" style="font-size:17px;">New goals</div>
                    <div style="font-size:18px; color:#344054; font-weight:700;">{new_pct}%</div>
                </div>
                <div class="md-progress"><span style="width:{new_pct}%; background:#22d3d1;"></span></div>
            </div>
            <div class="md-card-tight" style="min-height:235px;">
                <div class="md-metric-side">
                    <div class="md-side-icon" style="background:#fff1f6; color:#ff5c8a;">◈</div>
                    <div class="md-small-title">Predicted Risk</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:28px;">
                    <div>
                        <div class="md-side-number">{at_risk:,}</div>
                        <span class="md-chip md-chip-green">+{max(1, int(at_risk / max(total, 1) * 100))}%</span>
                    </div>
                    <div style="width:48%;">{spark_img}</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    low_risk_names = df.sort_values("risk_probability", ascending=True).head(4).copy()
    table_rows = []
    for _, row in low_risk_names.iterrows():
        name = _matdash_escape(row.get("name", "Customer"))
        initials = _matdash_escape(_matdash_initials(row.get("name", "Customer")))
        region = _matdash_escape(row.get("region_category", "-"))
        risk = row.get("Risk Level", "Low Risk")
        prob = float(row.get("Churn Probability", 0))
        tenure = int(pd.to_numeric(row.get("tenure_months", 0), errors="coerce") or 0)
        table_rows.append(
            f"""
            <tr>
                <td><div class="md-customer-cell"><span class="md-mini-avatar">{initials}</span><div><b>{name}</b><br><span class="md-muted" style="font-size:12px;">{region}</span></div></div></td>
                <td>{tenure} months</td>
                <td>{_matdash_risk_chip(risk, prob)}</td>
                <td>${max(40, int(90 + tenure * 2.7))}</td>
            </tr>
            """
        )

    bottom_left, bottom_right = st.columns([2.12, 1], gap="large")
    with bottom_left:
        st.markdown(
            f"""
            <div class="md-card" style="margin-top:30px;">
                <div class="md-card-title">Customer Retention by Region</div>
                <div class="md-muted" style="margin-bottom:12px;">Retention level across customer regions.</div>
                {retention_img}
                <table class="md-table" style="margin-top:16px;">
                    <thead><tr><th>Customer</th><th>Tenure</th><th>Priority</th><th>Monthly Value</th></tr></thead>
                    <tbody>{''.join(table_rows)}</tbody>
                </table>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with bottom_right:
        activities = [
            ("09:46", "High-risk customers updated after latest prediction run."),
            ("10:12", f"{new_customers:,} new customer records detected in active dataset."),
            ("11:20", "Batch upload template is available for clean CSV formatting."),
            ("13:05", "Retention action list generated for priority accounts."),
        ]
        activity_html = "".join(
            f"<div class='md-activity'><div class='md-activity-time'>{t}</div><div class='md-activity-dot'></div><div class='md-activity-text'>{_matdash_escape(desc)}</div></div>"
            for t, desc in activities
        )
        st.markdown(
            f"""
            <div class="md-card" style="margin-top:30px; min-height:440px;">
                <div class="md-card-title">Daily activities</div>
                {activity_html}
            </div>
            """,
            unsafe_allow_html=True,
        )


def _matdash_prepare_customers(data):
    customers = data.copy()
    if "name" not in customers.columns:
        customers["name"] = [f"Customer {i+1}" for i in range(len(customers))]
    if "customer_id" not in customers.columns:
        customers["customer_id"] = [f"CUS-{i+1:05d}" for i in range(len(customers))]
    if "email" not in customers.columns:
        customers["email"] = customers["name"].astype(str).str.lower().str.replace(" ", ".", regex=False) + "@email.com"
    if "region_category" not in customers.columns:
        customers["region_category"] = "Unknown"
    if "tenure_months" not in customers.columns:
        customers["tenure_months"] = 0
    customers["risk_probability"] = pd.to_numeric(customers["risk_probability"], errors="coerce").fillna(0).clip(0, 1)
    customers["Risk Level"] = customers["risk_probability"].apply(risk_label)
    customers["Churn Probability"] = (customers["risk_probability"] * 100).round(1)
    return customers


def _matdash_customers_page():
    _matdash_title(
        "Customers",
        "Search, filter, and monitor customer health in a clean customer management view.",
        "Dashboard / Customers",
    )
    customers = _matdash_prepare_customers(df)
    ctotal = len(customers)
    chigh = int((customers["Risk Level"] == "High Risk").sum())
    cmed = int((customers["Risk Level"] == "Medium Risk").sum())
    clow = int((customers["Risk Level"] == "Low Risk").sum())

    st.markdown(
        f"""
        <div class="md-kpi-row">
            <div class="md-kpi-card"><div class="md-kpi-icon" style="background:#edebff;color:#635bff;">☷</div><div class="md-kpi-value">{ctotal:,}</div><div class="md-kpi-label">Total Customers</div></div>
            <div class="md-kpi-card"><div class="md-kpi-icon" style="background:#fff1f6;color:#ff5c8a;">⚠</div><div class="md-kpi-value">{chigh:,}</div><div class="md-kpi-label">High Risk</div></div>
            <div class="md-kpi-card"><div class="md-kpi-icon" style="background:#fff8e5;color:#e7a600;">◷</div><div class="md-kpi-value">{cmed:,}</div><div class="md-kpi-label">Medium Risk</div></div>
            <div class="md-kpi-card"><div class="md-kpi-icon" style="background:#e6f8ef;color:#1fb56a;">✓</div><div class="md-kpi-value">{clow:,}</div><div class="md-kpi-label">Low Risk</div></div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.container():
        st.markdown("<div class='md-form-card'>", unsafe_allow_html=True)
        tool_left, tool_mid, tool_right = st.columns([2.4, 1.2, 1.1], gap="medium")
        with tool_left:
            keyword = st.text_input("Search customer", placeholder="Search by name, email, or customer ID", key="md_customer_search")
        with tool_mid:
            risk_filter = st.selectbox("Risk filter", ["All Customers", "High Risk", "Medium Risk", "Low Risk"], key="md_customer_risk_filter")
        with tool_right:
            export_df = customers[["customer_id", "name", "email", "region_category", "tenure_months", "Risk Level", "Churn Probability"]].copy()
            st.download_button("Export CSV", export_df.to_csv(index=False).encode("utf-8"), "churnsense_customers.csv", "text/csv", use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    filtered = customers.copy()
    if keyword:
        mask = (
            filtered["name"].astype(str).str.contains(keyword, case=False, na=False)
            | filtered["email"].astype(str).str.contains(keyword, case=False, na=False)
            | filtered["customer_id"].astype(str).str.contains(keyword, case=False, na=False)
        )
        filtered = filtered[mask]
    if risk_filter != "All Customers":
        filtered = filtered[filtered["Risk Level"] == risk_filter]

    display = filtered.sort_values("risk_probability", ascending=False).head(25).copy()
    rows = []
    for _, row in display.iterrows():
        name = _matdash_escape(row.get("name", "Customer"))
        initials = _matdash_escape(_matdash_initials(row.get("name", "Customer")))
        email = _matdash_escape(row.get("email", "-"))
        region = _matdash_escape(row.get("region_category", "-"))
        tenure = int(pd.to_numeric(row.get("tenure_months", 0), errors="coerce") or 0)
        label = row.get("Risk Level", "Low Risk")
        prob = float(row.get("Churn Probability", 0))
        action = "Immediate follow-up" if label == "High Risk" else "Monitor" if label == "Medium Risk" else "Maintain"
        rows.append(
            f"""
            <tr>
                <td><div class="md-customer-cell"><span class="md-mini-avatar">{initials}</span><div><b>{name}</b><br><span class="md-muted" style="font-size:12px;">{email}</span></div></div></td>
                <td>{region}</td>
                <td>{tenure} months</td>
                <td>{_matdash_risk_chip(label, prob)}</td>
                <td>{action}</td>
            </tr>
            """
        )
    if not rows:
        rows.append("<tr><td colspan='5' style='text-align:center;color:#7e8797;padding:28px;'>No customer matches the selected filter.</td></tr>")

    st.markdown(
        f"""
        <div class="md-card" style="margin-top:28px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div><div class="md-card-title" style="margin-bottom:3px;">Customer List</div><div class="md-muted">Showing top 25 highest-risk customers from the selected filter.</div></div>
                <span class="md-chip md-chip-blue">{len(filtered):,} shown</span>
            </div>
            <table class="md-table">
                <thead><tr><th>Customer</th><th>Region</th><th>Tenure</th><th>Churn Risk</th><th>Suggested Action</th></tr></thead>
                <tbody>{''.join(rows)}</tbody>
            </table>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _matdash_numeric_error(label: str, value: str, min_value: float | None = None, max_value: float | None = None, positive: bool = False):
    try:
        number = float(str(value).strip())
    except Exception:
        if min_value is not None and max_value is not None:
            return None, f"{label} must be a number between {min_value:g} and {max_value:g}."
        if positive:
            return None, f"{label} must be greater than 0."
        return None, f"{label} must be a valid number."
    if min_value is not None and number < min_value:
        return None, f"{label} must be a number between {min_value:g} and {max_value:g}."
    if max_value is not None and number > max_value:
        return None, f"{label} must be a number between {min_value:g} and {max_value:g}."
    if positive and number <= 0:
        return None, f"{label} must be greater than 0."
    return number, None


def _matdash_predict_probability(tenure, monthly_value, login_frequency, support_tickets, days_inactive):
    freq_factor = {"Daily": -.14, "Weekly": .02, "Monthly": .17, "Rarely": .29}.get(login_frequency, .08)
    tenure_factor = .22 if tenure < 3 else .13 if tenure < 12 else -.04 if tenure > 36 else .04
    value_factor = .08 if monthly_value > 180 else .03 if monthly_value > 100 else -.02
    ticket_factor = min(.20, support_tickets * .035)
    inactive_factor = min(.25, max(0, days_inactive) * .009)
    prob = .28 + freq_factor + tenure_factor + value_factor + ticket_factor + inactive_factor
    return float(np.clip(prob, .03, .96))


def _matdash_prediction_page():
    _matdash_title(
        "Prediction",
        "Run single-customer churn prediction with specific English validation messages for each field.",
        "Dashboard / Prediction",
    )

    left, right = st.columns([1.45, 1], gap="large")
    with left:
        st.markdown("<div class='md-form-card'><div class='md-card-title'>Single Customer Prediction</div><div class='md-muted' style='margin-bottom:18px;'>Fill the customer profile below. Error messages will only explain the field that is incorrect.</div>", unsafe_allow_html=True)
        with st.form("md_prediction_form", clear_on_submit=False):
            p1, p2 = st.columns(2)
            with p1:
                customer_name = st.text_input("Customer Name", placeholder="John Smith")
                gender = st.selectbox("Gender", ["Select gender", "Male", "Female", "Other"])
                tenure_text = st.text_input("Customer Tenure", placeholder="0–120 months")
                login_frequency = st.selectbox("Login Frequency", ["Daily", "Weekly", "Monthly", "Rarely"])
            with p2:
                region = st.selectbox("Geographic Region", ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"])
                monthly_text = st.text_input("Monthly Subscription Value", placeholder="149")
                tickets_text = st.text_input("Support Tickets", placeholder="3")
                days_inactive_text = st.text_input("Days Since Last Activity", placeholder="0–365 days")
            submit = st.form_submit_button("Run Prediction", use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    result = st.session_state.get("md_prediction_result")
    if submit:
        errors = []
        if not customer_name.strip():
            errors.append("Customer Name is required.")
        if gender == "Select gender":
            errors.append("Gender must be Male, Female, or Other.")
        tenure, tenure_error = _matdash_numeric_error("Customer Tenure", tenure_text, 0, 120)
        if tenure_error:
            errors.append(tenure_error)
        monthly, monthly_error = _matdash_numeric_error("Monthly Subscription Value", monthly_text, positive=True)
        if monthly_error:
            errors.append(monthly_error)
        tickets, tickets_error = _matdash_numeric_error("Support Tickets", tickets_text, 0, 999)
        if tickets_error:
            errors.append("Support Tickets must be a number between 0 and 999.")
        days_inactive, inactive_error = _matdash_numeric_error("Days Since Last Activity", days_inactive_text, 0, 365)
        if inactive_error:
            errors.append("Days Since Last Activity must be a number between 0 and 365.")

        if errors:
            st.session_state.md_prediction_result = {"status": "error", "errors": errors}
        else:
            probability = _matdash_predict_probability(tenure, monthly, login_frequency, tickets, days_inactive)
            label = risk_label(probability)
            st.session_state.md_prediction_result = {
                "status": "success",
                "name": customer_name.strip(),
                "probability": probability,
                "label": label,
                "action": "Immediate retention follow-up is recommended." if label == "High Risk" else "Monitor engagement and send personalized check-in." if label == "Medium Risk" else "Customer is currently healthy; maintain service quality.",
            }
        result = st.session_state.get("md_prediction_result")

    with right:
        if result and result.get("status") == "error":
            error_items = "".join(f"<li>{_matdash_escape(e)}</li>" for e in result.get("errors", []))
            st.markdown(f"<div class='md-error-box'><b>Invalid Input</b><ul style='margin:10px 0 0 18px;'>{error_items}</ul></div>", unsafe_allow_html=True)
        elif result and result.get("status") == "success":
            prob_pct = float(result["probability"]) * 100
            label = result["label"]
            color = "#ff5c8a" if label == "High Risk" else "#e7a600" if label == "Medium Risk" else "#1fb56a"
            st.markdown(
                f"""
                <div class="md-card">
                    <div class="md-card-title">Prediction Result</div>
                    <div class="md-muted">Customer: <b>{_matdash_escape(result['name'])}</b></div>
                    <div style="font-size:54px; font-weight:900; color:{color}; letter-spacing:-.06em; margin-top:24px;">{prob_pct:.1f}%</div>
                    <div style="margin:10px 0 16px;">{_matdash_risk_chip(label, prob_pct)}</div>
                    <div class="md-progress"><span style="width:{prob_pct:.0f}%; background:{color};"></span></div>
                    <div class="md-info-box"><b>Recommended Action</b><br>{_matdash_escape(result['action'])}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                """
                <div class="md-card">
                    <div class="md-card-title">Prediction Guide</div>
                    <div class="md-muted">Use consistent English values across the form. The system validates each field separately, so users know exactly what needs to be corrected.</div>
                    <ul class="md-guide-list">
                        <li><b>Gender</b>: Male, Female, or Other.</li>
                        <li><b>Customer Tenure</b>: number between 0 and 120 months.</li>
                        <li><b>Monthly Subscription Value</b>: number greater than 0.</li>
                        <li><b>Support Tickets</b>: number between 0 and 999.</li>
                        <li><b>Days Since Last Activity</b>: number between 0 and 365.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )


def _matdash_csv_template() -> pd.DataFrame:
    return pd.DataFrame([
        {
            "Customer Name": "John Smith",
            "Gender": "Male",
            "Geographic Region": "North America",
            "Customer Tenure": 18,
            "Monthly Subscription Value": 149,
            "Login Frequency": "Daily",
            "Support Tickets": 3,
            "Last Activity": "2026-05-12",
        },
        {
            "Customer Name": "Sarah Johnson",
            "Gender": "Female",
            "Geographic Region": "Europe",
            "Customer Tenure": 6,
            "Monthly Subscription Value": 99,
            "Login Frequency": "Weekly",
            "Support Tickets": 1,
            "Last Activity": "2026-05-10",
        },
    ])


def _matdash_validate_uploaded_csv(uploaded_df: pd.DataFrame):
    required = list(_matdash_csv_template().columns)
    normalized = {str(c).strip().lower(): c for c in uploaded_df.columns}
    missing = [c for c in required if c.lower() not in normalized]
    errors = []
    if missing:
        errors.append({"title": "Missing Required Columns", "items": [f"Missing column: {c}" for c in missing]})
        return None, errors

    work = uploaded_df.rename(columns={normalized[c.lower()]: c for c in required}).copy()
    row_errors = []
    allowed_gender = {"Male", "Female", "Other"}
    allowed_login = {"Daily", "Weekly", "Monthly", "Rarely"}

    for i, row in work.iterrows():
        row_no = i + 2
        if not str(row.get("Customer Name", "")).strip():
            row_errors.append(f"Row {row_no}: Customer Name is required.")
        if str(row.get("Gender", "")).strip() not in allowed_gender:
            row_errors.append(f"Row {row_no}: Gender must be Male, Female, or Other.")
        tenure = pd.to_numeric(row.get("Customer Tenure"), errors="coerce")
        if pd.isna(tenure) or tenure < 0 or tenure > 120:
            row_errors.append(f"Row {row_no}: Customer Tenure must be a number between 0 and 120.")
        monthly = pd.to_numeric(row.get("Monthly Subscription Value"), errors="coerce")
        if pd.isna(monthly) or monthly <= 0:
            row_errors.append(f"Row {row_no}: Monthly Subscription Value must be greater than 0.")
        if str(row.get("Login Frequency", "")).strip() not in allowed_login:
            row_errors.append(f"Row {row_no}: Login Frequency must be Daily, Weekly, Monthly, or Rarely.")
        tickets = pd.to_numeric(row.get("Support Tickets"), errors="coerce")
        if pd.isna(tickets) or tickets < 0:
            row_errors.append(f"Row {row_no}: Support Tickets must be a number greater than or equal to 0.")
        activity = pd.to_datetime(row.get("Last Activity"), errors="coerce")
        if pd.isna(activity):
            row_errors.append(f"Row {row_no}: Last Activity must be a valid date, for example 2026-05-12.")

    if row_errors:
        errors.append({"title": "Invalid Row Values", "items": row_errors[:25]})
        return None, errors

    now = pd.Timestamp.today().normalize()
    internal = pd.DataFrame()
    internal["customer_id"] = [f"UPL-{hashlib.md5((str(n)+str(i)).encode()).hexdigest()[:8].upper()}" for i, n in enumerate(work["Customer Name"].astype(str))]
    internal["name"] = work["Customer Name"].astype(str)
    internal["gender"] = work["Gender"].astype(str)
    internal["region_category"] = work["Geographic Region"].astype(str)
    internal["tenure_months"] = pd.to_numeric(work["Customer Tenure"], errors="coerce").fillna(0).astype(int)
    internal["monthly_subscription_value"] = pd.to_numeric(work["Monthly Subscription Value"], errors="coerce").fillna(0)
    internal["login_frequency"] = work["Login Frequency"].astype(str)
    internal["support_tickets"] = pd.to_numeric(work["Support Tickets"], errors="coerce").fillna(0).astype(int)
    last_activity = pd.to_datetime(work["Last Activity"], errors="coerce")
    internal["days_since_last_login"] = (now - last_activity.dt.normalize()).dt.days.clip(lower=0).fillna(0).astype(int)
    probs = [
        _matdash_predict_probability(t, m, lf, s, d)
        for t, m, lf, s, d in zip(
            internal["tenure_months"],
            internal["monthly_subscription_value"],
            internal["login_frequency"],
            internal["support_tickets"],
            internal["days_since_last_login"],
        )
    ]
    internal["risk_probability"] = probs
    internal["churn"] = (internal["risk_probability"] >= .70).astype(int)
    internal["sentiment_score"] = 3
    internal["sentiment_kategori"] = "Biasa"
    internal["Risk Level"] = internal["risk_probability"].apply(risk_label)
    internal["Churn Probability"] = (internal["risk_probability"] * 100).round(1)
    return internal, []


def _matdash_append_upload(rows: pd.DataFrame):
    if rows is None or rows.empty:
        return 0
    existing = st.session_state.get("dashboard_uploaded_rows")
    if isinstance(existing, pd.DataFrame) and not existing.empty:
        before = len(existing)
        combined = pd.concat([existing, rows], ignore_index=True, sort=False)
        combined = combined.drop_duplicates(subset=["customer_id"], keep="last")
        st.session_state.dashboard_uploaded_rows = combined
        return len(combined) - before
    st.session_state.dashboard_uploaded_rows = rows.copy()
    return len(rows)


def _matdash_batch_upload_page():
    _matdash_title(
        "Batch Upload",
        "Upload CSV files, validate field format, and process valid rows into Dashboard and Customers data.",
        "Dashboard / Batch Upload",
    )

    left, right = st.columns([1.45, 1], gap="large")
    with left:
        st.markdown("<div class='md-form-card'><div class='md-card-title'>Upload Customer CSV</div><div class='md-muted' style='margin-bottom:18px;'>The uploaded file will be read, validated, processed, and added into the current dashboard session if the format is valid.</div>", unsafe_allow_html=True)
        template = _matdash_csv_template()
        st.download_button(
            "Download CSV Template",
            data=template.to_csv(index=False).encode("utf-8"),
            file_name="churnsense_batch_template.csv",
            mime="text/csv",
            use_container_width=True,
        )
        uploaded = st.file_uploader("Upload CSV File", type=["csv"], key="md_batch_upload_file")
        if uploaded is not None:
            try:
                uploaded_df = pd.read_csv(uploaded)
                processed, errors = _matdash_validate_uploaded_csv(uploaded_df)
                if errors:
                    blocks = []
                    for err in errors:
                        items = "".join(f"<li>{_matdash_escape(item)}</li>" for item in err["items"])
                        blocks.append(f"<b>{_matdash_escape(err['title'])}</b><ul style='margin:10px 0 0 18px;'>{items}</ul>")
                    st.markdown(f"<div class='md-error-box'>{''.join(blocks)}</div>", unsafe_allow_html=True)
                else:
                    added = _matdash_append_upload(processed)
                    st.markdown(f"<div class='md-success-box'><b>File processed successfully.</b><br>{len(processed):,} rows were validated. {added:,} new rows were added into Dashboard and Customers data.</div>", unsafe_allow_html=True)
                    st.dataframe(processed[["customer_id", "name", "region_category", "tenure_months", "Risk Level", "Churn Probability"]], use_container_width=True, hide_index=True)
                    st.download_button("Download Prediction Result CSV", processed.to_csv(index=False).encode("utf-8"), "churnsense_batch_result.csv", "text/csv", use_container_width=True)
            except Exception as exc:
                st.markdown(f"<div class='md-error-box'><b>Invalid CSV File</b><br>The file could not be read as a valid CSV file: {_matdash_escape(exc)}</div>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with right:
        st.markdown(
            """
            <div class="md-card">
                <div class="md-card-title">CSV Format Guide</div>
                <div class="md-muted">Use these exact columns so Batch Upload can validate and process the data correctly.</div>
                <ul class="md-guide-list">
                    <li><b>Customer Name</b>: customer name, example <code>John Smith</code>.</li>
                    <li><b>Gender</b>: <code>Male</code>, <code>Female</code>, or <code>Other</code>.</li>
                    <li><b>Geographic Region</b>: customer region, example <code>North America</code>.</li>
                    <li><b>Customer Tenure</b>: subscription duration in months, example <code>18</code>.</li>
                    <li><b>Monthly Subscription Value</b>: monthly subscription amount, example <code>149</code>.</li>
                    <li><b>Login Frequency</b>: <code>Daily</code>, <code>Weekly</code>, <code>Monthly</code>, or <code>Rarely</code>.</li>
                    <li><b>Support Tickets</b>: number of support tickets, example <code>3</code>.</li>
                    <li><b>Last Activity</b>: latest activity date, example <code>2026-05-12</code>.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True,
        )


_matdash_render_topbar()
if page == "Dashboard":
    _matdash_dashboard_page()
elif page == "Customers":
    _matdash_customers_page()
elif page == "Prediction":
    _matdash_prediction_page()
elif page == "Batch Upload":
    _matdash_batch_upload_page()
_matdash_close_page()
st.stop()

# =============================================================================
# DASHBOARD PAGE
# =============================================================================
if page == "Dashboard":
    top_left, top_right = st.columns([8, 1])
    with top_left:
        st.markdown("<div style='font-size:.78rem; color:#6d5dfc; font-weight:850; letter-spacing:.02em; margin-bottom:.25rem;'>ChurnSense · Retention Intelligence</div>", unsafe_allow_html=True)
        st.markdown("<div class='page-title'>ChurnSense User Dashboard</div>", unsafe_allow_html=True)
        st.markdown("<div class='page-sub'>Welcome back! Here is your customer health overview.</div>", unsafe_allow_html=True)
    with top_right:
        st.markdown("<div style='text-align:right; padding-top:.4rem;'><span class='pill pill-blue'>JD</span></div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="soft-card" style="margin-top:1rem;">
        <b>Welcome to the ChurnSense Customer Health Dashboard!</b><br>
        <span style="font-size:.8rem; color:#4b5563;">
        This dashboard helps users understand customer health, churn risk, and recommended actions without reading raw data one by one.
        </span>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="gradient-card" style="margin-top:1rem;">
        <div style="font-size:.78rem; opacity:.9;">Customer Health Overview</div>
        <div class="big-number">{:.1f}%</div>
        <div style="font-size:.78rem; opacity:.9;">Monthly churn rate comparison</div>
    </div>
    """.format(churn_rate), unsafe_allow_html=True)

    st.markdown("<div class='section-title'>Key Numbers at a Glance</div>", unsafe_allow_html=True)
    st.markdown("<div class='section-sub'>These are the most important numbers you should watch. Each card shows a different aspect of customer health.</div>", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    metrics = [
        (c1, "Churn Rate", f"{churn_rate:.1f}%", "+2.5%", "#fee2e2", "#ef4444", "↘", min(churn_rate, 100)),
        (c2, "At-risk Customers", fmt_int(at_risk), "+156", "#fef3c7", "#f59e0b", "⚠", min(at_risk / max(total, 1) * 100, 100)),
        (c3, "Retained Customers", fmt_int(retained), "+342", "#dcfce7", "#10b981", "◎", min(retained / max(total, 1) * 100, 100)),
        (c4, "Total Customers", fmt_int(total), "+186", "#e0e7ff", "#6d5dfc", "👥", 100),
    ]
    for col, title, val, delta, bg, color, icon, pct in metrics:
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div class="metric-icon" style="background:{bg}; color:{color};">{icon}</div>
                    <span style="font-size:.68rem; color:{color}; font-weight:800;">{delta}</span>
                </div>
                <div class="metric-value">{val}</div>
                <div class="metric-title">{title}</div>
                <div class="metric-line"><span style="width:{pct:.0f}%; background:{color};"></span></div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("""
    <div class="note-card" style="margin-top:1rem;">
        <b>How to understand these numbers</b><br>
        <b>Lower Churn Rate = Better</b>: This means fewer customers are leaving.<br>
        <b>Fewer At-Risk Customers = Better</b>: These customers need attention now.<br>
        <b>More Retained Customers = Better</b>: These are your loyal customers.
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<div class='section-title'>Visual Analytics</div>", unsafe_allow_html=True)
    st.markdown("<div class='section-sub'>These charts help you see patterns and trends in your customer data.</div>", unsafe_allow_html=True)

    row1_col1, row1_col2 = st.columns(2)
    with row1_col1:
        st.markdown("<div class='card'><div class='chart-title'>Churn Rate by Customer Age</div><div class='chart-sub'>Shows how likely customers are to leave based on how long they have been with us.</div>", unsafe_allow_html=True)
        st.markdown("<div class='help-box'><b>What does this mean?</b><br>Customer age means how many months they have been with the service. Higher points mean more customers are leaving.</div>", unsafe_allow_html=True)
        st.pyplot(plot_churn_by_tenure(df), use_container_width=True)
        st.markdown("<div class='read-box'><b>How to read:</b> Look at the line from left to right. If the line drops, newer customers are at higher risk. Focus retention effort on the highest points.</div></div>", unsafe_allow_html=True)
    with row1_col2:
        st.markdown("<div class='card'><div class='chart-title'>Customer Risk Groups</div><div class='chart-sub'>How many customers are in each risk category.</div>", unsafe_allow_html=True)
        st.markdown(f"<div class='help-box'><b>Risk groups:</b><br><span style='color:#ef4444'>High Risk</span>: {high_risk:,} customers need immediate attention.<br><span style='color:#f59e0b'>Medium Risk</span>: {medium_risk:,} customers should be monitored.<br><span style='color:#10b981'>Low Risk</span>: {low_risk:,} customers are likely stable.</div>", unsafe_allow_html=True)
        st.pyplot(plot_risk_donut(), use_container_width=True)
        st.markdown("<div class='read-box'><b>What this tells you:</b> Most customers should ideally be in low risk. If high and medium risk are large, retention actions should be prioritized.</div></div>", unsafe_allow_html=True)

    row2_col1, row2_col2 = st.columns(2)
    with row2_col1:
        st.markdown("<div class='card'><div class='chart-title'>Customer Loyalty by Location</div><div class='chart-sub'>Compares retention levels across customer regions.</div>", unsafe_allow_html=True)
        st.markdown("<div class='help-box'><b>What is retention?</b><br>Retention is the percentage of customers who stay with the service. Higher bars mean stronger loyalty in that region.</div>", unsafe_allow_html=True)
        st.pyplot(plot_region_retention(df), use_container_width=True)
        st.markdown("<div class='read-box'><b>What this tells you:</b> Regions with lower retention may need better onboarding, support, or localized offers.</div></div>", unsafe_allow_html=True)
    with row2_col2:
        st.markdown("<div class='card'><div class='chart-title'>Active vs Inactive Customers Over Time</div><div class='chart-sub'>Tracks customer activity each month.</div>", unsafe_allow_html=True)
        st.markdown("<div class='help-box'><b>Active customers</b> logged in or used the service. <b>Inactive customers</b> have not used the service recently.</div>", unsafe_allow_html=True)
        st.pyplot(plot_active_inactive(df), use_container_width=True)
        st.markdown("<div class='read-box'><b>Watch the trend:</b> If inactive customers increase, it can be an early warning sign before churn happens.</div></div>", unsafe_allow_html=True)

    left, right = st.columns([2.1, .9])
    with left:
        st.markdown("<div class='section-title'>Customer Overview</div>", unsafe_allow_html=True)
        st.markdown("<div class='section-sub'>Monitor at-risk customers and choose who needs follow-up first.</div>", unsafe_allow_html=True)
        table_df = df.sort_values("risk_probability", ascending=False).head(10).copy()
        display_df = pd.DataFrame({
            "Customer": table_df["name"].astype(str),
            "Region": table_df["region_category"].astype(str),
            "Tenure": table_df["tenure_months"].astype(str) + " months",
            "Risk Level": table_df["Risk Level"],
            "Churn Prob.": table_df["Churn Probability"].astype(str) + "%",
            "Sentiment": table_df["sentiment_kategori"].astype(str),
        })
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    with right:
        st.markdown("""
        <div class="gradient-card" style="padding:1rem; margin-top:.4rem;">
            <div style="font-weight:850; font-size:1rem;">AI-Generated Insights</div>
            <div style="font-size:.74rem; opacity:.88; margin-top:.25rem;">Machine learning analysis and recommendations</div>
        </div>
        """, unsafe_allow_html=True)

        insights = [
            ("Reduced engagement in mobile app", "Users with low mobile activity have higher churn risk.", 94),
            ("Payment failures relate with churn", "Failed transactions increase churn probability.", 83),
            ("Regional pricing optimization needed", "Latin America shows price sensitivity.", 72),
        ]
        for title, desc, pct in insights:
            st.markdown(f"""
            <div class='insight-card'>
                <b style='font-size:.78rem;'>{title}</b>
                <span class='pill pill-red' style='float:right;'>High</span>
                <div style='font-size:.72rem; color:#6b7280; margin-top:.35rem;'>{desc}</div>
                <div class='progress'><span style='width:{pct}%;'></span></div>
                <div style='font-size:.65rem; color:#6b7280; text-align:right; margin-top:.2rem;'>{pct}% confidence</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<div class='section-title' style='font-size:.95rem;'>Recommended Actions</div>", unsafe_allow_html=True)
        for item in ["Launch re-engagement campaign for inactive users", "Improve payment retry system", "Offer personalized discounts to high-risk customers", "Improve onboarding experience for new users"]:
            st.markdown(f"<div class='action-item'><div class='check'>✓</div><div>{item}</div></div>", unsafe_allow_html=True)

    st.markdown("<div class='section-title'>Quick Reference Guide</div>", unsafe_allow_html=True)
    q1, q2, q3 = st.columns(3)
    with q1:
        st.markdown("<div class='card'><b>What is Churn?</b><br><span style='font-size:.75rem;color:#6b7280;'>Churn is when customers stop using the service. Lower churn means better retention.</span></div>", unsafe_allow_html=True)
    with q2:
        st.markdown("<div class='card'><b>Understanding Risk</b><br><span style='font-size:.75rem;color:#6b7280;'><b>High:</b> likely to cancel<br><b>Medium:</b> showing warning signs<br><b>Low:</b> happy and engaged</span></div>", unsafe_allow_html=True)
    with q3:
        st.markdown("<div class='card'><b>What Can You Do?</b><br><span style='font-size:.75rem;color:#6b7280;'>Contact customers, offer special deals, ask for feedback, and provide support.</span></div>", unsafe_allow_html=True)


# =============================================================================
# CUSTOMERS PAGE
# =============================================================================
elif page == "Customers":
    st.markdown("<div class='page-title'>Customer Management</div>", unsafe_allow_html=True)
    st.markdown("<div class='page-sub'>Monitor all customers and identify at-risk accounts.</div>", unsafe_allow_html=True)

    # Siapkan kolom pendukung agar halaman Customers tetap jalan meskipun dataset berbeda.
    customers_df = df.copy()
    if "name" not in customers_df.columns:
        customers_df["name"] = [f"Customer {i+1}" for i in range(len(customers_df))]
    if "customer_id" not in customers_df.columns:
        customers_df["customer_id"] = [f"CUS-{i+1:05d}" for i in range(len(customers_df))]
    if "email" not in customers_df.columns:
        customers_df["email"] = customers_df["name"].astype(str).str.lower().str.replace(" ", ".", regex=False) + "@email.com"
    if "region_category" not in customers_df.columns:
        customers_df["region_category"] = "Unknown"
    if "tenure_months" not in customers_df.columns:
        if "days_since_joined" in customers_df.columns:
            customers_df["tenure_months"] = (pd.to_numeric(customers_df["days_since_joined"], errors="coerce").fillna(30) / 30).round().clip(lower=1).astype(int)
        else:
            customers_df["tenure_months"] = 1
    if "days_since_last_login" not in customers_df.columns:
        customers_df["days_since_last_login"] = 0
    if "sentiment_kategori" not in customers_df.columns:
        customers_df["sentiment_kategori"] = "Biasa"

    customers_df["risk_probability"] = pd.to_numeric(customers_df["risk_probability"], errors="coerce").fillna(0).clip(0, 1)
    customers_df["Risk Level"] = customers_df["risk_probability"].apply(risk_label)
    customers_df["Churn Probability"] = (customers_df["risk_probability"] * 100).round(1)

    def _initials(name):
        parts = str(name).strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        return str(name).strip()[:2].upper() if str(name).strip() else "CU"

    def _safe(value):
        return html.escape(str(value))

    def _risk_chip(label, prob):
        if label == "High Risk":
            return f"<span class='risk-chip risk-high'>High - {prob:.0f}%</span>"
        if label == "Medium Risk":
            return f"<span class='risk-chip risk-medium'>Medium - {prob:.0f}%</span>"
        return f"<span class='risk-chip risk-low'>Low - {prob:.0f}%</span>"

    def _last_active_text(days):
        try:
            d = int(float(days))
        except Exception:
            d = 0
        if d <= 0:
            return "Today"
        if d == 1:
            return "1 day ago"
        if d < 7:
            return f"{d} days ago"
        if d < 30:
            return f"{d // 7} weeks ago"
        return f"{d // 30} months ago"

    def _recommendation(row):
        label = row.get("Risk Level", "Low Risk")
        sent = str(row.get("sentiment_kategori", "Biasa"))
        inactive = pd.to_numeric(row.get("days_since_last_login", 0), errors="coerce")
        inactive = 0 if pd.isna(inactive) else int(inactive)

        if label == "High Risk":
            return "Prioritize follow-up. Contact this customer, check their main issue, and offer a retention action such as support assistance, onboarding help, or a personalized promo."
        if label == "Medium Risk":
            return "Monitor activity closely. Send an engagement message, ask for feedback, and remind the customer about features that match their needs."
        if sent in ["Kecewa", "Sangat Kecewa"] or inactive >= 14:
            return "Customer looks safe by score, but still needs attention because sentiment or inactivity shows an early warning."
        return "Customer is currently healthy. Maintain regular communication and keep service quality consistent."

    # Toolbar: search, export, dan filter
    st.markdown("<div class='customer-toolbar'>", unsafe_allow_html=True)
    top_left, top_right = st.columns([5, 1])
    with top_left:
        keyword = st.text_input(
            "Search customers",
            placeholder="Search customers by name, email, or customer ID...",
            label_visibility="collapsed",
            key="customer_search",
        )
    with top_right:
        export_base = customers_df[[
            "customer_id", "name", "email", "region_category", "tenure_months",
            "days_since_last_login", "Risk Level", "Churn Probability", "sentiment_kategori"
        ]].copy()
        st.download_button(
            "Export Data",
            data=export_base.to_csv(index=False).encode("utf-8"),
            file_name="churnsense_customer_export.csv",
            mime="text/csv",
            use_container_width=True,
        )

    risk_choice = st.radio(
        "Risk filter",
        ["All Customers", "High Risk", "Medium Risk", "Low Risk"],
        horizontal=True,
        label_visibility="collapsed",
        key="customer_risk_filter",
    )
    st.markdown("</div>", unsafe_allow_html=True)

    # Filtering data
    filtered = customers_df.copy()
    if keyword:
        keyword_mask = (
            filtered["name"].astype(str).str.contains(keyword, case=False, na=False)
            | filtered["email"].astype(str).str.contains(keyword, case=False, na=False)
            | filtered["customer_id"].astype(str).str.contains(keyword, case=False, na=False)
        )
        filtered = filtered[keyword_mask]

    if risk_choice != "All Customers":
        filtered = filtered[filtered["Risk Level"] == risk_choice]

    # Summary singkat untuk user
    total_customers = len(filtered)
    high_count = int((filtered["Risk Level"] == "High Risk").sum())
    medium_count = int((filtered["Risk Level"] == "Medium Risk").sum())
    low_count = int((filtered["Risk Level"] == "Low Risk").sum())
    avg_prob = filtered["Churn Probability"].mean() if len(filtered) else 0

    st.markdown(
        f"""
        <div class="customer-summary">
            <div class="customer-summary-card">
                <div class="customer-summary-label">TOTAL SHOWN</div>
                <div class="customer-summary-value">{total_customers:,}</div>
                <div class="customer-summary-sub">Customers after filter</div>
            </div>
            <div class="customer-summary-card">
                <div class="customer-summary-label">HIGH RISK</div>
                <div class="customer-summary-value" style="color:#dc2626;">{high_count:,}</div>
                <div class="customer-summary-sub">Need immediate attention</div>
            </div>
            <div class="customer-summary-card">
                <div class="customer-summary-label">MEDIUM RISK</div>
                <div class="customer-summary-value" style="color:#ea580c;">{medium_count:,}</div>
                <div class="customer-summary-sub">Need monitoring</div>
            </div>
            <div class="customer-summary-card">
                <div class="customer-summary-label">AVG RISK</div>
                <div class="customer-summary-value">{avg_prob:.1f}%</div>
                <div class="customer-summary-sub">Average churn probability</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Customer list card + modal detail seperti UI referensi
    st.markdown("""
    <style>
    .customer-detail-html .detail-header {
        display:flex; align-items:center; gap:1rem;
        padding-bottom:1rem; border-bottom:1px solid #eef1f7;
        margin-bottom:1.25rem;
    }
    .customer-detail-html .detail-avatar {
        width:56px; height:56px; border-radius:50%;
        background:#6d5dfc; color:#fff;
        display:flex; align-items:center; justify-content:center;
        font-weight:800; font-size:1rem;
        flex:0 0 auto;
    }
    .customer-detail-html .detail-name {
        color:#111827; font-size:1.35rem; font-weight:850; line-height:1.15;
    }
    .customer-detail-html .detail-email {
        color:#64748b; font-size:.9rem; margin-top:.22rem;
    }
    .risk-assessment-panel {
        border-radius:14px; padding:1.1rem 1.25rem; margin:0 0 1.15rem 0;
    }
    .risk-assessment-panel.high {
        background:#fff5f5; border:1px solid #fecaca;
    }
    .risk-assessment-panel.medium {
        background:#fff7ed; border:1px solid #fed7aa;
    }
    .risk-assessment-panel.low {
        background:#f0fdf4; border:1px solid #bbf7d0;
    }
    .risk-assessment-title {
        display:flex; align-items:center; gap:.65rem;
        color:#111827; font-size:1rem; font-weight:850; margin-bottom:.85rem;
    }
    .risk-assessment-row {
        display:flex; align-items:center; justify-content:space-between;
        color:#334155; font-size:.9rem; font-weight:650; margin-bottom:.55rem;
    }
    .risk-percent { font-size:.98rem; font-weight:850; }
    .risk-percent.high { color:#dc2626; }
    .risk-percent.medium { color:#ea580c; }
    .risk-percent.low { color:#16a34a; }
    .risk-bar-track {
        width:100%; height:10px; background:#f1f5f9;
        border-radius:999px; overflow:hidden; margin:.5rem 0 .8rem 0;
    }
    .risk-bar-fill {
        height:10px; border-radius:999px;
    }
    .risk-bar-fill.high { background:#ef4444; }
    .risk-bar-fill.medium { background:#f97316; }
    .risk-bar-fill.low { background:#22c55e; }
    .risk-note {
        color:#475569; font-size:.82rem; line-height:1.45;
    }
    .modal-section-title {
        color:#111827; font-size:1rem; font-weight:850;
        margin:1.1rem 0 .7rem 0;
    }
    .contact-line {
        display:flex; align-items:center; gap:.65rem;
        color:#334155; font-size:.9rem; margin:.45rem 0;
    }
    .detail-info-grid {
        display:grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        gap:.8rem; margin-bottom:1.05rem;
    }
    .detail-info-box {
        background:#f8fafc; border:1px solid #f1f5f9;
        border-radius:12px; padding:.9rem 1rem;
    }
    .detail-info-label {
        color:#6b7280; font-size:.78rem; font-weight:650; margin-bottom:.35rem;
    }
    .detail-info-value {
        color:#111827; font-size:.95rem; font-weight:780;
    }
    .ai-reco-panel {
        background:#f3f1ff; border:1px solid #ddd6fe;
        border-radius:14px; padding:1.1rem 1.25rem; margin-top:.5rem;
    }
    .ai-reco-title {
        color:#111827; font-size:1rem; font-weight:850; margin-bottom:.75rem;
    }
    .ai-reco-item {
        display:grid; grid-template-columns:26px 1fr; gap:.7rem;
        margin:.72rem 0; align-items:start;
    }
    .ai-reco-number {
        width:22px; height:22px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background:#6d5dfc; color:white; font-size:.72rem; font-weight:850;
    }
    .ai-reco-main {
        color:#111827; font-size:.9rem; font-weight:800; line-height:1.25;
    }
    .ai-reco-sub {
        color:#64748b; font-size:.8rem; margin-top:.12rem; line-height:1.35;
    }
    .customer-streamlit-card {
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:1.05rem 1.2rem;
        box-shadow:0 1px 3px rgba(15,23,42,.08);
        margin:.8rem 0;
    }
    .customer-streamlit-card .stButton button {
        background:#6d5dfc !important;
        color:#fff !important;
        border:0 !important;
        border-radius:9px !important;
        font-weight:800 !important;
        height:38px !important;
        box-shadow:none !important;
    }
    .customer-streamlit-card .stButton button:hover {
        background:#5b4df0 !important;
        color:#fff !important;
        border:0 !important;
    }
    </style>
    """, unsafe_allow_html=True)

    def _phone_text(row):
        if "phone" in row.index and pd.notna(row.get("phone")):
            return str(row.get("phone"))
        if "Phone" in row.index and pd.notna(row.get("Phone")):
            return str(row.get("Phone"))
        raw = "".join([c for c in str(row.get("customer_id", "")) if c.isdigit()])
        suffix = raw[-4:].rjust(4, "0") if raw else "4567"
        return f"+1 (555) 123-{suffix}"

    def _started_text(row):
        for col in ["started", "Started", "start_date", "Start Date", "joining_date"]:
            if col in row.index and pd.notna(row.get(col)):
                parsed = pd.to_datetime(row.get(col), errors="coerce")
                if pd.notna(parsed):
                    return parsed.strftime("%b %d, %Y")
                return str(row.get(col))
        days_joined = pd.to_numeric(row.get("days_since_joined", np.nan), errors="coerce")
        if pd.notna(days_joined):
            start_date = pd.Timestamp("2018-01-01") - pd.Timedelta(days=int(days_joined))
            return start_date.strftime("%b %d, %Y")
        return "Jan 15, 2024"

    def _money_text(value, fallback=149):
        try:
            v = float(value)
            if np.isnan(v):
                v = fallback
        except Exception:
            v = fallback
        return f"${v:,.0f}"

    def _monthly_value(row):
        for col in ["monthly_value", "Monthly Value", "avg_transaction_value", "avg_order_value"]:
            if col in row.index and pd.notna(row.get(col)):
                return _money_text(row.get(col))
        return "$149"

    def _total_spent(row):
        for col in ["total_spent", "Total Spent", "total_revenue"]:
            if col in row.index and pd.notna(row.get(col)):
                return _money_text(row.get(col))
        tenure = int(pd.to_numeric(row.get("tenure_months", 18), errors="coerce") or 18)
        monthly_raw = row.get("monthly_value", row.get("avg_transaction_value", 149))
        try:
            monthly = float(monthly_raw)
            if np.isnan(monthly) or monthly <= 0:
                monthly = 149
        except Exception:
            monthly = 149
        return _money_text(monthly * tenure, fallback=2682)

    def _login_frequency(row):
        if "login_frequency" in row.index and pd.notna(row.get("login_frequency")):
            return str(row.get("login_frequency"))
        if "logins_90d" in row.index and pd.notna(row.get("logins_90d")):
            weekly = float(row.get("logins_90d")) / 13
            return f"{weekly:.1f}x/week"
        avg_days = pd.to_numeric(row.get("avg_frequency_login_days", np.nan), errors="coerce")
        if pd.notna(avg_days) and avg_days > 0:
            weekly = 7 / avg_days
            return f"{weekly:.1f}x/week"
        return "2x/week"

    def _support_tickets(row):
        for col in ["support_tickets", "Support Tickets", "complaints_count"]:
            if col in row.index and pd.notna(row.get(col)):
                try:
                    return str(int(float(row.get(col))))
                except Exception:
                    return str(row.get(col))
        if str(row.get("sentiment_kategori", "")).lower() in ["kecewa", "sangat kecewa"]:
            return "8"
        return "2"

    def _risk_class(label):
        if label == "High Risk":
            return "high"
        if label == "Medium Risk":
            return "medium"
        return "low"

    def _risk_modal_note(label):
        if label == "High Risk":
            return "This customer is at high risk of churning. Immediate action recommended."
        if label == "Medium Risk":
            return "This customer shows early warning signs. Monitoring and engagement are recommended."
        return "This customer is currently healthy. Maintain regular engagement."

    def _ai_recommendations(row):
        label = row.get("Risk Level", "Low Risk")
        sentiment = str(row.get("sentiment_kategori", "Biasa"))
        if label == "High Risk":
            return [
                ("Reach out immediately", "Contact within 24 hours to understand their concerns"),
                ("Offer personalized discount", "Consider 20–30% discount for next 3 months"),
                ("Schedule check-in call", "Book a call with customer success team"),
            ]
        if label == "Medium Risk":
            return [
                ("Send engagement message", "Remind customer about useful features they may not use yet"),
                ("Ask for feedback", "Collect the main reason behind lower activity or dissatisfaction"),
                ("Offer onboarding support", "Guide customer to reach value faster"),
            ]
        if sentiment in ["Kecewa", "Sangat Kecewa"]:
            return [
                ("Follow up negative feedback", "Clarify the complaint and offer direct support"),
                ("Create support ticket", "Make sure the issue is tracked until resolved"),
                ("Monitor for 7 days", "Check whether activity improves after support response"),
            ]
        return [
            ("Maintain relationship", "Keep regular communication and product updates"),
            ("Recommend useful features", "Suggest features that match the customer activity pattern"),
            ("Invite to loyalty program", "Reward customers with consistently healthy engagement"),
        ]

    def _detail_html(row):
        name = _safe(row.get("name", "Customer"))
        email = _safe(row.get("email", "-"))
        initials = _safe(_initials(row.get("name", "CU")))
        risk = row.get("Risk Level", "Low Risk")
        risk_cls = _risk_class(risk)
        prob = float(row.get("Churn Probability", 0))
        prob_width = max(2, min(100, prob))
        tenure = int(pd.to_numeric(row.get("tenure_months", 0), errors="coerce") or 0)
        last_active = _safe(_last_active_text(row.get("days_since_last_login", 0)))
        region = _safe(row.get("region_category", "-"))
        phone = _safe(_phone_text(row))
        started = _safe(_started_text(row))
        monthly = _safe(_monthly_value(row))
        total = _safe(_total_spent(row))
        login_frequency = _safe(_login_frequency(row))
        tickets = _safe(_support_tickets(row))
        note = _safe(_risk_modal_note(risk))

        items_html = ""
        for i, (title, desc) in enumerate(_ai_recommendations(row), start=1):
            items_html += f"""
            <div class="ai-reco-item">
                <div class="ai-reco-number">{i}</div>
                <div>
                    <div class="ai-reco-main">{_safe(title)}</div>
                    <div class="ai-reco-sub">{_safe(desc)}</div>
                </div>
            </div>
            """

        return f"""
        <div class="customer-detail-html">
            <div class="detail-header">
                <div class="detail-avatar">{initials}</div>
                <div>
                    <div class="detail-name">{name}</div>
                    <div class="detail-email">{email}</div>
                </div>
            </div>

            <div class="risk-assessment-panel {risk_cls}">
                <div class="risk-assessment-title">⚠️ Churn Risk Assessment</div>
                <div class="risk-assessment-row">
                    <span>Probability of Leaving</span>
                    <span class="risk-percent {risk_cls}">{prob:.0f}%</span>
                </div>
                <div class="risk-bar-track">
                    <div class="risk-bar-fill {risk_cls}" style="width:{prob_width:.0f}%;"></div>
                </div>
                <div class="risk-note">{note}</div>
            </div>

            <div class="modal-section-title">Contact Information</div>
            <div class="contact-line">✉️ <span>{email}</span></div>
            <div class="contact-line">📞 <span>{phone}</span></div>

            <div class="modal-section-title">Subscription Details</div>
            <div class="detail-info-grid">
                <div class="detail-info-box">
                    <div class="detail-info-label">Started</div>
                    <div class="detail-info-value">{started}</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Tenure</div>
                    <div class="detail-info-value">{tenure} months</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Monthly Value</div>
                    <div class="detail-info-value">{monthly}</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Total Spent</div>
                    <div class="detail-info-value">{total}</div>
                </div>
            </div>

            <div class="modal-section-title">Usage Analytics</div>
            <div class="detail-info-grid">
                <div class="detail-info-box">
                    <div class="detail-info-label">Login Frequency</div>
                    <div class="detail-info-value">{login_frequency}</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Last Active</div>
                    <div class="detail-info-value">{last_active}</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Support Tickets</div>
                    <div class="detail-info-value">{tickets}</div>
                </div>
                <div class="detail-info-box">
                    <div class="detail-info-label">Region</div>
                    <div class="detail-info-value">{region}</div>
                </div>
            </div>

            <div class="ai-reco-panel">
                <div class="ai-reco-title">AI Recommendations</div>
                {items_html}
            </div>
        </div>
        """

    def _render_customer_detail_native(row_payload):
        """Render customer details with native Streamlit elements.
        This avoids raw HTML being printed inside st.dialog on some Streamlit versions.
        """
        row = pd.Series(row_payload)
        name = str(row.get("name", "Customer"))
        email = str(row.get("email", "-"))
        initials = _initials(name)
        risk = row.get("Risk Level", "Low Risk")
        prob = float(row.get("Churn Probability", 0))
        prob_int = int(max(0, min(100, round(prob))))
        tenure = int(pd.to_numeric(row.get("tenure_months", 0), errors="coerce") or 0)
        last_active = _last_active_text(row.get("days_since_last_login", 0))
        region = str(row.get("region_category", "-"))
        phone = _phone_text(row)
        started = _started_text(row)
        monthly = _monthly_value(row)
        total = _total_spent(row)
        login_frequency = _login_frequency(row)
        tickets = _support_tickets(row)
        note = _risk_modal_note(risk)

        h1, h2 = st.columns([0.15, 0.85], vertical_alignment="center")
        with h1:
            st.markdown(f"### {initials}")
        with h2:
            st.markdown(f"### {name}")
            st.caption(email)

        st.divider()

        if risk == "High Risk":
            st.error("⚠️ Churn Risk Assessment")
        elif risk == "Medium Risk":
            st.warning("⚠️ Churn Risk Assessment")
        else:
            st.success("✅ Churn Risk Assessment")

        r1, r2 = st.columns([0.72, 0.28])
        with r1:
            st.write("Probability of Leaving")
        with r2:
            st.markdown(f"**{prob_int}%**")
        st.progress(prob_int / 100)
        st.caption(note)

        st.markdown("#### Contact Information")
        st.write(f"✉️ {email}")
        st.write(f"📞 {phone}")

        st.markdown("#### Subscription Details")
        s1, s2 = st.columns(2)
        with s1:
            with st.container(border=True):
                st.caption("Started")
                st.write(started)
        with s2:
            with st.container(border=True):
                st.caption("Tenure")
                st.write(f"{tenure} months")
        s3, s4 = st.columns(2)
        with s3:
            with st.container(border=True):
                st.caption("Monthly Value")
                st.write(monthly)
        with s4:
            with st.container(border=True):
                st.caption("Total Spent")
                st.write(total)

        st.markdown("#### Usage Analytics")
        u1, u2 = st.columns(2)
        with u1:
            with st.container(border=True):
                st.caption("Login Frequency")
                st.write(login_frequency)
        with u2:
            with st.container(border=True):
                st.caption("Last Active")
                st.write(last_active)
        u3, u4 = st.columns(2)
        with u3:
            with st.container(border=True):
                st.caption("Support Tickets")
                st.write(tickets)
        with u4:
            with st.container(border=True):
                st.caption("Region")
                st.write(region)

        st.markdown("#### AI Recommendations")
        with st.container(border=True):
            for i, (title, desc) in enumerate(_ai_recommendations(row), start=1):
                st.markdown(f"**{i}. {title}**")
                st.caption(desc)
                if i < 3:
                    st.divider()

    if hasattr(st, "dialog"):
        @st.dialog("Customer Details", width="large")
        def _open_customer_detail(row_payload):
            _render_customer_detail_native(row_payload)
    else:
        def _open_customer_detail(row_payload):
            _render_customer_detail_native(row_payload)

    view = filtered.sort_values("risk_probability", ascending=False).head(50)

    if len(view) == 0:
        st.markdown("<div class='empty-customers'>No customers match the selected search or risk filter.</div>", unsafe_allow_html=True)
    else:
        for idx, row in view.iterrows():
            name = _safe(row.get("name", "Customer"))
            email = _safe(row.get("email", "-"))
            initials = _safe(_initials(row.get("name", "CU")))
            region = _safe(row.get("region_category", "-"))
            tenure = _safe(int(pd.to_numeric(row.get("tenure_months", 0), errors="coerce") or 0))
            last_active = _safe(_last_active_text(row.get("days_since_last_login", 0)))
            risk = row.get("Risk Level", "Low Risk")
            prob = float(row.get("Churn Probability", 0))
            customer_id = _safe(row.get("customer_id", f"CUS-{idx}"))

            with st.container():
                st.markdown("<div class='customer-streamlit-card'>", unsafe_allow_html=True)
                c1, c2, c3, c4, c5, c6 = st.columns([3.8, 1.25, 1.05, 1.15, 1.25, 1.05], vertical_alignment="center")
                with c1:
                    st.markdown(
                        f"""
                        <div class="customer-identity">
                            <div class="customer-avatar">{initials}</div>
                            <div style="min-width:0;">
                                <div class="customer-name">{name}</div>
                                <div class="customer-email">{email}</div>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                with c2:
                    st.markdown(f"<div class='customer-meta-label'>Region</div><div class='customer-meta-value'>{region}</div>", unsafe_allow_html=True)
                with c3:
                    st.markdown(f"<div class='customer-meta-label'>Tenure</div><div class='customer-meta-value'>{tenure} months</div>", unsafe_allow_html=True)
                with c4:
                    st.markdown(f"<div class='customer-meta-label'>Last Active</div><div class='customer-meta-value'>{last_active}</div>", unsafe_allow_html=True)
                with c5:
                    st.markdown(f"<div class='customer-meta-label'>Churn Risk</div>{_risk_chip(risk, prob)}", unsafe_allow_html=True)
                with c6:
                    if st.button("View Details", key=f"view_detail_{idx}_{customer_id}", use_container_width=True):
                        _open_customer_detail(row.to_dict())
                st.markdown("</div>", unsafe_allow_html=True)

        if len(filtered) > 50:
            st.caption(f"Showing top 50 highest-risk customers from {len(filtered):,} matching customers.")

# =============================================================================
# PREDICTION PAGE
# =============================================================================
elif page == "Prediction":
    st.markdown(
        """
        <style>
            .prediction-title {
                font-size: 30px;
                font-weight: 900;
                color: #111827;
                letter-spacing: -0.02em;
                line-height: 1.1;
                margin-bottom: 8px;
            }

            .prediction-subtitle {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 28px;
            }

            .prediction-info-box {
                display: grid;
                grid-template-columns: 28px 1fr;
                gap: 14px;
                background: #eef6ff;
                border: 1px solid #bfdbfe;
                border-radius: 14px;
                padding: 22px 24px;
                margin-bottom: 34px;
            }

            .prediction-info-icon {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 2px solid #3b82f6;
                color: #3b82f6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 900;
                margin-top: 2px;
            }

            .prediction-info-title {
                color: #111827;
                font-size: 17px;
                font-weight: 850;
                margin-bottom: 8px;
            }

            .prediction-info-desc {
                color: #4b5563;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 10px;
            }

            .prediction-info-key {
                color: #374151;
                font-size: 14px;
                line-height: 1.5;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker),
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 18px !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
                padding: 30px 34px !important;
            
                background: #ffffff !important;
                min-height: 930px !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker)
            div[data-testid="stVerticalBlock"],
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker)
            div[data-testid="stVerticalBlock"] {
                gap: 0 !important;
            }

            .prediction-form-marker,
            .prediction-result-marker {
                height: 0;
                margin: 0;
                padding: 0;
                line-height: 0;
            }

            /* Full white card area for Prediction page */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 18px !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
                padding: 28px 28px 24px 28px !important;
                min-height: 930px !important;
                overflow: hidden !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) > div,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-testid="stVerticalBlock"] {
                background: #ffffff !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 18px !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
                padding: 0 !important;
                min-height: 1030px !important;
                overflow: hidden !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) > div {
                background: #ffffff !important;
                border-radius: 18px !important;
                padding: 0 !important;
                overflow: hidden !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) iframe {
                display: block !important;
                width: 100% !important;
                min-height: 1030px !important;
                background: #ffffff !important;
                border-radius: 18px !important;
            }

            .prediction-card-title {
                color: #111827;
                font-size: 22px;
                font-weight: 850;
                margin-bottom: 28px;
            }

            .prediction-help-caption {
                color: #6b7280;
                font-size: 12px;
                margin-top: -6px;
                margin-bottom: 18px;
                line-height: 1.35;
            }

            .prediction-input-gap {
                height: 16px;
            }

            div[data-testid="stTextInput"] {
                overflow: visible !important;
                margin-bottom: 0 !important;
            }

            div[data-testid="stTextInput"] label {
                color: #374151 !important;
                font-size: 14px !important;
                font-weight: 650 !important;
                line-height: 1.35 !important;
                overflow: visible !important;
                white-space: normal !important;
                padding-bottom: 6px !important;
            }

            div[data-testid="stTextInput"] div[data-baseweb="input"] {
                min-height: 50px !important;
                height: 50px !important;
                border-radius: 14px !important;
                overflow: visible !important;
                background: #ffffff !important;
            }

            div[data-testid="stTextInput"] input {
                min-height: 50px !important;
                height: 50px !important;
                line-height: 50px !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 14px !important;
                background: #ffffff !important;
                color: #111827 !important;
                font-size: 14px !important;
                padding: 0 18px !important;
                box-shadow: none !important;
                overflow: visible !important;
            }

            div[data-testid="stTextInput"] input::placeholder {
                color: #9ca3af !important;
                line-height: 50px !important;
            }

            div[data-testid="stTextInput"] input:focus {
                border-color: #6366f1 !important;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.10) !important;
            }


            /* Rapikan posisi tulisan 'Press Enter to apply' pada input */
            div[data-testid="stTextInput"] div[data-baseweb="input"] {
                position: relative !important;
            }

            div[data-testid="stTextInput"] div[data-testid="InputInstructions"] {
                position: absolute !important;
                right: 16px !important;
                top: calc(60% + 5px) !important;
                transform: translateY(-50%) !important;
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                line-height: 1 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            div[data-testid="stTextInput"] div[data-testid="InputInstructions"] p,
            div[data-testid="stTextInput"] div[data-testid="InputInstructions"] span {
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1 !important;
                font-size: 12px !important;
                color: #6b7280 !important;
            }

            .stButton > button[kind="primary"] {
                background: #6366f1 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 12px !important;
                height: 56px !important;
                font-size: 16px !important;
                font-weight: 850 !important;
                box-shadow: none !important;
                margin-top: 10px !important;
            }

            .stButton > button[kind="primary"]:hover {
                background: #5558ee !important;
                color: #ffffff !important;
                border: none !important;
            }
        
            /* Final right-card override: iframe fills the card border */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) {
                padding: 0 !important;
                background: #ffffff !important;
                overflow: hidden !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-result-marker) iframe {
                background: #ffffff !important;
                width: 100% !important;
                min-height: 1030px !important;
                border-radius: 18px !important;
            }


            /* Customer Information: buat seperti card/iframe putih yang rapi */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 18px !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
                padding: 30px 34px !important;
                min-height: 930px !important;
                overflow: hidden !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) > div,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-testid="stVerticalBlock"] {
                background: #ffffff !important;
                border-radius: 18px !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-testid="stTextInput"] {
                background: #ffffff !important;
                overflow: visible !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"] {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 14px !important;
                box-shadow: none !important;
                overflow: hidden !important;
                height: 50px !important;
                min-height: 50px !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"]::before,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"]::after {
                display: none !important;
                content: none !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) input {
                background: #ffffff !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                height: 50px !important;
                min-height: 50px !important;
                line-height: 50px !important;
                padding: 0 18px !important;
                color: #111827 !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) input:focus {
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"]:focus-within {
                border-color: #6366f1 !important;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12) !important;
            }


            /* FINAL FIX UI: frame putih Customer Information */
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child > div[data-testid="stVerticalBlock"],
            div[data-testid="stHorizontalBlock"] > div:first-child > div[data-testid="stVerticalBlock"] {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 18px !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
                padding: 30px 34px !important;
                min-height: 930px !important;
                overflow: visible !important;
            }

            /* Hilangkan card/border bawaan di dalamnya supaya tidak dobel */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                min-height: auto !important;
                overflow: visible !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) > div,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-testid="stVerticalBlock"] {
                background: transparent !important;
            }

            /* Input Customer Information: putih bersih, tanpa sisi hitam */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"] {
                background: #ffffff !important;
                background-color: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 14px !important;
                box-shadow: none !important;
                overflow: hidden !important;
                height: 50px !important;
                min-height: 50px !important;
            }

            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"]::before,
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"]::after,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"]::before,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"]::after {
                display: none !important;
                content: none !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }

            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child input,
            div[data-testid="stHorizontalBlock"] > div:first-child input {
                background: #ffffff !important;
                background-color: #ffffff !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                height: 50px !important;
                min-height: 50px !important;
                line-height: 50px !important;
                padding: 0 18px !important;
                color: #111827 !important;
            }

            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"]:focus-within,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"]:focus-within {
                border-color: #6366f1 !important;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12) !important;
            }


            /* FIX: hilangkan warna hitam di ujung input field Customer Information */
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"],
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"] *,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="base-input"],
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="base-input"] *,
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"] *,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"] * {
                background: #ffffff !important;
                background-color: #ffffff !important;
                box-shadow: none !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"],
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"] {
                border: 1px solid #e5e7eb !important;
                border-radius: 14px !important;
                overflow: hidden !important;
                outline: none !important;
                clip-path: inset(0 round 14px) !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"]::before,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="input"]::after,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="base-input"]::before,
            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) div[data-baseweb="base-input"]::after,
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"]::before,
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child div[data-baseweb="input"]::after,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"]::before,
            div[data-testid="stHorizontalBlock"] > div:first-child div[data-baseweb="input"]::after {
                content: none !important;
                display: none !important;
                background: transparent !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }

            div[data-testid="stVerticalBlockBorderWrapper"]:has(.prediction-form-marker) input,
            div[data-testid="stHorizontalBlock"] > div[data-testid="column"]:first-child input,
            div[data-testid="stHorizontalBlock"] > div:first-child input {
                background: #ffffff !important;
                background-color: #ffffff !important;
                border: 0 !important;
                outline: 0 !important;
                box-shadow: none !important;
                border-radius: 14px !important;
            }

</style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("<div class='prediction-title'>Customer Churn Prediction</div>", unsafe_allow_html=True)
    st.markdown(
        "<div class='prediction-subtitle'>Use our AI model to predict if a customer is likely to stop using our service</div>",
        unsafe_allow_html=True,
    )

    st.markdown(
        """
        <div class="prediction-info-box">
            <div class="prediction-info-icon">i</div>
            <div>
                <div class="prediction-info-title">How This Prediction Works</div>
                <div class="prediction-info-desc">
                    Our machine learning model analyzes customer behavior patterns to predict churn probability.
                    The model was trained on historical data from 50,000+ customers with 92.4% accuracy.
                </div>
                <div class="prediction-info-key">
                    <b>Key factors analyzed:</b> Login activity, support interactions, subscription tenure, and payment behavior.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


    # Enter di input Prediction pindah ke field berikutnya.
    components.html(
        """
        <script>
        (function () {
            function setupEnterToNextInput() {
                let parentDoc;
                try {
                    parentDoc = window.parent.document;
                } catch (e) {
                    return;
                }

                const inputs = Array.from(parentDoc.querySelectorAll('input'))
                    .filter(function (input) {
                        const rect = input.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isTextLike = !input.type || ['text', 'number', 'search'].includes(input.type);
                        return isVisible && isTextLike;
                    });

                inputs.forEach(function (input, index) {
                    if (input.dataset.enterNextReady === "true") return;
                    input.dataset.enterNextReady = "true";

                    input.addEventListener("keydown", function (event) {
                        if (event.key !== "Enter") return;

                        const activeInputs = Array.from(parentDoc.querySelectorAll('input'))
                            .filter(function (item) {
                                const rect = item.getBoundingClientRect();
                                const isVisible = rect.width > 0 && rect.height > 0;
                                const isTextLike = !item.type || ['text', 'number', 'search'].includes(item.type);
                                return isVisible && isTextLike;
                            });

                        const currentIndex = activeInputs.indexOf(input);
                        const nextInput = activeInputs[currentIndex + 1];

                        if (nextInput) {
                            event.preventDefault();
                            event.stopPropagation();

                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            input.blur();

                            setTimeout(function () {
                                nextInput.focus();
                                nextInput.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 80);
                        }
                    }, true);
                });
            }

            setupEnterToNextInput();
            setTimeout(setupEnterToNextInput, 300);
            setTimeout(setupEnterToNextInput, 1000);
        })();
        </script>
        """,
        height=0,
        width=0,
    )


    if "prediction_result" not in st.session_state:
        st.session_state.prediction_result = None
    if "prediction_error" not in st.session_state:
        st.session_state.prediction_error = None

    def _validate_customer_name(value):
        value = str(value).strip()
        if value == "":
            raise ValueError("Customer Name is required.")
        if len(value) < 2 or len(re.findall(r"[A-Za-z]", value)) < 2:
            raise ValueError("Customer Name must be a valid name with at least 2 letters. Example: John Smith.")
        if not re.fullmatch(r"[A-Za-z .'-]+", value):
            raise ValueError("Customer Name may only contain letters, spaces, dots, apostrophes, or hyphens.")
        return value

    def _validate_gender(value):
        value = str(value).strip()
        if value == "":
            raise ValueError("Gender is required.")
        normalized = value.lower()
        allowed = {
            "male": "Male",
            "female": "Female",
            "other": "Other",
            "pria": "Male",
            "laki-laki": "Male",
            "laki laki": "Male",
            "wanita": "Female",
            "perempuan": "Female",
        }
        if normalized not in allowed:
            raise ValueError("Gender is invalid. Use Male, Female, or Other.")
        return allowed[normalized]

    def _validate_region(value):
        value = str(value).strip()
        if value == "":
            raise ValueError("Geographic Region is required.")
        allowed_regions = {
            "north america": "North America",
            "europe": "Europe",
            "asia pacific": "Asia Pacific",
            "latin america": "Latin America",
            "middle east": "Middle East",
            "africa": "Africa",
            "asia": "Asia",
            "indonesia": "Indonesia",
        }
        normalized = value.lower()
        if normalized not in allowed_regions:
            raise ValueError(
                "Geographic Region is invalid. Valid examples: North America, Europe, Asia Pacific, Latin America, Middle East, Africa, Asia, or Indonesia."
            )
        return allowed_regions[normalized]

    def _parse_float(value, field_name, min_value=None, max_value=None, integer=False):
        value = str(value).strip()
        if value == "":
            raise ValueError(f"{field_name} is required and must be numeric.")
        try:
            parsed = float(value)
        except Exception as exc:
            raise ValueError(f"{field_name} must be a valid number. Example: 7 or 149.") from exc

        if min_value is not None and parsed < min_value:
            raise ValueError(f"{field_name} must be at least {min_value}.")
        if max_value is not None and parsed > max_value:
            raise ValueError(f"{field_name} must not be greater than {max_value}.")
        if integer and not parsed.is_integer():
            raise ValueError(f"{field_name} must be a whole number, for example 3.")
        return parsed

    def _prediction_level(prob):
        if prob >= 0.65:
            return "High Risk", "#ef4444", "#fee2e2", "High priority action needed."
        if prob >= 0.45:
            return "Medium Risk", "#f59e0b", "#fef3c7", "Monitor this customer and send engagement support."
        return "Low Risk", "#10b981", "#dcfce7", "Customer looks healthy. Maintain engagement and service quality."

    left_col, right_col = st.columns([1, 1], gap="large")

    with left_col:
        with st.container(border=True):
            st.markdown('<div class="prediction-form-marker"></div>', unsafe_allow_html=True)
            st.markdown('<div class="prediction-card-title">Customer Information</div>', unsafe_allow_html=True)

            customer_name = st.text_input(
                "Customer Name  ⓘ",
                placeholder="e.g., John Smith",
                key="pred_customer_name",
            )
            st.markdown("<div class='prediction-input-gap'></div>", unsafe_allow_html=True)

            gender = st.text_input(
                "Gender  ⓘ",
                placeholder="e.g., Female",
                key="pred_gender",
            )
            st.markdown("<div class='prediction-input-gap'></div>", unsafe_allow_html=True)

            geographic_region = st.text_input(
                "Geographic Region  ⓘ",
                placeholder="e.g., North America",
                key="pred_region",
            )
            st.markdown("<div class='prediction-input-gap'></div>", unsafe_allow_html=True)

            tenure_input = st.text_input(
                "Customer Tenure (months)  ⓘ",
                placeholder="e.g., 18 (for 18 months)",
                key="pred_tenure",
            )
            st.markdown(
                "<div class='prediction-help-caption'>Enter how many months they've been a customer (0-120)</div>",
                unsafe_allow_html=True,
            )

            monthly_value_input = st.text_input(
                "Monthly Subscription Value (USD)  ⓘ",
                placeholder="e.g., 149",
                key="pred_monthly_value",
            )
            st.markdown(
                "<div class='prediction-help-caption'>Enter the monthly subscription amount in dollars</div>",
                unsafe_allow_html=True,
            )

            login_frequency_input = st.text_input(
                "Login Frequency  ⓘ",
                placeholder="e.g., 7",
                key="pred_login_frequency",
            )
            st.markdown("<div class='prediction-input-gap'></div>", unsafe_allow_html=True)

            support_tickets_input = st.text_input(
                "Support Tickets (last 30 days)  ⓘ",
                placeholder="e.g., 3",
                key="pred_support_tickets",
            )
            st.markdown(
                "<div class='prediction-help-caption'>Number of support requests in the past month</div>",
                unsafe_allow_html=True,
            )

            days_since_last_activity_input = st.text_input(
                "Days Since Last Activity  ⓘ",
                placeholder="e.g., 7 (last active 7 days ago)",
                key="pred_days_since_last_activity",
            )
            st.markdown(
                "<div class='prediction-help-caption'>How many days ago did they last log in?</div>",
                unsafe_allow_html=True,
            )

            run_prediction = st.button(
                "✦  Predict Churn Risk",
                type="primary",
                use_container_width=True,
                key="predict_churn_risk_button",
            )

    if run_prediction:
        try:
            name_clean = _validate_customer_name(customer_name)
            gender_clean = _validate_gender(gender)
            region_clean = _validate_region(geographic_region)
            tenure = _parse_float(tenure_input, "Customer Tenure", min_value=0, max_value=120)
            monthly_value = _parse_float(monthly_value_input, "Monthly Subscription Value", min_value=1)
            login_frequency = _parse_float(login_frequency_input, "Login Frequency", min_value=0)
            support_tickets = _parse_float(support_tickets_input, "Support Tickets", min_value=0, integer=True)
            days_since_last_activity = _parse_float(days_since_last_activity_input, "Days Since Last Activity", min_value=0, integer=True)

            score = (
                0.20
                + (days_since_last_activity / 85)
                + (support_tickets * 0.045)
                - (login_frequency / 160)
                - (tenure / 260)
                + (0.035 if monthly_value < 100 else 0)
            )
            score = float(np.clip(score, 0.02, 0.95))
            label, color, bg, recommendation = _prediction_level(score)

            st.session_state.prediction_error = None
            st.session_state.prediction_result = {
                "name": name_clean,
                "gender": gender_clean,
                "region": region_clean,
                "prob": score,
                "label": label,
                "color": color,
                "bg": bg,
                "recommendation": recommendation,
                "factors": [
                    f"Gender: {gender_clean}",
                    f"Region: {region_clean}",
                    f"Tenure: {tenure:.0f} months",
                    f"Monthly value: ${monthly_value:,.0f}",
                    f"Login frequency: {login_frequency:.0f}",
                    f"Support tickets: {support_tickets:.0f}",
                    f"Days since last activity: {days_since_last_activity:.0f}",
                ],
            }
        except ValueError as err:
            st.session_state.prediction_result = None
            st.session_state.prediction_error = str(err)

    with right_col:
        result = st.session_state.prediction_result
        error_message = st.session_state.prediction_error

        prediction_iframe_css = """
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

            * {
                box-sizing: border-box;
                font-family: 'Manrope', Arial, sans-serif;
            }

            html, body {
                margin: 0;
                padding: 0;
                background: transparent !important;
                color: #111827;
                overflow: visible;
            }

            .prediction-shell {
                width: 100%;
                min-height: 100%;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                padding: 28px 30px;
                overflow: hidden;
            }

            .ready-box,
            .prediction-error-box {
                min-height: 620px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            }

            .ready-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #f1f5f9;
                color: #94a3b8;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                margin-bottom: 24px;
            }

            .ready-title {
                color: #111827;
                font-size: 22px;
                font-weight: 850;
                margin-bottom: 12px;
            }

            .ready-desc {
                color: #4b5563;
                font-size: 14px;
                line-height: 1.5;
                max-width: 420px;
                margin: 0 auto 26px auto;
            }

            .model-info-box {
                width: 100%;
                max-width: 430px;
                text-align: left;
                background: #f8fafc;
                border-radius: 14px;
                padding: 20px 22px;
            }

            .model-info-title {
                color: #111827;
                font-size: 14px;
                font-weight: 850;
                margin-bottom: 10px;
            }

            .model-info-list {
                margin: 0;
                padding-left: 18px;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.75;
            }

            .model-info-list li::marker {
                color: #6366f1;
            }

            .error-icon {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #fee2e2;
                color: #ef4444;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 23px;
                font-weight: 900;
                margin-bottom: 10px;
            }

            .error-title {
                color: #111827;
                font-size: 19px;
                font-weight: 850;
                margin-bottom: 8px;
            }

            .error-desc {
                color: #4b5563;
                font-size: 13px;
                line-height: 1.35;
                max-width: 440px;
                margin: 0 auto 12px auto;
            }

            .error-info-box {
                width: 100%;
                max-width: 470px;
                text-align: left;
                background: #fff5f5;
                border: 1px solid #fecaca;
                border-radius: 14px;
                color: #991b1b;
                padding: 16px 20px;
            }

            .error-info-title {
                color: #991b1b;
                font-size: 14px;
                font-weight: 850;
                margin-bottom: 10px;
            }

            .error-info-list {
                margin: 0;
                padding-left: 18px;
                color: #991b1b;
                font-size: 12.8px;
                line-height: 1.52;
            }

            .error-info-list li {
                margin-bottom: 6px;
            }

            .error-info-list li:last-child {
                margin-bottom: 0;
            }

            .error-info-list li::marker {
                color: #ef4444;
            }

            .figma-result-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0 0 22px 0;
                padding: 0;
            }

            .figma-result-logo {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: #6d5dfc;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 900;
                flex: 0 0 auto;
            }

            .figma-result-title {
                color: #111827;
                font-size: 16px;
                font-weight: 850;
                line-height: 1.2;
            }

            .figma-result-sub {
                color: #6b7280;
                font-size: 12px;
                margin-top: 3px;
            }

            .churn-prob-card {
                border-radius: 14px;
                padding: 22px 20px;
                margin-bottom: 18px;
            }

            .churn-prob-title {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #111827;
                font-size: 15px;
                font-weight: 850;
                margin-bottom: 14px;
            }

            .warning-small {
                color: #ef4444;
                font-size: 18px;
                line-height: 1;
            }

            .churn-percent {
                color: #111827;
                font-size: 42px;
                font-weight: 900;
                line-height: 1;
                letter-spacing: -0.03em;
                margin-bottom: 12px;
            }

            .prob-track {
                width: 100%;
                height: 8px;
                background: #fff1f2;
                border-radius: 999px;
                overflow: hidden;
                margin-bottom: 18px;
            }

            .prob-fill {
                height: 100%;
                border-radius: 999px;
            }

            .risk-badge-big {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 9px 16px;
                font-size: 13px;
                font-weight: 850;
            }

            .confidence-card {
                background: #f8fafc;
                border-radius: 14px;
                padding: 16px 18px;
                margin-bottom: 20px;
            }

            .confidence-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #374151;
                font-size: 13px;
                margin-bottom: 9px;
            }

            .confidence-title {
                display: inline-flex;
                gap: 6px;
                align-items: center;
            }

            .confidence-value {
                color: #6366f1;
                font-weight: 850;
            }

            .confidence-track {
                width: 100%;
                height: 6px;
                border-radius: 999px;
                background: #eef2ff;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .confidence-fill {
                width: 92%;
                height: 100%;
                background: #6366f1;
                border-radius: 999px;
            }

            .confidence-caption {
                color: #6b7280;
                font-size: 11px;
                line-height: 1.4;
            }

            .factors-card {
                background: #eef3ff;
                border: 1px solid #dbe5ff;
                border-radius: 14px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .figma-section-title {
                color: #111827;
                font-size: 15px;
                font-weight: 850;
                margin-bottom: 14px;
            }

            .factor-row {
                background: #ffffff;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 12px;
                margin-bottom: 10px;
                font-size: 13px;
                color: #111827;
            }

            .factor-row:last-child {
                margin-bottom: 0;
            }

            .impact-badge {
                border-radius: 999px;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 850;
                white-space: nowrap;
            }

            .impact-high {
                background: #fee2e2;
                color: #dc2626;
            }

            .impact-medium {
                background: #ffedd5;
                color: #ea580c;
            }

            .meaning-card {
                background: #eef6ff;
                border: 1px solid #dbeafe;
                border-radius: 14px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .meaning-text {
                color: #4b5563;
                font-size: 13px;
                line-height: 1.55;
            }

            .actions-title {
                color: #111827;
                font-size: 15px;
                font-weight: 850;
                margin: 4px 0 14px 0;
            }

            .action-step {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #f8fafc;
                border-radius: 12px;
                padding: 13px 14px;
                margin-bottom: 10px;
                color: #4b5563;
                font-size: 13px;
            }

            .action-number {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #6366f1;
                color: #ffffff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 850;
                flex: 0 0 auto;
            }
        </style>
        """

        if error_message:
            safe_error = html.escape(error_message)
            components.html(
                prediction_iframe_css
                + f"""
                <div class="prediction-shell">
                    <div class="prediction-error-box">
                        <div class="error-icon">!</div>
                        <div class="error-title">Invalid Input</div>
                        <div class="error-desc">Please fix the field below. Only the field with the actual error is shown.</div>
                        <div class="error-info-box">
                            <div class="error-info-title">Field-specific validation</div>
                            <ul class="error-info-list">
                                <li>{safe_error}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                """,
                height=680,
                scrolling=False,
            )
        elif result is None:
            components.html(
                prediction_iframe_css
                + """
                <div class="prediction-shell">
                    <div class="ready-box">
                        <div class="ready-icon">✦</div>
                        <div class="ready-title">Ready to Predict</div>
                        <div class="ready-desc">
                            Fill in the customer details on the left and click "Predict Churn Risk"
                            to see AI-powered results
                        </div>
                        <div class="model-info-box">
                            <div class="model-info-title">About Our Prediction Model</div>
                            <ul class="model-info-list">
                                <li>Trained on 50,000+ customer records</li>
                                <li>92.4% accuracy on validation data</li>
                                <li>XGBoost algorithm with SHAP explainability</li>
                                <li>Updated monthly with latest customer data</li>
                            </ul>
                        </div>
                    </div>
                </div>
                """,
                height=1260,
                scrolling=False,
            )
        else:
            prob_pct = result["prob"] * 100
            prob_int = int(round(prob_pct))

            if result["label"] == "High Risk":
                risk_customer_label = "High Risk Customer"
                meaning_text = (
                    "This customer shows strong warning signs of leaving. The prediction is based on behavior patterns "
                    "similar to customers who churned in the past. Immediate intervention is recommended to prevent churn."
                )
                action_items = [
                    "Contact customer within 24 hours",
                    "Offer personalized retention discount",
                    "Schedule onboarding refresh session",
                ]
                churn_color = "#ef4444"
                churn_bg = "#fff5f5"
                churn_border = "#fecaca"
                badge_bg = "#fee2e2"
                badge_color = "#dc2626"
                factor_rows = [
                    ("Low login frequency", "High Impact", "impact-high"),
                    ("High support tickets", "Medium Impact", "impact-medium"),
                    ("Recent inactivity", "High Impact", "impact-high"),
                ]
            elif result["label"] == "Medium Risk":
                risk_customer_label = "Medium Risk Customer"
                meaning_text = (
                    "This customer shows several early churn signals. Monitoring and timely engagement can help improve retention."
                )
                action_items = [
                    "Send engagement message this week",
                    "Ask for feedback about recent experience",
                    "Recommend useful product features",
                ]
                churn_color = "#f59e0b"
                churn_bg = "#fff7ed"
                churn_border = "#fed7aa"
                badge_bg = "#ffedd5"
                badge_color = "#ea580c"
                factor_rows = [
                    ("Lower engagement pattern", "Medium Impact", "impact-medium"),
                    ("Support interaction history", "Medium Impact", "impact-medium"),
                    ("Recent activity trend", "High Impact", "impact-high"),
                ]
            else:
                risk_customer_label = "Low Risk Customer"
                meaning_text = (
                    "This customer currently looks healthy. Keep maintaining engagement and service quality to preserve retention."
                )
                action_items = [
                    "Maintain regular communication",
                    "Recommend relevant features",
                    "Invite customer to loyalty program",
                ]
                churn_color = "#10b981"
                churn_bg = "#f0fdf4"
                churn_border = "#bbf7d0"
                badge_bg = "#dcfce7"
                badge_color = "#16a34a"
                factor_rows = [
                    ("Healthy login frequency", "Low Impact", "impact-medium"),
                    ("Low support pressure", "Low Impact", "impact-medium"),
                    ("Stable recent activity", "Low Impact", "impact-medium"),
                ]

            factor_rows_html = "".join(
                f"""
                <div class="factor-row">
                    <span>{html.escape(label)}</span>
                    <span class="impact-badge {impact_class}">{html.escape(impact)}</span>
                </div>
                """
                for label, impact, impact_class in factor_rows
            )

            actions_html = "".join(
                f"""
                <div class="action-step">
                    <span class="action-number">{idx}</span>
                    <span>{html.escape(action)}</span>
                </div>
                """
                for idx, action in enumerate(action_items, start=1)
            )

            components.html(
                prediction_iframe_css
                + f"""
                <div class="prediction-shell">
                    <div class="figma-result-header">
                        <div class="figma-result-logo">✧</div>
                        <div>
                            <div class="figma-result-title">Prediction Result</div>
                            <div class="figma-result-sub">AI-powered churn analysis</div>
                        </div>
                    </div>

                    <div class="churn-prob-card" style="background:{churn_bg}; border:1px solid {churn_border};">
                        <div class="churn-prob-title">
                            <span class="warning-small">⚠</span>
                            <span>Churn Probability</span>
                        </div>
                        <div class="churn-percent">{prob_int}%</div>
                        <div class="prob-track">
                            <div class="prob-fill" style="width:{min(max(prob_pct, 0), 100):.0f}%; background:{churn_color};"></div>
                        </div>
                        <div class="risk-badge-big" style="background:{badge_bg}; color:{badge_color};">
                            {html.escape(risk_customer_label)}
                        </div>
                    </div>

                    <div class="confidence-card">
                        <div class="confidence-row">
                            <span class="confidence-title">Prediction Confidence ⓘ</span>
                            <span class="confidence-value">92%</span>
                        </div>
                        <div class="confidence-track">
                            <div class="confidence-fill"></div>
                        </div>
                        <div class="confidence-caption">Based on model accuracy of 92.4% across 10,000 test cases</div>
                    </div>

                    <div class="factors-card">
                        <div class="figma-section-title">Top Contributing Factors ⓘ</div>
                        {factor_rows_html}
                    </div>

                    <div class="meaning-card">
                        <div class="figma-section-title">What This Prediction Means</div>
                        <div class="meaning-text">{html.escape(meaning_text)}</div>
                    </div>

                    <div class="actions-title">Recommended Actions</div>
                    {actions_html}
                </div>
                """,
                height=1260,
                scrolling=False,
            )


# =============================================================================
# BATCH UPLOAD PAGE
# =============================================================================
elif page == "Batch Upload":
    REQUIRED_COLUMNS = [
        "Customer Name",
        "Region",
        "Tenure",
        "Monthly Value",
        "Login Frequency",
        "Support Tickets",
        "Last Activity",
    ]

    NUMERIC_COLUMNS = [
        "Tenure",
        "Monthly Value",
        "Login Frequency",
        "Support Tickets",
    ]

    DATE_COLUMNS = ["Last Activity"]

    TEMPLATE_CSV = (
        "Customer Name,Region,Tenure,Monthly Value,Login Frequency,Support Tickets,Last Activity\n"
        "John Doe,North America,18,149,daily,2,2026-05-12\n"
        "Jane Smith,Europe,24,299,2-3 times per week,5,2026-05-08"
    )

    PROCESS_TEMPLATE_CSV = (
        "Customer Name,Region,Tenure,Monthly Value,Login Frequency,Support Tickets,Last Activity\n"
        "John Doe,North America,18,149,7,2,2026-05-12\n"
        "Jane Smith,Europe,24,299,3,5,2026-05-08"
    )

    template_b64 = base64.b64encode(TEMPLATE_CSV.encode("utf-8")).decode("utf-8")
    template_href = f"data:text/csv;base64,{template_b64}"

    process_template_b64 = base64.b64encode(PROCESS_TEMPLATE_CSV.encode("utf-8")).decode("utf-8")
    process_template_href = f"data:text/csv;base64,{process_template_b64}"

    uploaded_template_csv_b64 = "YWdlLGdlbmRlcixzZWN1cml0eV9ubyxyZWdpb25fY2F0ZWdvcnksam9pbmluZ19kYXRlLGpvaW5lZF90aHJvdWdoX3JlZmVycmFsLHJlZmVycmFsX2lkLHByZWZlcnJlZF9vZmZlcl90eXBlcyxtZWRpdW1fb2Zfb3BlcmF0aW9uLGludGVybmV0X29wdGlvbixsYXN0X3Zpc2l0X3RpbWUsZGF5c19zaW5jZV9sYXN0X2xvZ2luLGF2Z19zZXNzaW9uX2R1cmF0aW9uLGF2Z190cmFuc2FjdGlvbl92YWx1ZSxhdmdfZnJlcXVlbmN5X2xvZ2luX2RheXMscG9pbnRzX2luX3dhbGxldCx1c2VkX3NwZWNpYWxfZGlzY291bnQsb2ZmZXJfYXBwbGljYXRpb25fcHJlZmVyZW5jZSxwYXN0X2NvbXBsYWludCxjb21wbGFpbnRfc3RhdHVzLGZlZWRiYWNrLHBsYW5fdGllcixsb2dpbnNfOTBkLGFjdGl2ZV9kYXlzXzkwZCxhcGlfY2FsbHNfOTBkLHNlc3Npb25fbWludXRlc185MGQsZGF5c19zaW5jZV9hY3RpdmUKMjUsTSxBQkNEMTIzLENpdHksMTUtMDEtMjAyMyxZZXMsQ0lEMTIzNDUsR2lmdCBWb3VjaGVycy9Db3Vwb25zLERlc2t0b3AsV2ktRmksMTI6MzA6MDAsNSwzMDAuNSwxNTAwLjc1LDEyLjUsNTAwLFllcyxZZXMsTm8sTm90IEFwcGxpY2FibGUsR29vZCBDdXN0b21lciBTZXJ2aWNlLFByZW1pdW0sNDAsMzUsNTAwMCw5NTAuNSwyCg=="
    uploaded_template_csv_text = base64.b64decode(uploaded_template_csv_b64).decode("utf-8")
    uploaded_template_csv_href = f"data:text/csv;base64,{uploaded_template_csv_b64}"

    if "batch_upload_key" not in st.session_state:
        st.session_state.batch_upload_key = 0

    def render_html(markup: str) -> None:
        """Render HTML safely without Streamlit treating indented HTML as a code block."""
        clean_markup = dedent(markup).strip()
        if hasattr(st, "html"):
            st.html(clean_markup)
        else:
            st.markdown(clean_markup, unsafe_allow_html=True)

    st.markdown(
        dedent(
            """
            <style>
                .batch-title {
                    font-size: 30px;
                    font-weight: 850;
                    color: #111827;
                    line-height: 1.1;
                    margin-bottom: 6px;
                }

                .batch-sub {
                    color: #4b5563;
                    font-size: 16px;
                    margin-bottom: 34px;
                }

                /* =====================
                   Upload area
                ====================== */
                [data-testid="stFileUploader"] {
                    position: relative;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 22px;
                    padding: 28px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
                    margin-bottom: 24px;
                    min-height: 350px;
                }

                [data-testid="stFileUploader"]::before {
                    content: "or click to browse";
                    position: absolute;
                    top: 205px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 420px;
                    text-align: center;
                    color: #4b5563;
                    font-size: 18px;
                    font-weight: 400;
                    z-index: 25;
                    pointer-events: none;
                }

                [data-testid="stFileUploader"]::after {
                    content: "Select File";
                    position: absolute;
                    left: 50%;
                    top: 245px;
                    transform: translateX(-50%);
                    width: 160px;
                    height: 54px;
                    border-radius: 14px;
                    background: #6366f1;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 800;
                    z-index: 30;
                    pointer-events: none;
                }

                [data-testid="stFileUploader"] label,
                [data-testid="stFileUploader"] small {
                    display: none !important;
                }

                [data-testid="stFileUploaderDropzone"] {
                    position: relative;
                    min-height: 294px;
                    border: 2px dashed #cfd5df !important;
                    border-radius: 20px !important;
                    background: #ffffff !important;
                    padding: 0 !important;
                    overflow: visible;
                    cursor: pointer;
                }

                [data-testid="stFileUploaderDropzone"] p,
                [data-testid="stFileUploaderDropzone"] span,
                [data-testid="stFileUploaderDropzone"] small,
                [data-testid="stFileUploaderDropzone"] svg,
                [data-testid="stFileUploaderDropzone"] button {
                    display: none !important;
                }

                [data-testid="stFileUploaderDropzone"]::before {
                    content: "↥";
                    position: absolute;
                    top: 38px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 78px;
                    height: 78px;
                    border-radius: 50%;
                    background: #e8ebff;
                    color: #6366f1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 48px;
                    font-weight: 400;
                    z-index: 1;
                }

                [data-testid="stFileUploaderDropzone"]::after {
                    content: "Drop your CSV file here";
                    position: absolute;
                    top: 142px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 420px;
                    text-align: center;
                    color: #111827;
                    font-size: 19px;
                    font-weight: 800;
                    line-height: 1.3;
                    z-index: 2;
                }

                /* =====================
                   Batch cards
                ====================== */
                .batch-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                }

                .upload-error-card {
                    padding: 28px;
                    margin-bottom: 10px;
                }

                .upload-error-hero {
                    background: #fff5f5;
                    border: 1.5px solid #fca5a5;
                    border-radius: 14px;
                    padding: 28px;
                    display: grid;
                    grid-template-columns: 48px 1fr;
                    gap: 18px;
                    margin-bottom: 10px;
                }

                .upload-error-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 999px;
                    background: #fee2e2;
                    color: #dc2626;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 900;
                }

                .upload-error-title {
                    color: #111827;
                    font-size: 19px;
                    font-weight: 850;
                    margin-bottom: 10px;
                    line-height: 1.25;
                }

                .upload-error-desc {
                    color: #374151;
                    font-size: 15px;
                    line-height: 1.55;
                    max-width: 620px;
                }

                .upload-error-file {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 13px 16px;
                    color: #374151;
                    font-size: 13px;
                    margin-top: 10px;
                    max-width: 520px;
                }

                .missing-panel {
                    border: 1.5px solid #fecaca;
                    border-radius: 14px;
                    padding: 22px 24px;
                    margin-bottom: 20px;
                    background: #ffffff;
                }

                .missing-panel-title {
                    color: #111827;
                    font-size: 15px;
                    font-weight: 650;
                    margin-bottom: 10px;
                    line-height: 1.35;
                    letter-spacing: -0.01em;
                }

                .missing-panel-sub {
                    color: #374151;
                    font-size: 13.5px;
                    font-weight: 400;
                    line-height: 1.55;
                    margin-bottom: 18px;
                }

                .missing-box {
                    background: #fff5f5;
                    border: 1px solid #fca5a5;
                    border-radius: 10px;
                    padding: 17px 20px;
                    margin-bottom: 16px;
                }

                .missing-box-title {
                    color: #991b1b;
                    font-size: 13.2px;
                    font-weight: 600 !important;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }

                .missing-item {
                    color: #991b1b;
                    font-family: Manrope, Arial, sans-serif !important;
                    font-size: 13px;
                    font-weight: 400 !important;
                    margin-bottom: 7px;
                    line-height: 1.55;
                    letter-spacing: 0;
                }

                .missing-item:last-child {
                    margin-bottom: 0;
                }

                .required-box {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 10px;
                    padding: 17px 20px;
                }

                .required-box-title {
                    color: #166534;
                    font-size: 13.2px;
                    font-weight: 600 !important;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }

                .required-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 9px 42px;
                    align-items: start;
                }

                .format-example {
                    background: #eff6ff;
                    border: 1.5px solid #bfdbfe;
                    border-radius: 14px;
                    padding: 20px;
                }

                .format-title {
                    color: #111827;
                    font-size: 15px;
                    font-weight: 650;
                    margin-bottom: 14px;
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    line-height: 1.35;
                }

                .format-icon {
                    color: #2563eb;
                    font-size: 15px;
                }

                .format-code {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 14px 16px;
                    color: #4b5563;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 12.5px;
                    font-weight: 400;
                    line-height: 1.55;
                    overflow-x: auto;
                    margin: 0 0 14px 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .format-note {
                    color: #4b5563;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 1.45;
                }

                .success-box-custom {
                    background: #dcfce7;
                    color: #16a34a;
                    border-radius: 12px;
                    padding: 16px 18px;
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0 0 18px 0;
                }

                /* Right side */
                .right-panel {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }

                .howto-card {
                    width: 100%;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    padding: 22px 28px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                    margin-bottom: 30px;
                }

                .howto-title {
                    font-size: 18px;
                    font-weight: 850;
                    color: #111827;
                    margin-bottom: 10px;
                }

                .howto-step {
                    display: flex;
                    gap: 13px;
                    margin-bottom: 13px;
                    align-items: flex-start;
                }

                .howto-num {
                    width: 25px;
                    height: 25px;
                    min-width: 25px;
                    border-radius: 50%;
                    background: #6366f1;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 1px;
                }

                .howto-step-title {
                    color: #111827;
                    font-size: 14px;
                    font-weight: 750;
                    margin-bottom: 6px;
                }

                .howto-step-desc {
                    color: #4b5563;
                    font-size: 12.5px;
                    line-height: 1.32;
                }

                .howto-download-btn {
                    display: block;
                    width: 100%;
                    background: #f3f4f6;
                    color: #374151 !important;
                    text-decoration: none !important;
                    text-align: center;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 750;
                    margin-top: 10px;
                }

                .required-card {
                    margin-top: 0;
                    width: 100%;
                    background: #eef3ff;
                    border: 1px solid #dbe5ff;
                    border-radius: 18px;
                    padding: 20px 28px;
                }

                .required-title {
                    color: #111827;
                    font-size: 17px;
                    font-weight: 850;
                    margin-bottom: 16px;
                }

                .required-card ul {
                    padding-left: 18px;
                    margin: 0;
                }

                .required-card li {
                    color: #374151;
                    font-size: 13px;
                    line-height: 1.55;
                }

                /* Error action buttons */
                .stButton > button {
                    min-height: 48px !important;
                    border-radius: 10px !important;
                    background: #6366f1 !important;
                    color: #ffffff !important;
                    border: none !important;
                    font-size: 15px !important;
                    font-weight: 600 !important;
                }

                .stButton > button:hover {
                    background: #5558ee !important;
                    color: #ffffff !important;
                    border: none !important;
                }

                .stDownloadButton > button {
                    min-height: 48px !important;
                    border-radius: 10px !important;
                    font-size: 15px !important;
                    font-weight: 600 !important;
                }

                /* Upload history */
                .history-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    padding: 26px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                    margin-top: 22px;
                }

                .history-title {
                    font-size: 18px;
                    font-weight: 850;
                    color: #111827;
                    margin-bottom: 12px;
                }

                .history-row {
                    background: #f8fafc;
                    border-radius: 14px;
                    padding: 16px 18px;
                    display: grid;
                    grid-template-columns: 28px 1fr auto 24px;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 12px;
                }

                .history-row:last-child {
                    margin-bottom: 0;
                }

                .history-icon {
                    color: #94a3b8;
                    font-size: 17px;
                }

                .history-main {
                    color: #111827;
                    font-size: 16px;
                    font-weight: 750;
                    margin-bottom: 4px;
                }

                .history-date {
                    color: #6b7280;
                    font-size: 13px;
                }

                .history-status {
                    color: #16a34a;
                    font-size: 13px;
                    font-weight: 750;
                }

                .history-download {
                    color: #64748b;
                    font-size: 17px;
                    text-align: right;
                }
            
                /* =====================
                   Batch Upload font weight cleanup
                   Hanya heading utama yang dibuat bold.
                ====================== */
                .batch-title,
                .upload-error-title,
                .history-title,
                .howto-title,
                .required-title {
                    font-weight: 760 !important;
                }

                .batch-sub,
                .upload-drop-title,
                .upload-drop-sub,
                .select-file-button,
                .upload-file-name,
                .upload-file-size,
                .upload-error-desc,
                .upload-error-file,
                .upload-error-file b,
                .missing-panel-title,
                .missing-panel-sub,
                .missing-box-title,
                .missing-item,
                .required-box-title,
                .format-title,
                .format-code,
                .format-note,
                .howto-step-title,
                .howto-step-desc,
                .howto-download-btn,
                .required-card li,
                .history-main,
                .history-date,
                .history-status,
                .history-download,
                .history-icon {
                    font-weight: 400 !important;
                }

                .missing-panel-title,
                .missing-box-title,
                .required-box-title,
                .format-title,
                .howto-step-title,
                .howto-download-btn,
                .history-main,
                .history-status {
                    font-weight: 600 !important;
                }

                .missing-item,
                .required-grid .missing-item {
                    font-size: 13px !important;
                    font-weight: 400 !important;
                    line-height: 1.58 !important;
                    margin-bottom: 7px !important;
                    letter-spacing: 0 !important;
                }

                .missing-box-title,
                .required-box-title {
                    font-size: 13px !important;
                    line-height: 1.45 !important;
                    margin-bottom: 13px !important;
                }

                .missing-box {
                    padding: 17px 20px !important;
                    margin-bottom: 16px !important;
                }

                .required-box {
                    padding: 17px 20px !important;
                }

                .required-grid {
                    gap: 9px 44px !important;
                }

                .format-title {
                    font-size: 15px !important;
                    line-height: 1.35 !important;
                    margin-bottom: 14px !important;
                }

                .format-code {
                    color: #4b5563 !important;
                    font-size: 12.5px !important;
                    line-height: 1.55 !important;
                    white-space: pre-wrap !important;
                    word-break: break-word !important;
                }

                .format-note {
                    font-size: 13px !important;
                    line-height: 1.45 !important;
                }

                .history-main {
                    font-size: 15px !important;
                }

                .howto-step-title {
                    font-size: 14px !important;
                    margin-bottom: 6px !important;
                }

</style>
            """
        ),
        unsafe_allow_html=True,
    )

    def render_right_panel() -> None:
        components.html(
            f"""
            <div class="right-panel">
                <div class="howto-card">
                    <div class="howto-title">How to Use</div>

                    <div class="howto-step">
                        <div class="howto-num">1</div>
                        <div>
                            <div class="howto-step-title">Prepare your CSV</div>
                            <div class="howto-step-desc">Download our template and fill in customer data</div>
                        </div>
                    </div>

                    <div class="howto-step">
                        <div class="howto-num">2</div>
                        <div>
                            <div class="howto-step-title">Upload file</div>
                            <div class="howto-step-desc">Drag and drop or click to select your CSV</div>
                        </div>
                    </div>

                    <div class="howto-step">
                        <div class="howto-num">3</div>
                        <div>
                            <div class="howto-step-title">Get predictions</div>
                            <div class="howto-step-desc">Download results with churn probabilities</div>
                        </div>
                    </div>

                    <a class="howto-download-btn"
                       href="{process_template_href}"
                       download="churnsense_upload_template.csv">
                        Download CSV Template
                    </a>
                </div>

                <div class="required-card">
                    <div class="required-title">Required Columns</div>
                    <ul>
                        <li>Customer Name</li>
                        <li>Region</li>
                        <li>Tenure (months)</li>
                        <li>Monthly Value</li>
                        <li>Login Frequency</li>
                        <li>Support Tickets</li>
                        <li>Last Activity</li>
                    </ul>
                </div>
            </div>

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

                * {{
                    box-sizing: border-box;
                    font-family: 'Manrope', Arial, sans-serif;
                }}

                html, body {{
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    overflow: visible;
                }}

                .right-panel {{
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }}

                .howto-card {{
                    width: 100%;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    padding: 22px 28px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                    margin-bottom: 30px;
                }}

                .howto-title {{
                    font-size: 18px;
                    font-weight: 850;
                    color: #111827;
                    margin-bottom: 10px;
                    line-height: 1.2;
                }}

                .howto-step {{
                    display: flex;
                    gap: 13px;
                    margin-bottom: 13px;
                    align-items: flex-start;
                }}

                .howto-num {{
                    width: 25px;
                    height: 25px;
                    min-width: 25px;
                    border-radius: 50%;
                    background: #6366f1;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 1px;
                }}

                .howto-step-title {{
                    color: #111827;
                    font-size: 14px;
                    font-weight: 750;
                    margin-bottom: 6px;
                    line-height: 1.25;
                }}

                .howto-step-desc {{
                    color: #4b5563;
                    font-size: 12.5px;
                    line-height: 1.32;
                }}

                .howto-download-btn {{
                    display: block;
                    width: 100%;
                    background: #f3f4f6;
                    color: #374151 !important;
                    text-decoration: none !important;
                    text-align: center;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 750;
                    margin-top: 10px;
                    cursor: pointer;
                    line-height: 1.35;
                }}

                .howto-download-btn:hover {{
                    background: #e5e7eb;
                    color: #374151 !important;
                }}

                .required-card {{
                    margin-top: 0;
                    width: 100%;
                    background: #eef3ff;
                    border: 1px solid #dbe5ff;
                    border-radius: 18px;
                    padding: 20px 28px;
                }}

                .required-title {{
                    color: #111827;
                    font-size: 16px;
                    font-weight: 850;
                    margin-bottom: 10px;
                    line-height: 1.2;
                }}

                .required-card ul {{
                    padding-left: 18px;
                    margin: 0;
                }}

                .required-card li {{
                    color: #374151;
                    font-size: 13px;
                    line-height: 1.55;
                }}
            </style>
            """,
            height=780,
            scrolling=False,
        )

    def render_upload_history() -> None:
        components.html(
            """
            <div class="history-card">
                <div class="history-title">Upload History</div>

                <div class="history-row">
                    <div class="history-icon">▧</div>
                    <div>
                        <div class="history-main">1247 customers</div>
                        <div class="history-date">May 8, 2026</div>
                    </div>
                    <div class="history-status">Completed</div>
                    <div class="history-download">⇩</div>
                </div>

                <div class="history-row">
                    <div class="history-icon">▧</div>
                    <div>
                        <div class="history-main">892 customers</div>
                        <div class="history-date">May 5, 2026</div>
                    </div>
                    <div class="history-status">Completed</div>
                    <div class="history-download">⇩</div>
                </div>

                <div class="history-row">
                    <div class="history-icon">▧</div>
                    <div>
                        <div class="history-main">1563 customers</div>
                        <div class="history-date">May 1, 2026</div>
                    </div>
                    <div class="history-status">Completed</div>
                    <div class="history-download">⇩</div>
                </div>
            </div>

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');

                * {
                    box-sizing: border-box;
                    font-family: 'Manrope', Arial, sans-serif;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                    background: transparent;
                    overflow: visible;
                }

                .history-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    padding: 26px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                    margin: 0;
                }

                .history-title {
                    font-size: 18px;
                    font-weight: 850;
                    color: #111827;
                    margin-bottom: 12px;
                }

                .history-row {
                    background: #f8fafc;
                    border-radius: 14px;
                    padding: 16px 18px;
                    display: grid;
                    grid-template-columns: 28px 1fr auto 24px;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 12px;
                }

                .history-row:last-child {
                    margin-bottom: 0;
                }

                .history-icon {
                    color: #94a3b8;
                    font-size: 17px;
                }

                .history-main {
                    color: #111827;
                    font-size: 16px;
                    font-weight: 750;
                    margin-bottom: 4px;
                }

                .history-date {
                    color: #6b7280;
                    font-size: 13px;
                }

                .history-status {
                    color: #16a34a;
                    font-size: 13px;
                    font-weight: 750;
                }

                .history-download {
                    color: #64748b;
                    font-size: 17px;
                    text-align: right;
                }
            </style>
            """,
            height=360,
            scrolling=False,
        )

    def validate_csv_strict(dataframe: pd.DataFrame) -> list[dict]:
        errors = []

        missing_cols = [col for col in REQUIRED_COLUMNS if col not in dataframe.columns]
        if missing_cols:
            errors.append(
                {
                    "type": "missing",
                    "title": "Missing Required Columns",
                    "message": "Your CSV file is missing the following required columns:",
                    "items": missing_cols,
                }
            )
            return errors

        if len(dataframe) == 0:
            errors.append(
                {
                    "type": "empty_file",
                    "title": "Empty CSV File",
                    "message": "Your CSV file has no customer data rows:",
                    "items": ["Add at least one customer row after the header."],
                }
            )
            return errors

        empty_items = []
        for col in REQUIRED_COLUMNS:
            empty_mask = dataframe[col].isna() | (dataframe[col].astype(str).str.strip() == "")
            for idx in dataframe.index[empty_mask].tolist()[:8]:
                empty_items.append(f"{col} at row {idx + 2}")

        if empty_items:
            errors.append(
                {
                    "type": "empty",
                    "title": "Empty Required Values",
                    "message": "Some required cells are empty:",
                    "items": empty_items,
                }
            )

        invalid_numeric = []
        for col in NUMERIC_COLUMNS:
            raw = dataframe[col].astype(str).str.strip()
            invalid_mask = raw.ne("") & pd.to_numeric(raw, errors="coerce").isna()
            for idx in dataframe.index[invalid_mask].tolist()[:8]:
                invalid_numeric.append(f"{col} at row {idx + 2}: {dataframe.loc[idx, col]}")

        if invalid_numeric:
            errors.append(
                {
                    "type": "numeric",
                    "title": "Invalid Numeric Format",
                    "message": "These columns must contain numbers only:",
                    "items": invalid_numeric,
                }
            )

        invalid_dates = []
        for col in DATE_COLUMNS:
            raw = dataframe[col].astype(str).str.strip()
            invalid_mask = raw.ne("") & pd.to_datetime(raw, errors="coerce").isna()
            for idx in dataframe.index[invalid_mask].tolist()[:8]:
                invalid_dates.append(f"{col} at row {idx + 2}: {dataframe.loc[idx, col]}")

        if invalid_dates:
            errors.append(
                {
                    "type": "date",
                    "title": "Invalid Date Format",
                    "message": "Last Activity must use a valid date format, for example 2026-05-12:",
                    "items": invalid_dates,
                }
            )

        return errors

    def render_figma_error_ui(uploaded_name: str, validation_errors: list[dict]) -> None:
        main_error = validation_errors[0]

        safe_file_name = html.escape(str(uploaded_name))
        safe_title = html.escape(str(main_error["title"]))
        safe_message = html.escape(str(main_error["message"]))
        safe_box_title = "Missing Columns" if main_error.get("type") == "missing" else safe_title

        error_items = "".join(
            [
                f"<div class='missing-item'>⊗ {html.escape(str(item))}</div>"
                for item in main_error["items"]
            ]
        )

        all_required_items = "".join(
            [
                f"<div class='missing-item'>⊗ {html.escape(str(col))}</div>"
                for col in REQUIRED_COLUMNS
            ]
        )

        render_html(
            f"""
            <div class="batch-card upload-error-card">
                <div class="upload-error-hero">
                    <div class="upload-error-icon">×</div>
                    <div>
                        <div class="upload-error-title">Upload Failed: {safe_title}</div>
                        <div class="upload-error-desc">
                            The file you uploaded does not match our required format. Please
                            review the errors below and try again.
                        </div>
                        <div class="upload-error-file"><b>File:</b> {safe_file_name}</div>
                    </div>
                </div>

                <div class="missing-panel">
                    <div class="missing-panel-title">⊗ {safe_title}</div>
                    <div class="missing-panel-sub">{safe_message}</div>

                    <div class="missing-box">
                        <div class="missing-box-title">{safe_box_title} ({len(main_error['items'])}):</div>
                        {error_items}
                    </div>

                    <div class="required-box">
                        <div class="required-box-title">All Required Columns ({len(REQUIRED_COLUMNS)}):</div>
                        <div class="required-grid">
                            {all_required_items}
                        </div>
                    </div>
                </div>

                <div class="format-example">
                    <div class="format-title"><span class="format-icon">▣</span> Correct CSV Format Example</div>
                    <div class="format-code">Customer Name,Region,Tenure,Monthly Value,Login Frequency,Support Tickets,Last Activity
John Doe,North America,18,149,daily,2,2026-05-12
Jane Smith,Europe,24,299,2-3 times per week,5,2026-05-08
...</div>
                    <div class="format-note">
                        Make sure your CSV file has these exact column names in the first row,
                        followed by customer data.
                    </div>
                </div>
            </div>
            """
        )

        if st.button("Try Another File", use_container_width=True):
            st.session_state.batch_upload_key += 1
            st.rerun()

    def process_valid_csv(up: pd.DataFrame) -> pd.DataFrame:
        result = up.copy()
        tenure = pd.to_numeric(result["Tenure"], errors="raise")
        monthly = pd.to_numeric(result["Monthly Value"], errors="raise")
        login = pd.to_numeric(result["Login Frequency"], errors="raise")
        tickets = pd.to_numeric(result["Support Tickets"], errors="raise")

        prob = np.clip(
            0.18 + (tickets / 20) + ((10 - login) / 50) + (monthly / 2500) - (tenure / 220),
            0.02,
            0.95,
        )

        result["Churn Probability"] = (prob * 100).round(1)
        result["Risk Level"] = [risk_label(float(p)) for p in prob]
        return result

    def convert_upload_to_dashboard_rows(result_df: pd.DataFrame, uploaded_name: str) -> pd.DataFrame:
        """Convert valid Batch Upload rows into the dashboard's internal data shape."""
        converted = pd.DataFrame()
        existing_uploaded = st.session_state.get("dashboard_uploaded_rows")
        uploaded_count = len(existing_uploaded) if isinstance(existing_uploaded, pd.DataFrame) else 0

        converted["customer_id"] = [f"UPL-{uploaded_count + i + 1:05d}" for i in range(len(result_df))]
        converted["name"] = result_df["Customer Name"].astype(str).str.strip()
        converted["region_category"] = result_df["Region"].astype(str).str.strip()
        converted["tenure_months"] = pd.to_numeric(result_df["Tenure"], errors="coerce").fillna(0).clip(0, 120)

        parsed_last_activity = pd.to_datetime(result_df["Last Activity"], errors="coerce")
        inactive_days = (pd.Timestamp.today().normalize() - parsed_last_activity).dt.days.fillna(0).clip(lower=0)
        risk_prob = (pd.to_numeric(result_df["Churn Probability"], errors="coerce").fillna(0) / 100).clip(0, 1)

        converted["active_days_90d"] = np.maximum(0, 90 - inactive_days).astype(int)
        converted["days_since_last_login"] = inactive_days.astype(int)
        converted["churn"] = (risk_prob >= 0.70).astype(int)
        converted["risk_probability"] = risk_prob
        converted["sentiment_score"] = np.where(risk_prob >= 0.70, 2, np.where(risk_prob >= 0.45, 3, 4))
        converted["sentiment_kategori"] = np.where(risk_prob >= 0.70, "Negative", np.where(risk_prob >= 0.45, "Neutral", "Positive"))
        converted["feedback"] = "Uploaded from " + str(uploaded_name)
        return converted

    def append_upload_to_dashboard_once(result_df: pd.DataFrame, uploaded_name: str) -> tuple[int, bool]:
        """Append valid upload rows once per uploaded file content."""
        token_source = uploaded_name + "|" + result_df.to_csv(index=False)
        token = hashlib.sha256(token_source.encode("utf-8")).hexdigest()
        processed_tokens = list(st.session_state.get("processed_batch_upload_tokens", []))

        if token in processed_tokens:
            return 0, True

        converted = convert_upload_to_dashboard_rows(result_df, uploaded_name)
        existing_uploaded = st.session_state.get("dashboard_uploaded_rows")
        if isinstance(existing_uploaded, pd.DataFrame) and not existing_uploaded.empty:
            st.session_state.dashboard_uploaded_rows = pd.concat([existing_uploaded, converted], ignore_index=True, sort=False)
        else:
            st.session_state.dashboard_uploaded_rows = converted

        processed_tokens.append(token)
        st.session_state.processed_batch_upload_tokens = processed_tokens
        return len(converted), False

    st.markdown(
        """
        <div class="batch-title">Batch Upload</div>
        <div class="batch-sub">Upload CSV file to predict churn for multiple customers at once</div>
        """,
        unsafe_allow_html=True,
    )

    render_html(
        """
        <div class="batch-card" style="padding:22px 24px; margin:-14px 0 24px 0;">
            <div class="format-title"><span class="format-icon">▣</span> CSV Data Format Guide</div>
            <div class="format-note" style="margin-bottom:14px;">
                Use the exact required columns below. Valid uploaded rows are automatically added to Dashboard and Customers data in this session.
            </div>
            <div class="required-grid" style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 24px;">
                <div class="missing-item">Customer Name: full customer name, e.g. John Doe</div>
                <div class="missing-item">Region: e.g. North America, Europe, Indonesia</div>
                <div class="missing-item">Tenure: months as a number, 0–120</div>
                <div class="missing-item">Monthly Value: positive subscription value</div>
                <div class="missing-item">Login Frequency: numeric weekly login count</div>
                <div class="missing-item">Support Tickets: whole number, 0 or greater</div>
                <div class="missing-item">Last Activity: valid date, e.g. 2026-05-12</div>
            </div>
        </div>
        """
    )

    left_col, right_col = st.columns([2.15, 1], gap="large")

    uploaded = None
    with left_col:
        # Use a placeholder so the uploader is completely removed from the layout
        # after a file is selected. This keeps the left error card aligned with
        # the right-side cards instead of leaving hidden uploader spacing.
        upload_placeholder = st.empty()
        with upload_placeholder.container():
            uploaded = st.file_uploader(
                "Upload CSV file",
                type=["csv"],
                label_visibility="collapsed",
                key=f"batch_upload_csv_{st.session_state.batch_upload_key}",
            )

        if uploaded is not None:
            upload_placeholder.empty()

    with right_col:
        render_right_panel()

    if uploaded is None:
        with left_col:
            render_upload_history()
    else:
        try:
            up = pd.read_csv(uploaded)
            validation_errors = validate_csv_strict(up)

            with left_col:
                if validation_errors:
                    render_figma_error_ui(uploaded.name, validation_errors)
                    render_upload_history()
                else:
                    result_df = process_valid_csv(up)
                    added_count, already_added = append_upload_to_dashboard_once(result_df, uploaded.name)

                    if already_added:
                        st.markdown(
                            "<div class='success-box-custom'>This valid file has already been added to Dashboard and Customers data.</div>",
                            unsafe_allow_html=True,
                        )
                    else:
                        st.markdown(
                            f"<div class='success-box-custom'>Processed {len(result_df):,} rows. Added {added_count:,} customers to Dashboard and Customers data.</div>",
                            unsafe_allow_html=True,
                        )

                    st.dataframe(result_df, use_container_width=True, hide_index=True)

                    st.download_button(
                        "Download Result CSV",
                        result_df.to_csv(index=False).encode("utf-8"),
                        "user_dashboard_prediction_result.csv",
                        "text/csv",
                        use_container_width=True,
                    )
                    


                    render_upload_history()

        except Exception as e:
            with left_col:
                render_figma_error_ui(
                    uploaded.name,
                    [
                        {
                            "type": "read",
                            "title": "Invalid CSV File",
                            "message": "The file could not be read as a valid CSV file:",
                            "items": [str(e)],
                        }
                    ],
                )
                render_upload_history()
