AZIA_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{font-family:'Inter',sans-serif!important;box-sizing:border-box}
.stApp{background:#f4f5f8!important}
[data-testid="stSidebar"]{background:#fff!important;border-right:1px solid #e3e7ed!important}
[data-testid="stSidebar"] *{color:#3c4858!important}
[data-testid="stSidebar"] .stRadio>label{display:none}
[data-testid="stSidebar"] .stRadio label{
  display:flex!important;align-items:center;gap:10px;
  padding:10px 16px;border-radius:6px;font-size:.9rem;
  font-weight:500;color:#596882!important;cursor:pointer;
  transition:all .2s;margin-bottom:2px
}
[data-testid="stSidebar"] .stRadio label:hover{background:#f0f2f8;color:#0168fa!important}
[data-testid="stSidebar"] .stRadio [data-checked] label{background:#e8f0fe;color:#0168fa!important;font-weight:600}
h1,h2,h3,h4{color:#1c273c!important;font-weight:700!important}
p,span,label{color:#596882}

/* HEADER BAR */
.az-header{background:#fff;border-bottom:1px solid #e3e7ed;padding:0 20px;height:56px;
  display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;
  border-radius:0 0 0 0}
.az-logo{font-size:1.3rem;font-weight:800;color:#0168fa!important;letter-spacing:-0.5px;text-decoration:none}
.az-logo span{color:#560bd0!important}
.az-header-right{display:flex;align-items:center;gap:20px}
.az-badge{background:#0168fa;color:#fff;border-radius:12px;padding:2px 8px;font-size:.72rem;font-weight:600}

/* CARDS */
.az-card{background:#fff;border:1px solid #e3e7ed;border-radius:8px;padding:20px;margin-bottom:16px}
.az-card-header{margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f2f8}
.az-card-title{font-size:.9rem;font-weight:700;color:#1c273c;margin:0}
.az-card-text{font-size:.8rem;color:#97a3b9;margin:4px 0 0}

/* KPI CARDS */
.kpi-wrap{background:#fff;border:1px solid #e3e7ed;border-radius:8px;padding:20px 24px;position:relative;overflow:hidden;transition:box-shadow .2s}
.kpi-wrap:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
.kpi-wrap::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:8px 0 0 8px}
.kpi-blue::before{background:#0168fa}
.kpi-purple::before{background:#560bd0}
.kpi-teal::before{background:#00cccc}
.kpi-red::before{background:#dc3545}
.kpi-green::before{background:#10b759}
.kpi-label{font-size:.72rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;color:#97a3b9;margin-bottom:8px}
.kpi-value{font-size:2rem;font-weight:700;color:#1c273c;line-height:1}
.kpi-change{font-size:.78rem;font-weight:500;margin-top:6px}
.kpi-up{color:#10b759}.kpi-down{color:#dc3545}.kpi-neutral{color:#97a3b9}
.kpi-icon{position:absolute;right:20px;top:20px;font-size:1.6rem;opacity:.15}

/* LIST ITEM (Azia style) */
.az-list-item{display:flex;justify-content:space-between;align-items:center;
  padding:10px 0;border-bottom:1px solid #f0f2f8}
.az-list-item:last-child{border-bottom:none}
.az-list-label{font-size:.85rem;font-weight:600;color:#1c273c}
.az-list-sub{font-size:.76rem;color:#97a3b9;margin-top:2px}
.az-list-val{font-size:.9rem;font-weight:700;color:#0168fa}
.az-list-change{font-size:.73rem;color:#97a3b9;text-align:right}

/* PROGRESS BARS */
.az-progress-item{margin-bottom:14px}
.az-progress-header{display:flex;justify-content:space-between;font-size:.8rem;color:#596882;margin-bottom:5px}
.az-progress-bar{height:6px;background:#f0f2f8;border-radius:3px;overflow:hidden}
.az-progress-fill{height:100%;border-radius:3px;transition:width .6s ease}

/* PREDICTION */
.az-pred-high{background:#fff5f5;border:1px solid #f5c6cb;border-radius:8px;padding:24px;text-align:center}
.az-pred-safe{background:#f0fff4;border:1px solid #c3e6cb;border-radius:8px;padding:24px;text-align:center}
.az-pred-high .prob{font-size:3rem;font-weight:800;color:#dc3545}
.az-pred-safe .prob{font-size:3rem;font-weight:800;color:#10b759}
.az-pred-high .verdict{font-size:1rem;font-weight:700;color:#721c24;text-transform:uppercase;letter-spacing:1px}
.az-pred-safe .verdict{font-size:1rem;font-weight:700;color:#155724;text-transform:uppercase;letter-spacing:1px}

/* BADGE */
.badge-primary{background:#e8f0fe;color:#0168fa;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}
.badge-danger{background:#fff5f5;color:#dc3545;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}
.badge-success{background:#f0fff4;color:#10b759;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}
.badge-purple{background:#f3e8ff;color:#560bd0;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}

/* PAGE HEADER */
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.page-title{font-size:1.5rem;font-weight:700;color:#1c273c;margin:0}
.page-sub{font-size:.85rem;color:#97a3b9;margin:4px 0 0}

/* TABLE */
.az-table-header{font-size:.75rem;text-transform:uppercase;letter-spacing:.8px;color:#97a3b9;font-weight:600}

/* FORMS */
.stTextInput>div>div>input,.stNumberInput>div>div>input{
  border:1px solid #e3e7ed!important;border-radius:6px!important;
  color:#1c273c!important;font-size:.9rem!important}
.stSelectbox>div>div{border:1px solid #e3e7ed!important;border-radius:6px!important}
.stButton>button{background:#0168fa!important;color:#fff!important;border:none!important;
  border-radius:6px!important;font-weight:600!important;padding:10px 20px!important;
  font-size:.9rem!important;transition:all .2s!important}
.stButton>button:hover{background:#0152cc!important;box-shadow:0 4px 12px rgba(1,104,250,.3)!important}
.stDownloadButton>button{background:#00cccc!important;color:#fff!important;border:none!important;
  border-radius:6px!important;font-weight:600!important}
div[data-testid="stMetric"]{background:#fff;border:1px solid #e3e7ed;border-radius:8px;padding:16px}
div[data-testid="stMetric"] label{color:#97a3b9!important;font-size:.8rem!important;text-transform:uppercase;letter-spacing:.5px}
div[data-testid="stMetric"] [data-testid="stMetricValue"]{color:#1c273c!important;font-size:1.6rem!important;font-weight:700!important}
hr{border:none;border-top:1px solid #e3e7ed;margin:20px 0}
[data-testid="stExpander"]{border:1px solid #e3e7ed!important;border-radius:8px!important}
</style>
"""
