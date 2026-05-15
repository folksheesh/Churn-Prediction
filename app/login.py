id="x91hsy"
import streamlit as st

# =====================================================
# PAGE CONFIG
# =====================================================
st.set_page_config(
    page_title="ChurnSense",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# =====================================================
# HIDE STREAMLIT DEFAULT
# =====================================================
st.markdown("""
<style>

#MainMenu {visibility:hidden;}
footer {visibility:hidden;}
header {visibility:hidden;}

section[data-testid="stSidebar"]{
    display:none;
}

/* BACKGROUND */
.stApp{
    background:
    radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 25%),
    #020817;
}

/* MAIN CONTAINER */
.block-container{
    padding-top:40px;
    max-width:520px;
}

/* TITLE */
.title{
    text-align:center;
    color:white;
    font-size:72px;
    font-weight:800;
    margin-bottom:0px;
    line-height:1.1;
}

/* SUBTITLE */
.subtitle{
    text-align:center;
    color:#9CA3AF;
    font-size:22px;
    margin-top:8px;
    margin-bottom:50px;
}

/* SIGN IN */
.signin{
    color:white;
    font-size:42px;
    font-weight:700;
    margin-bottom:25px;
}

/* LABEL */
.stTextInput label{
    color:white !important;
    font-size:15px !important;
    font-weight:500 !important;
}

/* FORM SPACING */
.stTextInput{
    margin-bottom:18px;
}

/* INPUT */
.stTextInput input{
    background:#2A3447 !important;
    border:none !important;
    color:white !important;
    border-radius:16px !important;
    height:58px !important;
    font-size:18px !important;
    padding-left:18px !important;
}

/* PASSWORD CONTAINER */
.stTextInput div[data-baseweb="input"]{
    background:#2A3447 !important;
    border-radius:16px !important;
}

/* BUTTON */
.stButton button{
    width:100%;
    height:60px;
    background:white;
    color:#5B5BF7;
    border:none;
    border-radius:16px;
    font-size:22px;
    font-weight:700;
    margin-top:12px;
    transition:0.2s ease;
}

.stButton button:hover{
    background:#EEF2FF;
    color:#5B5BF7;
}

/* FOOTER */
.footer{
    text-align:center;
    color:#9CA3AF;
    margin-top:30px;
    font-size:16px;
}

.footer span{
    color:white;
    font-weight:600;
}

</style>
""", unsafe_allow_html=True)

# =====================================================
# SESSION
# =====================================================
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

# =====================================================
# HEADER
# =====================================================
st.markdown(
    "<div class='title'>ChurnSense</div>",
    unsafe_allow_html=True
)

st.markdown(
    "<div class='subtitle'>Retention Intelligence Platform</div>",
    unsafe_allow_html=True
)

# =====================================================
# SIGN IN TITLE
# =====================================================
st.markdown(
    "<div class='signin'>Sign In</div>",
    unsafe_allow_html=True
)

# =====================================================
# FORM
# =====================================================
email = st.text_input(
    "Email",
    placeholder="Enter your email"
)

password = st.text_input(
    "Password",
    placeholder="Enter your password",
    type="password"
)

# =====================================================
# LOGIN
# =====================================================
if st.button("Sign In →"):

    if email and password:

        st.session_state.logged_in = True
        st.session_state.email = email

        # ADMIN
        if "admin" in email.lower():

            st.session_state.role = "admin"

            st.switch_page("pages/streamlit_app.py")

        # USER
        else:

            st.session_state.role = "user"

            st.switch_page("pages/user.py")

    else:
        st.error("Please fill in all fields.")

# =====================================================
# FOOTER
# =====================================================
st.markdown(
    "<div class='footer'>Don't have an account? <span>Sign up for free</span></div>",
    unsafe_allow_html=True
)

