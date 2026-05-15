"""ChurnSense â€“ Professional SaaS Dashboard"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve, precision_recall_curve, f1_score
try:
    import shap
    SHAP_AVAILABLE = True
except Exception:
    shap = None
    SHAP_AVAILABLE = False
from utils import load_artifacts, MODELS_DIR
from predict import predict_batch

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PAGE CONFIG
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
st.set_page_config(page_title="ChurnSense", page_icon="ðŸ›¡ï¸", layout="wide")

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# CUSTOM CSS â€“ Professional Dark Sidebar + Clean Light Content
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
st.markdown("""<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');


/* â”€â”€ Reset & Global â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
*, *::before, *::after { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; }
.stApp { background: #f4f6f9; }
.block-container { padding: 2rem 2.5rem 2rem 2.5rem !important; max-width: 1360px; }

/* â•â• SIDEBAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
section[data-testid="stSidebar"] {
    background: #0f172a !important;
    min-width: 260px !important;
    max-width: 260px !important;
}
section[data-testid="stSidebar"] > div:first-child {
    padding: 0 !important;
    background: #0f172a !important;
}

/* Hide sidebar collapse button + its wrapper completely */
button[data-testid="stSidebarCollapseButton"],
[data-testid="stSidebarCollapseButton"],
section[data-testid="stSidebar"] > div > div:first-child > div:first-child {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
}
/* Clip any overflow at sidebar root to prevent text leaks */
section[data-testid="stSidebar"] { overflow: hidden !important; }

/* â”€â”€ Radio: hide circles completely â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
section[data-testid="stSidebar"] .stRadio > div { gap: 0 !important; }
section[data-testid="stSidebar"] .stRadio > label { display: none !important; }
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] { gap: 2px !important; }
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
    padding: 10px 20px !important;
    border-radius: 8px !important;
    margin: 0 12px !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    color: #94a3b8 !important;
    cursor: pointer !important;
    transition: background 0.15s, color 0.15s !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    background: transparent !important;
}
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
    background: rgba(255,255,255,0.06) !important;
    color: #e2e8f0 !important;
}
/* Hide radio circles */
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label div[data-testid="stMarkdownContainer"] { order: 2; }
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label > div:first-child {
    display: none !important;
}
/* Active item */
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"],
section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] div[data-checked] label {
    background: rgba(99, 102, 241, 0.15) !important;
    color: #a5b4fc !important;
    font-weight: 600 !important;
}

/* Sidebar divider */
section[data-testid="stSidebar"] hr {
    border-color: rgba(255,255,255,0.08) !important;
    margin: 12px 16px !important;
}

