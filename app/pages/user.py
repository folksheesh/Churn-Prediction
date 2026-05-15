id="dpk0f9"
import streamlit as st

# =====================================================
# CONFIG
# =====================================================
st.set_page_config(
    page_title="ChurnSense User",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# =====================================================
# AUTH
# =====================================================
if "logged_in" not in st.session_state:
    st.switch_page("login.py")

# =====================================================
# CSS
# =====================================================
st.markdown("""
<style>

#MainMenu {visibility:hidden;}
footer {visibility:hidden;}
header {visibility:hidden;}

section[data-testid="stSidebar"]{
    display:none;
}

.stApp{
    background:#F5F7FB;
}

/* REMOVE DEFAULT PADDING */
.block-container{
    padding:0rem;
    max-width:100%;
}

/* MAIN LAYOUT */
.main{
    display:flex;
}

/* SIDEBAR */
.sidebar{
    position:fixed;
    left:0;
    top:0;
    width:260px;
    height:100vh;
    background:linear-gradient(180deg,#020617,#0F172A);
    padding:28px 20px;
}

/* LOGO */
.logo{
    color:white;
    font-size:34px;
    font-weight:800;
}

.logo-sub{
    color:#94A3B8;
    font-size:14px;
    margin-bottom:50px;
}

/* MENU */
.menu-item{
    padding:16px 18px;
    border-radius:16px;
    margin-bottom:14px;
    color:#CBD5E1;
    font-size:17px;
    font-weight:500;
    background:transparent;
}

.active{
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    color:white;
}

/* CONTENT */
.content{
    margin-left:260px;
    width:calc(100% - 260px);
    padding:40px;
}

/* HEADER */
.topbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:40px;
}

.title{
    font-size:64px;
    font-weight:800;
    color:#0F172A;
}

.subtitle{
    color:#64748B;
    font-size:22px;
}

/* PROFILE */
.profile{
    width:54px;
    height:54px;
    border-radius:50%;
    background:linear-gradient(135deg,#6366F1,#38BDF8);
    display:flex;
    align-items:center;
    justify-content:center;
    color:white;
    font-weight:700;
}

/* WELCOME */
.welcome{
    background:#EEF2FF;
    border:1px solid #C7D2FE;
    border-radius:20px;
    padding:26px;
    margin-bottom:30px;
}

/* HERO */
.hero{
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    border-radius:28px;
    padding:40px;
    color:white;
    margin-bottom:30px;
}

.hero-title{
    font-size:22px;
}

.hero-value{
    font-size:88px;
    font-weight:800;
}

/* CARDS */
.card-grid{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:20px;
}

.card{
    background:white;
    border-radius:22px;
    padding:28px;
    border:1px solid #E2E8F0;
}

.card-value{
    font-size:52px;
    font-weight:800;
    color:#0F172A;
}

.card-label{
    color:#64748B;
    font-size:18px;
}

</style>
""", unsafe_allow_html=True)

# =====================================================
# SIDEBAR
# =====================================================
st.markdown("""
<div class="sidebar">

    <div class="logo">
        ChurnSense
    </div>

    <div class="logo-sub">
        Retention Intelligence
    </div>

    <div class="menu-item active">
        📊 Dashboard
    </div>

    <div class="menu-item">
        👥 Customers
    </div>

    <div class="menu-item">
        📈 Prediction
    </div>

    <div class="menu-item">
        📤 Upload Data
    </div>

</div>
""", unsafe_allow_html=True)

# =====================================================
# CONTENT
# =====================================================
st.markdown("""
<div class="content">

    <div class="topbar">

        <div>
            <div class="title">
                Dashboard
            </div>

            <div class="subtitle">
                Welcome back! Here's your customer health overview
            </div>
        </div>

        <div class="profile">
            JD
        </div>

    </div>

    <div class="welcome">
        <b>Welcome to Your Customer Health Dashboard!</b><br><br>
        This dashboard helps you identify customers who may stop using your service.
        All charts include beginner-friendly explanations.
    </div>

    <div class="hero">
        <div class="hero-title">
            Customer Health Overview
        </div>

        <div class="hero-value">
            24.8%
        </div>

        <div>
            Monthly churn rate comparison
        </div>
    </div>

    <div class="card-grid">

        <div class="card">
            <div class="card-value">24.8%</div>
            <div class="card-label">Churn Rate</div>
        </div>

        <div class="card">
            <div class="card-value">2,847</div>
            <div class="card-label">At-Risk Customers</div>
        </div>

        <div class="card">
            <div class="card-value">8,563</div>
            <div class="card-label">Retained Customers</div>
        </div>

        <div class="card">
            <div class="card-value">11,410</div>
            <div class="card-label">Total Customers</div>
        </div>

    </div>

</div>
""", unsafe_allow_html=True)