/* â”€â”€ Typography â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
h1 { color: #111827 !important; font-weight: 700 !important; font-size: 1.6rem !important; letter-spacing: -0.025em; margin-bottom: 0 !important; }
h2 { color: #111827 !important; font-weight: 600 !important; font-size: 1.25rem !important; letter-spacing: -0.015em; }
h3 { color: #1f2937 !important; font-weight: 600 !important; font-size: 1rem !important; }

/* â”€â”€ KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.kpi-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: box-shadow 0.2s ease;
}
.kpi-card:hover { box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}
.kpi-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.kpi-icon {
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    color: #9ca3af;
}
.kpi-icon.blue, .kpi-icon.amber, .kpi-icon.green,
.kpi-icon.purple, .kpi-icon.red, .kpi-icon.teal { background: none; color: #9ca3af; }
.kpi-val {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 2px 0 4px;
    line-height: 1.2;
    letter-spacing: -0.02em;
}
.kpi-change {
    font-size: 0.75rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
}
.kpi-change.up      { color: #059669; }
.kpi-change.down    { color: #dc2626; }
.kpi-change.neutral { color: #9ca3af; }

/* â”€â”€ Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;
}
.card-header { margin-bottom: 14px; }
.card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
}
.card-subtitle {
    font-size: 0.78rem;
    color: #9ca3af;
    font-weight: 400;
}

/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.page-header { margin-bottom: 24px; }
.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
    margin-bottom: 2px;
}
.page-subtitle {
    font-size: 0.85rem;
    color: #9ca3af;
    font-weight: 400;
}

/* â”€â”€ Sidebar Branding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sidebar-brand {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 8px;
}
.sidebar-brand .brand-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
}
.sidebar-brand .brand-sub {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 400;
    margin-top: 4px;
    margin-left: 36px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}
.brand-mark {
    width: 26px; height: 26px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    font-size: 0.85rem;
}

/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stTabs [data-baseweb="tab-list"] {
    background: #f3f4f6;
    border-radius: 10px;
    padding: 3px;
    gap: 2px !important;
    border: 1px solid #e5e7eb;
}
.stTabs [data-baseweb="tab"] {
    border-radius: 7px !important;
    font-weight: 500 !important;
    font-size: 0.82rem !important;
    color: #6b7280 !important;
    padding: 7px 16px !important;
    border: none !important;
    background: transparent !important;
}
.stTabs [data-baseweb="tab"][aria-selected="true"] {
    background: #ffffff !important;
    color: #111827 !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
}
.stTabs [data-baseweb="tab-highlight"] { display: none !important; }
.stTabs [data-baseweb="tab-border"] { display: none !important; }

/* â”€â”€ Prediction Result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.pred-result {
    border-radius: 12px;
    padding: 28px;
    text-align: center;
}
.pred-result.danger { background: #fef2f2; border: 1px solid #fecaca; }
.pred-result.safe   { background: #ecfdf5; border: 1px solid #a7f3d0; }
.pred-result .big   { font-size: 1.3rem; font-weight: 700; }
.pred-result.danger .big { color: #b91c1c; }
.pred-result.safe .big   { color: #047857; }
.pred-result .prob-val   { font-size: 2.5rem; font-weight: 800; margin: 6px 0; letter-spacing: -0.02em; }
.pred-result.danger .prob-val { color: #dc2626; }
.pred-result.safe .prob-val   { color: #059669; }
.pred-result .sub { font-size: 0.8rem; color: #6b7280; }

/* â”€â”€ Stat Rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;
}
.stat-row:last-child { border-bottom: none; }
.stat-label { font-size: 0.82rem; color: #6b7280; }
.stat-value { font-size: 0.88rem; color: #111827; font-weight: 600; }

/* â”€â”€ Risk Badges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.risk-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}
.risk-badge.high   { background: #fef2f2; color: #b91c1c; }
.risk-badge.medium { background: #fffbeb; color: #b45309; }
.risk-badge.low    { background: #ecfdf5; color: #047857; }

/* â”€â”€ Metric Highlight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.metric-highlight {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 12px;
    padding: 24px;
    color: white;
    text-align: center;
}
.metric-highlight .value {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
}
.metric-highlight .label {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-top: 2px;
}

/* â”€â”€ Hide Streamlit defaults â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#MainMenu, footer, header { visibility: hidden; }
.stDeployButton { display: none; }

/* â”€â”€ Form inputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stSelectbox > div > div, .stMultiSelect > div > div {
    border-radius: 8px !important;
    border: 1px solid #d1d5db !important;
    font-size: 0.85rem !important;
}
.stSelectbox label, .stMultiSelect label {
    font-size: 0.8rem !important;
    color: #6b7280 !important;
    font-weight: 500 !important;
}

/* â”€â”€ Primary Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stButton > button[kind="primary"] {
    background: #4f46e5 !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    padding: 8px 20px !important;
    transition: background 0.15s !important;
}
.stButton > button[kind="primary"]:hover {
    background: #4338ca !important;
}

/* â”€â”€ Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
[data-testid="stMetric"] {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px !important;
}
[data-testid="stMetricLabel"] { font-size: 0.78rem !important; color: #6b7280 !important; }
[data-testid="stMetricValue"] { font-size: 1.3rem !important; font-weight: 700 !important; color: #111827 !important; }

/* â”€â”€ Dataframe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stDataFrame { border-radius: 10px !important; overflow: hidden; }

/* â”€â”€ System status widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sys-status {
    margin: 0 12px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
}
.sys-status .status-label {
    font-size: 0.68rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
}
.sys-status .status-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #34d399;
    font-weight: 600;
}
.sys-status .status-dot {
    width: 6px; height: 6px;
    background: #34d399;
    border-radius: 50%;
    display: inline-block;
}
</style>""", unsafe_allow_html=True)

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# DATA & MODEL LOADING
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ROOT = os.path.join(os.path.dirname(__file__), "..")
PROC = os.path.join(ROOT, "data", "processed", "cleaned_churn_data.csv")

@st.cache_resource(show_spinner="Loading modelâ€¦")
def get_pipeline():
    return load_artifacts(MODELS_DIR)

@st.cache_data(show_spinner="Loading dataâ€¦")
def get_data():
    return pd.read_csv(PROC) if os.path.exists(PROC) else None

# â”€â”€ Matplotlib theme helper â”€â”€
CHART_COLORS = {
    "primary": "#4f46e5",
    "secondary": "#7c3aed",
    "accent": "#f59e0b",
    "danger": "#ef4444",
    "success": "#10b981",
    "muted": "#9ca3af",
    "grid": "#f3f4f6",
    "bg": "#ffffff",
    "text": "#111827",
    "text_secondary": "#6b7280",
}

def clean_fig(fig):
    """Apply a clean, professional style to matplotlib figures."""
    fig.patch.set_facecolor(CHART_COLORS["bg"])
    for ax in fig.axes:
        ax.set_facecolor(CHART_COLORS["bg"])
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#e5e7eb')
        ax.spines['bottom'].set_color('#e5e7eb')
        ax.tick_params(colors=CHART_COLORS["text_secondary"], labelsize=8.5)
        ax.xaxis.label.set_color(CHART_COLORS["text_secondary"])
        ax.yaxis.label.set_color(CHART_COLORS["text_secondary"])
        ax.xaxis.label.set_fontsize(9)
        ax.yaxis.label.set_fontsize(9)
        if ax.get_title():
            ax.title.set_color(CHART_COLORS["text"])
            ax.title.set_fontweight('600')
            ax.title.set_fontsize(10)
    return fig

try:
    pipeline = get_pipeline()
except:
    st.error("âš ï¸ Model belum ditemukan. Jalankan `python src/train_model.py` terlebih dahulu.")
    st.stop()

df = get_data()

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# SIDEBAR
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
with st.sidebar:
    st.markdown("""
    <div class="sidebar-brand">
        <div class="brand-name">
            <div class="brand-mark"><i class="fa-solid fa-shield-halved"></i></div>
            ChurnSense
        </div>
        <div class="brand-sub">Retention Intelligence</div>
    </div>
    """, unsafe_allow_html=True)

    page = st.radio("Navigation", [
        "Dashboard",
        "Analytics",
        "Customers",
        "Prediction",
        "Batch Upload",
        "Performance",
    ], label_visibility="collapsed")

    st.markdown("---")
    st.markdown("""
    <div class="sys-status">
        <div class="status-label">System</div>
        <div class="status-value">
            <span class="status-dot"></span>
            Model Active
        </div>
    </div>
    """, unsafe_allow_html=True)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# HELPER: Compute predictions on full dataset
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
@st.cache_data(show_spinner="Computing model predictionsâ€¦")
def compute_predictions(_df, _feature_names, _label_encoders, _scaler, _model_bytes):
    """Compute predictions and probabilities on the full dataset."""
    from feature_engineering import encode_inference, apply_scaler as sc_apply
    model = pipeline["model"]
    df_enc = encode_inference(_df.drop(columns=["churn"], errors="ignore"), _label_encoders, _feature_names)
    X_scaled = sc_apply(_scaler, df_enc)
    y_pred = model.predict(X_scaled)
    y_proba = model.predict_proba(X_scaled)[:, 1]
    return y_pred, y_proba

@st.cache_data(show_spinner="Computing SHAP values (this may take a moment)â€¦")
def compute_shap_values(_df, _feature_names, _label_encoders, _scaler, _model_hash):
    """Compute SHAP values using TreeExplainer on a sample for performance."""
    from feature_engineering import encode_inference, apply_scaler as sc_apply
    model = pipeline["model"]
    df_enc = encode_inference(_df.drop(columns=["churn"], errors="ignore"), _label_encoders, _feature_names)
    X_scaled = sc_apply(_scaler, df_enc)
    # Sample for performance if dataset is large
    max_samples = 2000
    if len(X_scaled) > max_samples:
        rng = np.random.RandomState(42)
        idx = rng.choice(len(X_scaled), max_samples, replace=False)
        X_sample = X_scaled[idx] if hasattr(X_scaled, '__getitem__') else X_scaled.iloc[idx]
    else:
        X_sample = X_scaled
        idx = np.arange(len(X_scaled))
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    return shap_values, X_sample, idx

# Precompute if data is available
y_pred_full = None
y_proba_full = None
if df is not None and "churn" in df.columns:
    import hashlib
    model_hash = hashlib.md5(str(pipeline["feature_names"]).encode()).hexdigest()
    y_pred_full, y_proba_full = compute_predictions(
        df, pipeline["feature_names"], pipeline["label_encoders"],
        pipeline["scaler"], model_hash
    )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• DASHBOARD OVERVIEW â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
if "Dashboard" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Customer churn and retention overview</div>
    </div>
    """, unsafe_allow_html=True)

    if df is None:
        st.warning("No data found. Place `cleaned_churn_data.csv` in `data/processed/`.")
        st.stop()

    total = len(df)
    churned = int(df["churn"].sum()) if "churn" in df.columns else 0
    retained = total - churned
    churn_rate = churned / total * 100 if total else 0

    # â”€â”€ Filters â”€â”€
    fc1, fc2, _ = st.columns([2, 2, 6])
    with fc1:
        time_range = st.selectbox("Time Range", ["Last 30 Days", "Last 90 Days", "Last 6 Months", "Last 12 Months", "All Time"], index=4, label_visibility="collapsed")
    with fc2:
        if "region_category" in df.columns:
            regions = ["All Regions"] + sorted(df["region_category"].unique().tolist())
            region_filter = st.selectbox("Region", regions, label_visibility="collapsed")
        else:
            region_filter = "All Regions"

    df_filtered = df.copy()
    if region_filter != "All Regions" and "region_category" in df.columns:
        df_filtered = df_filtered[df_filtered["region_category"] == region_filter]

    total_f = len(df_filtered)
    churned_f = int(df_filtered["churn"].sum()) if "churn" in df_filtered.columns else 0
    retained_f = total_f - churned_f
    churn_rate_f = churned_f / total_f * 100 if total_f else 0

    if y_proba_full is not None:
        df_temp = df.copy()
        df_temp["_proba"] = y_proba_full
        if region_filter != "All Regions" and "region_category" in df.columns:
            df_temp = df_temp[df_temp["region_category"] == region_filter]
        at_risk = int((df_temp["_proba"] > 0.6).sum())
        high_risk = int((df_temp["_proba"] > 0.8).sum())
    else:
        at_risk = churned_f
        high_risk = int(churned_f * 0.3)

    # â”€â”€ KPI Row â”€â”€
    c1, c2, c3, c4 = st.columns(4)
    kpi_data = [
        (c1, "CHURN RATE", f"{churn_rate_f:.1f}%", f"{churned_f:,} of {total_f:,} customers", "down" if churn_rate_f > 10 else "up", "<i class='fa-solid fa-arrow-trend-down'></i>", "blue"),
        (c2, "AT-RISK", f"{at_risk:,}", f"{high_risk} critical risk", "down", "<i class='fa-solid fa-triangle-exclamation'></i>", "amber"),
        (c3, "RETAINED", f"{retained_f:,}", f"{retained_f/total_f*100:.1f}% retention rate" if total_f else "N/A", "up", "<i class='fa-solid fa-circle-check'></i>", "green"),
        (c4, "TOTAL CUSTOMERS", f"{total_f:,}", "Active in dataset", "neutral", "<i class='fa-solid fa-users'></i>", "purple"),
    ]
    for col, label, value, change, direction, icon, icon_cls in kpi_data:
        col.markdown(f'''<div class="kpi-card">
        <div class="kpi-header">
            <div class="kpi-label">{label}</div>
            <div class="kpi-icon {icon_cls}">{icon}</div>
        </div>
        <div class="kpi-val">{value}</div>
        <div class="kpi-change {direction}">{change}</div>
        </div>''', unsafe_allow_html=True)

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)

    # â”€â”€ Row 1: Tenure + Risk Pie â”€â”€
    col_left, col_right = st.columns([1.8, 1])

    with col_left:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Churn Rate by Tenure Cohort</div>
            <div class="card-subtitle">Actual vs model-predicted churn rate per tenure group</div>
        </div>''', unsafe_allow_html=True)

        df_cohort = df_filtered.copy()
        cohort_bins = [0, 90, 180, 365, 545, 730, 1100]
        cohort_labels = ['0â€“3 mo', '3â€“6 mo', '6â€“12 mo', '12â€“18 mo', '18â€“24 mo', '24+ mo']
        df_cohort['tenure_cohort'] = pd.cut(df_cohort['days_since_joined'], bins=cohort_bins, labels=cohort_labels)

        cohort_stats = df_cohort.groupby('tenure_cohort', observed=True).agg(
            actual_count=('churn', 'count'),
            actual_churn=('churn', 'sum')
        ).reset_index()
        cohort_stats['actual_rate'] = cohort_stats['actual_churn'] / cohort_stats['actual_count'] * 100

        if y_proba_full is not None:
            df_pred_all = df.copy()
            df_pred_all['_proba'] = y_proba_full
            if region_filter != "All Regions" and "region_category" in df_pred_all.columns:
                df_pred_all = df_pred_all[df_pred_all["region_category"] == region_filter]
            df_pred_all['tenure_cohort'] = pd.cut(df_pred_all['days_since_joined'], bins=cohort_bins, labels=cohort_labels)
            pred_rates = df_pred_all.groupby('tenure_cohort', observed=True)['_proba'].mean().reset_index()
            pred_rates.columns = ['tenure_cohort', 'predicted_rate']
            pred_rates['predicted_rate'] = pred_rates['predicted_rate'] * 100
            cohort_stats = cohort_stats.merge(pred_rates, on='tenure_cohort', how='left')
        else:
            cohort_stats['predicted_rate'] = cohort_stats['actual_rate']

        fig, ax = plt.subplots(figsize=(10, 3.5))
        x_labels = cohort_stats['tenure_cohort'].astype(str).tolist()
        x_pos = range(len(x_labels))

        ax.fill_between(x_pos, cohort_stats['actual_rate'], alpha=0.08, color=CHART_COLORS["primary"])
        ax.plot(x_pos, cohort_stats['actual_rate'], color=CHART_COLORS["primary"], linewidth=2,
                marker='o', markersize=5, label='Actual', zorder=3)
        ax.plot(x_pos, cohort_stats['predicted_rate'], color=CHART_COLORS["accent"], linewidth=1.5,
                linestyle='--', marker='s', markersize=4, label='Predicted', zorder=3)

        for i, (a_val, _) in enumerate(zip(cohort_stats['actual_rate'], cohort_stats['predicted_rate'])):
            ax.annotate(f'{a_val:.1f}%', (i, a_val), textcoords="offset points",
                       xytext=(0, 8), ha='center', fontsize=7.5, fontweight='600', color=CHART_COLORS["primary"])

        ax.set_xticks(list(x_pos))
        ax.set_xticklabels(x_labels)
        ax.set_ylabel('Churn Rate (%)')
        ax.legend(fontsize=8, framealpha=0, loc='upper right')
        ax.grid(axis='y', color=CHART_COLORS["grid"], linewidth=0.8)
        ax.set_ylim(bottom=max(0, cohort_stats['actual_rate'].min() - 5),
                    top=cohort_stats['actual_rate'].max() + 8)
        clean_fig(fig)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)
        st.markdown('</div>', unsafe_allow_html=True)

    with col_right:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Risk Distribution</div>
            <div class="card-subtitle">Customer base segmented by churn risk</div>
        </div>''', unsafe_allow_html=True)

        if y_proba_full is not None:
            df_risk = df.copy()
            df_risk["_proba"] = y_proba_full
            if region_filter != "All Regions" and "region_category" in df_risk.columns:
                df_risk = df_risk[df_risk["region_category"] == region_filter]
            low = int((df_risk["_proba"] <= 0.3).sum())
            med = int(((df_risk["_proba"] > 0.3) & (df_risk["_proba"] <= 0.6)).sum())
            high = int((df_risk["_proba"] > 0.6).sum())
        else:
            low, med, high = retained_f, int(churned_f * 0.4), int(churned_f * 0.6)

        fig, ax = plt.subplots(figsize=(5, 3.5))
        colors = [CHART_COLORS["success"], CHART_COLORS["accent"], CHART_COLORS["danger"]]
        sizes = [low, med, high]
        labels_pie = [f'Low\n{low:,}', f'Medium\n{med:,}', f'High\n{high:,}']
        wedges, texts, autotexts = ax.pie(
            sizes, labels=labels_pie, colors=colors, autopct='%1.1f%%',
            startangle=90, wedgeprops={'edgecolor': 'white', 'linewidth': 2},
            pctdistance=0.75
        )
        for t in texts:
            t.set_fontsize(8)
            t.set_fontweight('500')
            t.set_color(CHART_COLORS["text_secondary"])
        for a in autotexts:
            a.set_fontsize(7.5)
            a.set_fontweight('600')
            a.set_color('white')
        clean_fig(fig)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)
        st.markdown('</div>', unsafe_allow_html=True)

    # â”€â”€ Row 2: Plan Tier + Region â”€â”€
    r2l, r2r = st.columns(2)

    with r2l:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Churn by Plan Tier</div>
            <div class="card-subtitle">Subscription plan impact on churn</div>
        </div>''', unsafe_allow_html=True)
        if "plan_tier" in df_filtered.columns:
            plan_churn = df_filtered.groupby("plan_tier")["churn"].agg(["sum", "count"]).reset_index()
            plan_churn["rate"] = plan_churn["sum"] / plan_churn["count"] * 100
            plan_churn["retained"] = plan_churn["count"] - plan_churn["sum"]
            plan_churn = plan_churn.sort_values("rate", ascending=False)

            fig, ax = plt.subplots(figsize=(8, 3.5))
            x = range(len(plan_churn))
            w = 0.32
            ax.bar([i - w/2 for i in x], plan_churn["retained"], w,
                   label='Retained', color=CHART_COLORS["primary"], edgecolor='white', linewidth=0.5)
            ax.bar([i + w/2 for i in x], plan_churn["sum"], w,
                   label='Churned', color=CHART_COLORS["danger"], edgecolor='white', linewidth=0.5)

            for i, (_, row) in enumerate(plan_churn.iterrows()):
                ax.text(i, row["count"] + plan_churn["count"].max() * 0.02,
                       f'{row["rate"]:.1f}%', ha='center', fontsize=9, fontweight='600', color=CHART_COLORS["text"])

            ax.set_xticks(list(x))
            ax.set_xticklabels(plan_churn["plan_tier"])
            ax.set_ylabel('Customers')
            ax.legend(fontsize=8, framealpha=0)
            ax.grid(axis='y', color=CHART_COLORS["grid"], linewidth=0.5)
            clean_fig(fig)
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.info("Plan tier data not available")
        st.markdown('</div>', unsafe_allow_html=True)

    with r2r:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Churn by Region</div>
            <div class="card-subtitle">Geographic churn distribution</div>
        </div>''', unsafe_allow_html=True)
        if "region_category" in df_filtered.columns:
            region_churn = df_filtered.groupby("region_category")["churn"].agg(["sum", "count"]).reset_index()
            region_churn["rate"] = region_churn["sum"] / region_churn["count"] * 100
            region_churn = region_churn.sort_values("rate", ascending=True)

            fig, ax = plt.subplots(figsize=(8, 3.5))
            palette = [CHART_COLORS["primary"], CHART_COLORS["secondary"], '#a78bfa']
            bars = ax.barh(region_churn["region_category"], region_churn["rate"],
                          color=palette[:len(region_churn)],
                          height=0.45, edgecolor='white', linewidth=1)
            for bar, val in zip(bars, region_churn["rate"]):
                ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                       f'{val:.1f}%', va='center', fontsize=9, fontweight='600', color=CHART_COLORS["text"])
            ax.set_xlabel('Churn Rate (%)')
            ax.grid(axis='x', color=CHART_COLORS["grid"], linewidth=0.8)
            clean_fig(fig)
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.info("Region data not available")
        st.markdown('</div>', unsafe_allow_html=True)

    # â”€â”€ Row 3: Feedback + Behavior â”€â”€
    r3l, r3r = st.columns(2)

    with r3l:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Churn by Feedback Type</div>
            <div class="card-subtitle">Correlation between customer feedback and churn</div>
        </div>''', unsafe_allow_html=True)
        if "feedback" in df_filtered.columns:
            fb_churn = df_filtered.groupby("feedback")["churn"].agg(["sum", "count"]).reset_index()
            fb_churn["rate"] = fb_churn["sum"] / fb_churn["count"] * 100
            fb_churn = fb_churn.sort_values("rate", ascending=True)
            fb_churn["label"] = fb_churn["feedback"].str.replace("Products always in Stock", "Products in Stock")

            fig, ax = plt.subplots(figsize=(8, 4.5))
            bar_colors = [CHART_COLORS["success"] if r < 10 else CHART_COLORS["accent"] if r < 50 else CHART_COLORS["danger"]
                         for r in fb_churn["rate"]]
            bars = ax.barh(fb_churn["label"], fb_churn["rate"],
                          color=bar_colors, height=0.5, edgecolor='white', linewidth=0.5)
            for bar, val, cnt in zip(bars, fb_churn["rate"], fb_churn["count"]):
                ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                       f'{val:.1f}% ({cnt:,})', va='center', fontsize=8, fontweight='500', color=CHART_COLORS["text_secondary"])
            ax.set_xlabel('Churn Rate (%)')
            ax.grid(axis='x', color=CHART_COLORS["grid"], linewidth=0.5)
            clean_fig(fig)
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.info("Feedback data not available")
        st.markdown('</div>', unsafe_allow_html=True)

    with r3r:
        behavior_cols = {
            "API Calls (90d)": "api_calls_90d",
            "Logins (90d)": "logins_90d",
            "Active Days (90d)": "active_days_90d",
            "Avg Transaction Value": "avg_transaction_value",
            "Points in Wallet": "points_in_wallet",
            "Avg Session Duration": "avg_session_duration",
            "Login Frequency": "avg_frequency_login_days",
            "Days Since Last Login": "days_since_last_login",
            "Days Since Active": "days_since_active",
        }

        pc = CHART_COLORS['primary']
        dc = CHART_COLORS['danger']

        html = '<div class="card"><div class="card-header"><div class="card-title">Behavioral Comparison</div><div class="card-subtitle">Average metrics â€” retained vs churned customers</div></div>'
        for label, col_name in behavior_cols.items():
            if col_name in df_filtered.columns:
                rv = df_filtered[df_filtered["churn"] == 0][col_name].mean()
                cv = df_filtered[df_filtered["churn"] == 1][col_name].mean()
                dp = ((cv - rv) / rv * 100) if rv != 0 else 0
                dc2 = "color:#dc2626" if dp < -5 else ("color:#059669" if dp > 5 else "color:#9ca3af")
                arr = "â†“" if dp < 0 else "â†‘"
                html += f'<div class="stat-row"><span class="stat-label">{label}</span><span style="display:flex;gap:10px;align-items:center;"><span style="font-size:0.8rem;color:{pc};font-weight:600;">{rv:,.0f}</span><span style="font-size:0.8rem;color:{dc};font-weight:600;">{cv:,.0f}</span><span style="font-size:0.7rem;{dc2};font-weight:500;">{arr}{abs(dp):.0f}%</span></span></div>'

        html += f'<div style="display:flex;gap:14px;padding-top:8px;border-top:1px solid #f3f4f6;margin-top:4px;"><span style="font-size:0.7rem;color:{pc};font-weight:600;">â— Retained</span><span style="font-size:0.7rem;color:{dc};font-weight:600;">â— Churned</span><span style="font-size:0.7rem;color:#9ca3af;">â†• Difference</span></div></div>'

        st.markdown(html, unsafe_allow_html=True)



# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• ADVANCED ANALYTICS â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
elif "Analytics" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Analytics</div>
        <div class="page-subtitle">Deep dive into churn patterns and model insights</div>
    </div>
    """, unsafe_allow_html=True)

    if df is None or "churn" not in df.columns:
        st.warning("Data not available.")
        st.stop()

    model = pipeline["model"]
    fn = pipeline["feature_names"]

    if y_pred_full is not None and y_proba_full is not None:
        auc = roc_auc_score(df.churn.astype(int), y_proba_full)
        rpt = classification_report(df.churn.astype(int), y_pred_full,
                                    target_names=["Retained", "Churned"], output_dict=True)
        accuracy = rpt["accuracy"] * 100
    else:
        auc = 0
        accuracy = 0

    total = len(df)
    churned = int(df["churn"].sum())
    retained = total - churned

    c1, c2, c3, c4 = st.columns(4)
    kpi_data_analytics = [
        (c1, "TOTAL CUSTOMERS", f"{total:,}", "In dataset", "neutral", "<i class='fa-solid fa-database'></i>", "blue"),
        (c2, "ACCURACY", f"{accuracy:.0f}%", "Model performance", "up", "<i class='fa-solid fa-bullseye'></i>", "green"),
        (c3, "RETENTION RATE", f"{retained/total*100:.1f}%", f"{retained:,} customers", "up", "<i class='fa-solid fa-user-check'></i>", "purple"),
        (c4, "ROC-AUC", f"{auc:.3f}", "Model quality", "up", "<i class='fa-solid fa-wave-square'></i>", "teal"),
    ]
    for col, label, value, change, direction, icon, icon_cls in kpi_data_analytics:
        col.markdown(f'''<div class="kpi-card">
        <div class="kpi-header">
            <div class="kpi-label">{label}</div>
            <div class="kpi-icon {icon_cls}">{icon}</div>
        </div>
        <div class="kpi-val">{value}</div>
        <div class="kpi-change {direction}">{change}</div>
        </div>''', unsafe_allow_html=True)

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)

    tab1, tab2, tab3, tab4, tab5 = st.tabs(["Feature Impact", "SHAP Analysis", "Distributions", "AI Predictions", "Segmentation"])

    with tab1:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
        fi = pd.DataFrame({"feature": fn, "importance": model.feature_importances_}).sort_values("importance", ascending=False).head(15)

        fig, ax = plt.subplots(figsize=(11, 5))
        n_bars = len(fi)
        # Gradient effect from dark to light
        gradient = [CHART_COLORS["primary"]] * 3 + [CHART_COLORS["secondary"]] * 3 + ['#a78bfa'] * (n_bars - 6)
        bars = ax.barh(fi["feature"][::-1], fi["importance"][::-1],
                      color=gradient[::-1], height=0.5, edgecolor='white', linewidth=0.5)
        for bar, val in zip(bars, fi["importance"][::-1]):
            ax.text(bar.get_width() + 0.002, bar.get_y() + bar.get_height()/2,
                   f'{val:.4f}', va='center', fontsize=8, fontweight='500', color=CHART_COLORS["text_secondary"])
        ax.set_xlabel('Importance Score')
        ax.set_title('Top Features Driving Churn', pad=12)
        ax.grid(axis='x', color=CHART_COLORS["grid"], linewidth=0.8)
        clean_fig(fig)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

    with tab2:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

        if y_pred_full is not None and SHAP_AVAILABLE:
            import hashlib as _hl
            _mh = _hl.md5(str(pipeline["feature_names"]).encode()).hexdigest()
            shap_vals, X_shap, shap_idx = compute_shap_values(
                df, pipeline["feature_names"], pipeline["label_encoders"],
                pipeline["scaler"], _mh
            )
            feature_names_display = [f.replace('_', ' ').title() for f in fn]

            # â”€â”€ SHAP Summary Plot (Beeswarm) â”€â”€
            st.markdown('''<div class="card">
            <div class="card-header">
                <div class="card-title">SHAP Summary Plot</div>
                <div class="card-subtitle">Each dot is one customer â€” color = feature value (red=high, blue=low), position = SHAP impact on prediction</div>
            </div>''', unsafe_allow_html=True)

            fig_summary, ax_summary = plt.subplots(figsize=(11, 6))
            shap.summary_plot(shap_vals, X_shap, feature_names=feature_names_display,
                             show=False, max_display=15, plot_size=None)
            # Style the current figure produced by shap
            fig_shap_summary = plt.gcf()
            fig_shap_summary.patch.set_facecolor('#ffffff')
            for ax_s in fig_shap_summary.axes:
                ax_s.set_facecolor('#ffffff')
                ax_s.tick_params(colors=CHART_COLORS['text_secondary'], labelsize=8.5)
                for sp in ['top', 'right']:
                    ax_s.spines[sp].set_visible(False)
                for sp in ['left', 'bottom']:
                    ax_s.spines[sp].set_color('#e5e7eb')
            fig_shap_summary.tight_layout()
            st.pyplot(fig_shap_summary)
            plt.close('all')
            st.markdown('</div>', unsafe_allow_html=True)

            st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)

            # â”€â”€ Two columns: Bar plot + Dependence â”€â”€
            shap_col1, shap_col2 = st.columns(2)

            with shap_col1:
                st.markdown('''<div class="card">
                <div class="card-header">
                    <div class="card-title">Mean SHAP Importance</div>
                    <div class="card-subtitle">Average absolute SHAP value per feature</div>
                </div>''', unsafe_allow_html=True)

                mean_abs = np.abs(shap_vals).mean(axis=0)
                shap_imp = pd.DataFrame({'feature': feature_names_display, 'importance': mean_abs})
                shap_imp = shap_imp.sort_values('importance', ascending=False).head(15)

                fig_bar, ax_bar = plt.subplots(figsize=(6, 5))
                colors_shap = [CHART_COLORS['primary']] * min(3, len(shap_imp)) + \
                              [CHART_COLORS['secondary']] * min(3, max(0, len(shap_imp)-3)) + \
                              ['#a78bfa'] * max(0, len(shap_imp)-6)
                ax_bar.barh(shap_imp['feature'][::-1], shap_imp['importance'][::-1],
                           color=colors_shap[::-1], height=0.5, edgecolor='white', linewidth=0.5)
                for bar, val in zip(ax_bar.patches, shap_imp['importance'][::-1]):
                    ax_bar.text(bar.get_width() + 0.001, bar.get_y() + bar.get_height()/2,
                               f'{val:.4f}', va='center', fontsize=7.5, color=CHART_COLORS['text_secondary'])
                ax_bar.set_xlabel('Mean |SHAP Value|')
                ax_bar.grid(axis='x', color=CHART_COLORS['grid'], linewidth=0.8)
                clean_fig(fig_bar)
                fig_bar.tight_layout()
                st.pyplot(fig_bar)
                plt.close(fig_bar)
                st.markdown('</div>', unsafe_allow_html=True)

            with shap_col2:
                st.markdown('''<div class="card">
                <div class="card-header">
                    <div class="card-title">SHAP Dependence Plot</div>
                    <div class="card-subtitle">How a single feature's value affects the prediction</div>
                </div>''', unsafe_allow_html=True)

                top_features = shap_imp['feature'].tolist()[:10]
                dep_feature = st.selectbox("Choose feature", top_features, key="shap_dep_feature")
                dep_idx = feature_names_display.index(dep_feature)

                fig_dep, ax_dep = plt.subplots(figsize=(6, 4.5))
                x_vals = X_shap[:, dep_idx] if hasattr(X_shap, '__getitem__') else X_shap.iloc[:, dep_idx]
                scatter = ax_dep.scatter(x_vals, shap_vals[:, dep_idx],
                                        c=shap_vals[:, dep_idx],
                                        cmap='coolwarm', alpha=0.5, s=8, edgecolors='none')
                ax_dep.axhline(y=0, color='#d1d5db', linewidth=1, linestyle='--')
                ax_dep.set_xlabel(dep_feature)
                ax_dep.set_ylabel('SHAP Value')
                ax_dep.grid(color=CHART_COLORS['grid'], linewidth=0.5)
                cbar = plt.colorbar(scatter, ax=ax_dep, shrink=0.8)
                cbar.set_label('SHAP Value', fontsize=8)
                cbar.ax.tick_params(labelsize=7)
                clean_fig(fig_dep)
                fig_dep.tight_layout()
                st.pyplot(fig_dep)
                plt.close(fig_dep)
                st.markdown('</div>', unsafe_allow_html=True)

        elif not SHAP_AVAILABLE:
            st.markdown('''<div class="card">
            <div class="card-header">
                <div class="card-title">SHAP Unavailable</div>
                <div class="card-subtitle">SHAP library is not installed in this environment</div>
            </div>
            ''', unsafe_allow_html=True)
            st.warning("SHAP is not installed. Install it with `pip3 install shap` or `pip3 install -r requirements.txt` to enable SHAP analysis.")
            st.markdown('</div>', unsafe_allow_html=True)

        else:
            st.info("Model predictions required for SHAP analysis.")

    with tab3:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
        dist_cols = [c for c in ["api_calls_90d", "logins_90d", "active_days_90d", "avg_transaction_value", "points_in_wallet", "avg_session_duration"] if c in df.columns]
        selected = st.multiselect("Select features to compare", dist_cols, default=dist_cols[:3])

        if selected:
            n = len(selected)
            cols_per_row = min(n, 3)
            rows = (n + cols_per_row - 1) // cols_per_row
            fig, axes = plt.subplots(rows, cols_per_row, figsize=(5 * cols_per_row, 3.5 * rows))
            if n == 1:
                axes = [axes]
            else:
                axes = axes.flatten() if hasattr(axes, 'flatten') else [axes]

            for idx, col_name in enumerate(selected):
                ax = axes[idx]
                sns.kdeplot(data=df[df.churn == 0], x=col_name, fill=True, color=CHART_COLORS["primary"],
                           alpha=0.15, lw=1.5, label='Retained', ax=ax)
                sns.kdeplot(data=df[df.churn == 1], x=col_name, fill=True, color=CHART_COLORS["danger"],
                           alpha=0.15, lw=1.5, label='Churned', ax=ax)
                ax.set_title(col_name.replace('_', ' ').title(), pad=8)
                ax.legend(fontsize=7.5, framealpha=0)
                ax.grid(axis='y', color=CHART_COLORS["grid"], linewidth=0.5)

            for idx in range(n, len(axes)):
                axes[idx].set_visible(False)

            clean_fig(fig)
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)

    with tab4:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
        if y_proba_full is not None:
            col_l, col_r = st.columns(2)
            with col_l:
                st.markdown('''<div class="card">
                <div class="card-header">
                    <div class="card-title">Probability Distribution</div>
                    <div class="card-subtitle">Churn probability by actual class</div>
                </div>''', unsafe_allow_html=True)

                fig, ax = plt.subplots(figsize=(7, 3.5))
                ax.hist(y_proba_full[df.churn == 0], bins=50, alpha=0.5, color=CHART_COLORS["primary"],
                       label='Retained', density=True, edgecolor='white', linewidth=0.5)
                ax.hist(y_proba_full[df.churn == 1], bins=50, alpha=0.5, color=CHART_COLORS["danger"],
                       label='Churned', density=True, edgecolor='white', linewidth=0.5)
                ax.axvline(x=0.5, color=CHART_COLORS["accent"], linestyle='--', linewidth=1.5, label='Threshold')
                ax.set_xlabel('Churn Probability')
                ax.set_ylabel('Density')
                ax.legend(fontsize=8, framealpha=0)
                ax.grid(axis='y', color=CHART_COLORS["grid"], linewidth=0.5)
                clean_fig(fig)
                fig.tight_layout()
                st.pyplot(fig)
                plt.close(fig)
                st.markdown('</div>', unsafe_allow_html=True)

            with col_r:
                st.markdown('''<div class="card">
                <div class="card-header">
                    <div class="card-title">Precision-Recall Curve</div>
                    <div class="card-subtitle">Trade-off analysis</div>
                </div>''', unsafe_allow_html=True)

                precision, recall, _ = precision_recall_curve(df.churn.astype(int), y_proba_full)
                fig, ax = plt.subplots(figsize=(7, 3.5))
                ax.fill_between(recall, precision, alpha=0.08, color=CHART_COLORS["secondary"])
                ax.plot(recall, precision, color=CHART_COLORS["secondary"], linewidth=2)
                ax.set_xlabel('Recall')
                ax.set_ylabel('Precision')
                ax.grid(color=CHART_COLORS["grid"], linewidth=0.5)
                clean_fig(fig)
                fig.tight_layout()
                st.pyplot(fig)
                plt.close(fig)
                st.markdown('</div>', unsafe_allow_html=True)
        else:
            st.info("Run model predictions to see AI insights.")

    with tab5:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
        seg_cols = [c for c in ["region_category", "gender", "plan_tier", "internet_option", "medium_of_operation"] if c in df.columns]
        if seg_cols:
            seg_by = st.selectbox("Segment by", seg_cols)
            seg_data = df.groupby(seg_by)["churn"].agg(["sum", "count", "mean"]).reset_index()
            seg_data.columns = [seg_by, "Churned", "Total", "Churn Rate"]
            seg_data["Retained"] = seg_data["Total"] - seg_data["Churned"]
            seg_data["Churn Rate"] = (seg_data["Churn Rate"] * 100).round(1)
            seg_data = seg_data.sort_values("Churn Rate", ascending=False)

            col_chart, col_table = st.columns([1.2, 1])
            with col_chart:
                fig, ax = plt.subplots(figsize=(8, 4))
                x = range(len(seg_data))
                w = 0.32
                ax.bar([i - w/2 for i in x], seg_data["Retained"], w,
                      label='Retained', color=CHART_COLORS["primary"], edgecolor='white', linewidth=0.5)
                ax.bar([i + w/2 for i in x], seg_data["Churned"], w,
                      label='Churned', color=CHART_COLORS["danger"], edgecolor='white', linewidth=0.5)
                ax.set_xticks(list(x))
                ax.set_xticklabels(seg_data[seg_by], rotation=30, ha='right')
                ax.set_ylabel('Count')
                ax.set_title(f'Churn by {seg_by.replace("_", " ").title()}', pad=10)
                ax.legend(fontsize=8, framealpha=0)
                ax.grid(axis='y', color=CHART_COLORS["grid"], linewidth=0.5)
                clean_fig(fig)
                fig.tight_layout()
                st.pyplot(fig)
                plt.close(fig)

            with col_table:
                st.dataframe(
                    seg_data[[seg_by, "Total", "Churned", "Retained", "Churn Rate"]].style.format({
                        "Total": "{:,}",
                        "Churned": "{:,}",
                        "Retained": "{:,}",
                        "Churn Rate": "{:.1f}%"
                    }).background_gradient(subset=["Churn Rate"], cmap="Reds"),
                    use_container_width=True, height=350
                )
        else:
            st.info("No categorical columns for segmentation.")


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• CUSTOMERS â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
elif "Customers" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Customers</div>
        <div class="page-subtitle">Browse and filter individual customer records</div>
    </div>
    """, unsafe_allow_html=True)

    if df is None:
        st.warning("No data found.")
        st.stop()

    f1, f2, f3, f4 = st.columns(4)
    with f1:
        risk_filter = st.selectbox("Risk Level", ["All", "High Risk", "Medium Risk", "Low Risk"])
    with f2:
        if "region_category" in df.columns:
            region_opts = ["All"] + sorted(df["region_category"].unique().tolist())
            region_sel = st.selectbox("Region", region_opts)
        else:
            region_sel = "All"
    with f3:
        if "plan_tier" in df.columns:
            plan_opts = ["All"] + sorted(df["plan_tier"].unique().tolist())
            plan_sel = st.selectbox("Plan", plan_opts)
        else:
            plan_sel = "All"
    with f4:
        sort_by = st.selectbox("Sort By", ["Churn Probability (Highâ†’Low)", "Churn Probability (Lowâ†’High)", "Points in Wallet", "API Calls"])

    df_display = df.copy()
    if y_proba_full is not None:
        df_display["churn_probability"] = y_proba_full
        df_display["risk_level"] = pd.cut(df_display["churn_probability"],
                                          bins=[0, 0.3, 0.6, 1.0],
                                          labels=["Low", "Medium", "High"])
    else:
        df_display["churn_probability"] = 0
        df_display["risk_level"] = "Unknown"

    if risk_filter == "High Risk":
        df_display = df_display[df_display["risk_level"] == "High"]
    elif risk_filter == "Medium Risk":
        df_display = df_display[df_display["risk_level"] == "Medium"]
    elif risk_filter == "Low Risk":
        df_display = df_display[df_display["risk_level"] == "Low"]

    if region_sel != "All" and "region_category" in df_display.columns:
        df_display = df_display[df_display["region_category"] == region_sel]
    if plan_sel != "All" and "plan_tier" in df_display.columns:
        df_display = df_display[df_display["plan_tier"] == plan_sel]

    if "Highâ†’Low" in sort_by:
        df_display = df_display.sort_values("churn_probability", ascending=False)
    elif "Lowâ†’High" in sort_by:
        df_display = df_display.sort_values("churn_probability", ascending=True)
    elif "Points" in sort_by and "points_in_wallet" in df_display.columns:
        df_display = df_display.sort_values("points_in_wallet", ascending=False)
    elif "API" in sort_by and "api_calls_90d" in df_display.columns:
        df_display = df_display.sort_values("api_calls_90d", ascending=False)

    st.markdown(f"""
    <div style="display:flex; gap:12px; margin-bottom:14px; align-items:center;">
        <div class="risk-badge low">Low: {int((df_display['risk_level']=='Low').sum()):,}</div>
        <div class="risk-badge medium">Medium: {int((df_display['risk_level']=='Medium').sum()):,}</div>
        <div class="risk-badge high">High: {int((df_display['risk_level']=='High').sum()):,}</div>
        <span style="color:#9ca3af; font-size:0.8rem; margin-left:auto;">{len(df_display):,} customers</span>
    </div>
    """, unsafe_allow_html=True)

    show_cols = ["churn_probability", "risk_level", "churn"]
    for c in ["age", "gender", "region_category", "plan_tier", "avg_transaction_value", "points_in_wallet", "api_calls_90d", "logins_90d", "active_days_90d", "feedback"]:
        if c in df_display.columns:
            show_cols.append(c)

    st.dataframe(
        df_display[show_cols].head(500).style.format({
            "churn_probability": "{:.2%}",
            "avg_transaction_value": "{:,.1f}",
            "points_in_wallet": "{:,.1f}",
        }).background_gradient(subset=["churn_probability"], cmap="RdYlGn_r"),
        use_container_width=True, height=500
    )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• PREDICTION â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
elif "Prediction" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Churn Prediction</div>
        <div class="page-subtitle">Predict individual customer churn risk</div>
    </div>
    """, unsafe_allow_html=True)

    cl, cr = st.columns([1.6, 1])
    with cl:
        with st.form("prediction_form"):
            st.markdown('<div class="card-title">Customer Profile</div>', unsafe_allow_html=True)
            st.markdown("<div style='height:6px'></div>", unsafe_allow_html=True)
            r1, r2, r3 = st.columns(3)
            api = r1.number_input("API Calls 90d", 0, value=5000)
            lg = r2.number_input("Logins 90d", 0, value=30)
            ad = r3.number_input("Active Days 90d", 0, value=25)
            atx = r1.number_input("Avg Tx Value", 0.0, value=500.0, step=10.0)
            sm = r2.number_input("Session Min 90d", 0.0, value=800.0, step=10.0)
            dl = r3.number_input("Days Since Login", 0, value=5)
            pw = r1.number_input("Points Wallet", 0.0, value=300.0)
            asd = r2.number_input("Avg Session Dur", 0.0, value=60.0)
            af = r3.number_input("Avg Freq Login", 0.0, value=20.0)
            dj = r1.number_input("Days Joined", 0, value=365)
            da = r2.number_input("Days Active", 0, value=3)
            age = r3.number_input("Age", 10, 100, value=35)

            st.markdown("---")
            p1, p2, p3 = st.columns(3)
            gen = p1.selectbox("Gender", ["M", "F"])
            reg = p2.selectbox("Region", ["City", "Town", "Village"])
            pt = p3.selectbox("Plan", ["Basic", "Enterprise", "Premium"])
            ref = p1.selectbox("Referral", ["Yes", "No"])
            off = p2.selectbox("Offer", ["Gift Vouchers/Coupons", "Credit/Debit Card Offers", "Without Offers"])
            med = p3.selectbox("Medium", ["Desktop", "Smartphone", "Both"])
            net = p1.selectbox("Internet", ["Wi-Fi", "Mobile_Data", "Fiber_Optic"])
            cmp = p2.selectbox("Complaint", ["Yes", "No"])
            cs = p3.selectbox("Complaint Status", ["Solved", "Unsolved", "Solved in Follow-up", "Not Applicable", "No Info"])
            fb = p1.selectbox("Feedback", [
                "Quality Customer Care", "Products always in Stock",
                "User Friendly Website", "Reasonable Price",
                "Poor Website", "Poor Customer Service",
                "Poor Product Quality", "Too Many Ads",
                "No reason specified"
            ])
            dc = p2.selectbox("Discount", ["Yes", "No"])
            op = p3.selectbox("Offer Pref", ["Yes", "No"])
            sub = st.form_submit_button("Predict Churn Risk", use_container_width=True, type="primary")

    with cr:
        st.markdown('<div class="card-title">Result</div>', unsafe_allow_html=True)
        st.markdown("<div style='height:6px'></div>", unsafe_allow_html=True)
        if not sub:
            st.markdown('''<div class="card" style="text-align:center; padding:48px 20px;">
                <p style="font-size:2.5rem; opacity:0.2; margin-bottom:8px;">ðŸŽ¯</p>
                <p style="color:#9ca3af; font-size:0.85rem;">Fill in the profile and click predict</p>
            </div>''', unsafe_allow_html=True)
        else:
            row = dict(
                age=age, gender=gen, region_category=reg,
                joined_through_referral=ref, preferred_offer_types=off,
                medium_of_operation=med, internet_option=net,
                days_since_last_login=dl, avg_session_duration=asd,
                avg_transaction_value=atx, avg_frequency_login_days=af,
                points_in_wallet=pw, used_special_discount=dc,
                offer_application_preference=op, past_complaint=cmp,
                complaint_status=cs, feedback=fb, plan_tier=pt,
                logins_90d=lg, active_days_90d=ad, api_calls_90d=api,
                session_minutes_90d=sm, days_since_active=da,
                days_since_joined=dj
            )
            with st.spinner("Analyzingâ€¦"):
                res = predict_batch(pd.DataFrame([row]), pipeline)
            p = int(res["prediction"].iloc[0])
            prob = float(res["probability"].iloc[0])
            cls = "danger" if p else "safe"
            lbl = "HIGH CHURN RISK" if p else "LOW RISK"

            st.markdown(f'''<div class="pred-result {cls}">
                <div class="big">{lbl}</div>
                <div class="prob-val">{prob:.1%}</div>
                <div class="sub">Churn Probability</div>
            </div>''', unsafe_allow_html=True)

            st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)

            risk = "ðŸ”´ Critical" if prob > 0.7 else "ðŸŸ¡ Moderate" if prob > 0.4 else "ðŸŸ¢ Low"
            action = "Immediate intervention" if prob > 0.7 else "Monitor closely" if prob > 0.4 else "No action needed"

            m1, m2 = st.columns(2)
            m1.metric("Risk Level", risk)
            m2.metric("Action", action)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• BATCH UPLOAD â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
elif "Batch Upload" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Batch Prediction</div>
        <div class="page-subtitle">Upload CSV to predict churn for multiple customers</div>
    </div>
    """, unsafe_allow_html=True)

    up = st.file_uploader("Upload CSV file", type="csv")
    if up:
        du = pd.read_csv(up)
        st.success(f"Loaded {du.shape[0]:,} rows Ã— {du.shape[1]} columns")
        with st.expander("Data Preview", expanded=True):
            st.dataframe(du.head(10), use_container_width=True)

        if st.button("Run Batch Prediction", use_container_width=True, type="primary"):
            with st.spinner("Processingâ€¦"):
                r = predict_batch(du, pipeline).sort_values("probability", ascending=False)

            cn = int((r.prediction == 1).sum())
            tot = len(r)

            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Total", f"{tot:,}")
            c2.metric("Predicted Churn", f"{cn:,}")
            c3.metric("Predicted Retained", f"{tot - cn:,}")
            c4.metric("Churn Rate", f"{cn/tot*100:.1f}%")

            st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
            mp = st.slider("Min probability filter", 0.0, 1.0, 0.0, 0.05)
            fl = r[r.probability >= mp]
            st.write(f"**{len(fl):,}** customers shown (â‰¥ {mp:.0%})")
            st.dataframe(fl, use_container_width=True, height=400)
            st.download_button("Download CSV",
                             fl.to_csv(index=False).encode(),
                             "churn_predictions.csv", "text/csv",
                             use_container_width=True)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# â•â•â• MODEL PERFORMANCE â•â•â•
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
elif "Performance" in page:
    st.markdown("""
    <div class="page-header">
        <div class="page-title">Model Performance</div>
        <div class="page-subtitle">XGBoost model evaluation metrics</div>
    </div>
    """, unsafe_allow_html=True)

    if df is None or "churn" not in df.columns:
        st.warning("Need processed data with churn labels.")
        st.stop()

    if y_pred_full is None or y_proba_full is None:
        st.warning("Could not compute predictions.")
        st.stop()

    yt = df.churn.astype(int)
    auc = roc_auc_score(yt, y_proba_full)
    rpt = classification_report(yt, y_pred_full, target_names=["Retained", "Churned"], output_dict=True)
    f1 = f1_score(yt, y_pred_full)

    c1, c2, c3, c4 = st.columns(4)
    perf_kpis = [
        (c1, "ROC-AUC", f"{auc:.4f}", "Discrimination", "blue"),
        (c2, "PRECISION", f"{rpt['Churned']['precision']:.3f}", "True positive rate", "green"),
        (c3, "RECALL", f"{rpt['Churned']['recall']:.3f}", "Detection rate", "amber"),
        (c4, "F1-SCORE", f"{f1:.3f}", "Harmonic mean", "purple"),
    ]
    for col, label, value, subtitle, icon_cls in perf_kpis:
        col.markdown(f'''<div class="kpi-card">
        <div class="kpi-header">
            <div class="kpi-label">{label}</div>
            <div class="kpi-icon {icon_cls}"><i class='fa-solid fa-chart-simple'></i></div>
        </div>
        <div class="kpi-val">{value}</div>
        <div class="kpi-change neutral">{subtitle}</div>
        </div>''', unsafe_allow_html=True)

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)

    # Threshold tuning
    st.markdown('''<div class="card">
    <div class="card-header">
        <div class="card-title">Threshold Tuning</div>
        <div class="card-subtitle">Adjust classification threshold to see impact on metrics</div>
    </div>''', unsafe_allow_html=True)

    threshold = st.slider("Classification Threshold", 0.1, 0.9, 0.5, 0.05)
    y_pred_thresh = (y_proba_full >= threshold).astype(int)
    rpt_thresh = classification_report(yt, y_pred_thresh, target_names=["Retained", "Churned"], output_dict=True)
    f1_thresh = f1_score(yt, y_pred_thresh)

    tc1, tc2, tc3, tc4 = st.columns(4)
    tc1.metric("Precision", f"{rpt_thresh['Churned']['precision']:.3f}",
               f"{rpt_thresh['Churned']['precision'] - rpt['Churned']['precision']:+.3f} vs 0.5")
    tc2.metric("Recall", f"{rpt_thresh['Churned']['recall']:.3f}",
               f"{rpt_thresh['Churned']['recall'] - rpt['Churned']['recall']:+.3f} vs 0.5")
    tc3.metric("F1-Score", f"{f1_thresh:.3f}",
               f"{f1_thresh - f1:+.3f} vs 0.5")
    tc4.metric("Accuracy", f"{rpt_thresh['accuracy']:.3f}",
               f"{rpt_thresh['accuracy'] - rpt['accuracy']:+.3f} vs 0.5")
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)

    chart_c1, chart_c2 = st.columns(2)

    with chart_c1:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">Confusion Matrix</div>
            <div class="card-subtitle">Actual vs predicted</div>
        </div>''', unsafe_allow_html=True)

        cm = confusion_matrix(yt, y_pred_thresh)
        fig, ax = plt.subplots(figsize=(5.5, 4.5))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax,
                   xticklabels=["Retained", "Churned"],
                   yticklabels=["Retained", "Churned"],
                   linewidths=2, linecolor='white',
                   annot_kws={"size": 14, "fontweight": "bold"})
        ax.set_xlabel("Predicted", labelpad=10)
        ax.set_ylabel("Actual", labelpad=10)
        clean_fig(fig)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)
        st.markdown('</div>', unsafe_allow_html=True)

    with chart_c2:
        st.markdown('''<div class="card">
        <div class="card-header">
            <div class="card-title">ROC Curve</div>
            <div class="card-subtitle">Receiver Operating Characteristic</div>
        </div>''', unsafe_allow_html=True)

        fpr, tpr, _ = roc_curve(yt, y_proba_full)
        fig, ax = plt.subplots(figsize=(5.5, 4.5))
        ax.fill_between(fpr, tpr, alpha=0.06, color=CHART_COLORS["primary"])
        ax.plot(fpr, tpr, color=CHART_COLORS["primary"], lw=2, label=f'AUC = {auc:.4f}')
        ax.plot([0, 1], [0, 1], '--', color='#d1d5db', lw=1.5)
        ax.axvline(x=fpr[np.argmin(np.abs(tpr - (1-fpr)))], color=CHART_COLORS["accent"],
                  linestyle=':', lw=1.5, alpha=0.6, label='Optimal')
        ax.set_xlabel('False Positive Rate')
        ax.set_ylabel('True Positive Rate')
        ax.legend(fontsize=8, framealpha=0, loc='lower right')
        ax.grid(color=CHART_COLORS["grid"], linewidth=0.5)
        clean_fig(fig)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)
        st.markdown('</div>', unsafe_allow_html=True)

    # Classification Report
    st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)
    st.markdown('''<div class="card">
    <div class="card-header">
        <div class="card-title">Classification Report</div>
        <div class="card-subtitle">Per-class metrics at current threshold</div>
    </div>''', unsafe_allow_html=True)

    rpt_df = pd.DataFrame(rpt_thresh).T.round(4)
    st.dataframe(
        rpt_df.style.format({
            "precision": "{:.4f}",
            "recall": "{:.4f}",
            "f1-score": "{:.4f}",
            "support": "{:.0f}",
        }).background_gradient(subset=["precision", "recall", "f1-score"], cmap="Blues"),
        use_container_width=True
    )
    st.markdown('</div>', unsafe_allow_html=True)

