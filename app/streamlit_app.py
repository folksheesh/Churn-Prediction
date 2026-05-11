"""ChurnSight – Clean SaaS Dashboard"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
import streamlit as st, pandas as pd, numpy as np, matplotlib.pyplot as plt, seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from utils import load_artifacts, MODELS_DIR
from predict import predict_batch

st.set_page_config(page_title="ChurnSight", page_icon="📊", layout="wide")
st.markdown("""<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{font-family:'Inter',sans-serif!important}
.stApp{background:#F8FAFC}
[data-testid="stSidebar"]{background:#fff!important;border-right:1px solid #E5E7EB}
[data-testid="stSidebar"] *{color:#6B7280!important}
[data-testid="stSidebar"] .stRadio label{font-weight:500;font-size:.95rem;padding:8px 6px;border-radius:6px}
[data-testid="stSidebar"] .stRadio label:hover{background:#F3F4F6;color:#111827!important}
h1,h2,h3,h4{color:#111827!important;font-weight:700!important}
.top-bar{background:#fff;border-bottom:1px solid #E5E7EB;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;border-radius:10px;margin-bottom:20px}
.top-bar .search{background:#F3F4F6;border:1px solid #E5E7EB;border-radius:8px;padding:8px 16px;color:#6B7280;width:320px;font-size:.9rem}
.top-bar .profile{display:flex;align-items:center;gap:12px;color:#111827;font-weight:600}
.top-bar .balance{color:#6B7280;font-size:.85rem;margin-right:16px}
.kpi-card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;transition:box-shadow .2s}
.kpi-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
.kpi-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin-bottom:12px}
.kpi-icon.blue{background:#EFF6FF;color:#3B82F6}
.kpi-icon.green{background:#ECFDF5;color:#10B981}
.kpi-icon.red{background:#FEF2F2;color:#EF4444}
.kpi-icon.purple{background:#F5F3FF;color:#8B5CF6}
.kpi-label{font-size:.8rem;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;font-weight:500}
.kpi-val{font-size:1.8rem;font-weight:700;color:#111827;margin:4px 0}
.kpi-change{font-size:.78rem;font-weight:500}
.kpi-change.up{color:#10B981}
.kpi-change.down{color:#EF4444}
.card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:16px}
.card-title{font-size:.95rem;font-weight:600;color:#111827;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6}
.pred-result{border-radius:12px;padding:28px;text-align:center}
.pred-result.danger{background:#FEF2F2;border:1px solid #FECACA}
.pred-result.safe{background:#ECFDF5;border:1px solid #A7F3D0}
.pred-result .big{font-size:2.2rem;font-weight:700}
.pred-result.danger .big{color:#EF4444}
.pred-result.safe .big{color:#10B981}
.pred-result .sub{font-size:.85rem;color:#6B7280;margin-top:4px}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600}
.pill.red{background:#FEF2F2;color:#EF4444;border:1px solid #FECACA}
.pill.green{background:#ECFDF5;color:#10B981;border:1px solid #A7F3D0}
.activity-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6}
.activity-dot{width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0}
.activity-text{font-size:.85rem;color:#374151}
.activity-time{font-size:.75rem;color:#9CA3AF}
</style>""", unsafe_allow_html=True)

ROOT = os.path.join(os.path.dirname(__file__), "..")
PROC = os.path.join(ROOT, "data", "processed", "cleaned_churn_data.csv")

@st.cache_resource(show_spinner="Loading model…")
def get_pipeline(): return load_artifacts(MODELS_DIR)
@st.cache_data(show_spinner="Loading data…")
def get_data(): return pd.read_csv(PROC) if os.path.exists(PROC) else None

def light_fig(fig):
    fig.patch.set_facecolor('#FFFFFF')
    for ax in fig.axes:
        ax.set_facecolor('#FFFFFF')
        ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#E5E7EB'); ax.spines['bottom'].set_color('#E5E7EB')
        ax.tick_params(colors='#6B7280',labelsize=9)
        ax.xaxis.label.set_color('#6B7280'); ax.yaxis.label.set_color('#6B7280')
        if ax.get_title(): ax.title.set_color('#111827'); ax.title.set_fontweight('600')
    return fig

try: pipeline = get_pipeline()
except: st.error("Model not found. Run `python src/train_model.py` first."); st.stop()
df = get_data()

with st.sidebar:
    st.markdown("### 📊 ChurnSight")
    st.caption("Customer Analytics")
    st.markdown("---")
    page = st.radio("", ["🏠  Home","📈  Analytics","🔍  Behavior","🎯  Prediction","📂  Upload","⚙️  Performance"], label_visibility="collapsed")

# Top bar
st.markdown("""<div class="top-bar">
<div class="search">🔍 Search customers, metrics…</div>
<div style="display:flex;align-items:center;gap:16px">
<span class="balance">● System Active</span>
<div class="profile">👤 Admin</div>
</div></div>""", unsafe_allow_html=True)

# ═══ HOME ═══
if "Home" in page:
    st.markdown("## Home"); st.caption("Overview of key metrics")
    if df is None: st.warning("No data found."); st.stop()
    total=len(df); ch=int(df["churn"].sum()) if "churn" in df.columns else 0; safe=total-ch; rate=ch/total*100 if total else 0
    c1,c2,c3,c4=st.columns(4)
    for col,icon,icls,lbl,val,chg in [
        (c1,"👥","blue","Total Customers",f"{total:,}","+3.2%"),
        (c2,"✅","green","Retained",f"{safe:,}","+1.8%"),
        (c3,"🚨","red","Churned",f"{ch:,}",f"-{rate:.1f}%"),
        (c4,"📊","purple","Churn Rate",f"{rate:.1f}%","vs 10% target")]:
        ccls = "up" if "+" in chg else "down"
        col.markdown(f'''<div class="kpi-card">
        <div class="kpi-icon {icls}">{icon}</div>
        <div class="kpi-label">{lbl}</div>
        <div class="kpi-val">{val}</div>
        <div class="kpi-change {ccls}">{chg}</div></div>''', unsafe_allow_html=True)

    st.markdown("<div style='height:20px'></div>", unsafe_allow_html=True)
    left,right=st.columns([2,1])
    with left:
        st.markdown('<div class="card"><div class="card-title">📈 Churn Distribution</div>', unsafe_allow_html=True)
        fig,ax=plt.subplots(figsize=(7,3.5))
        colors=["#3B82F6","#EF4444"]
        w,t,a=ax.pie([safe,ch],labels=["Retained","Churned"],colors=colors,autopct="%1.1f%%",startangle=140,wedgeprops={"edgecolor":"white","linewidth":2})
        for x in a: x.set_fontweight("600"); x.set_fontsize(11)
        centre=plt.Circle((0,0),0.55,fc='white'); fig.gca().add_artist(centre)
        light_fig(fig); st.pyplot(fig); plt.close(fig)
        st.markdown('</div>', unsafe_allow_html=True)
    with right:
        st.markdown('<div class="card"><div class="card-title">📋 Quick Stats</div>', unsafe_allow_html=True)
        stats = {"Avg Login Days": df.get("avg_frequency_login_days",pd.Series([0])).mean(),
                 "Avg Points": df.get("points_in_wallet",pd.Series([0])).mean(),
                 "Avg Session": df.get("avg_session_duration",pd.Series([0])).mean()}
        for k,v in stats.items():
            st.markdown(f'<div class="activity-item"><div class="activity-dot" style="background:#3B82F6"></div><div><div class="activity-text">{k}</div><div class="activity-time">{v:,.1f}</div></div></div>', unsafe_allow_html=True)
        if "sentiment_kategori" in df.columns:
            top_s = df["sentiment_kategori"].value_counts().head(3)
            for s,c in top_s.items():
                st.markdown(f'<div class="activity-item"><div class="activity-dot" style="background:#10B981"></div><div><div class="activity-text">{s}</div><div class="activity-time">{c:,} customers</div></div></div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

# ═══ ANALYTICS ═══
elif "Analytics" in page:
    st.markdown("## Analytics"); st.caption("Feature importance & distributions")
    model,fn=pipeline["model"],pipeline["feature_names"]
    fi=pd.DataFrame({"f":fn,"i":model.feature_importances_}).sort_values("i",ascending=False).head(12)
    st.markdown('<div class="card"><div class="card-title">🏆 Top Feature Importance</div>',unsafe_allow_html=True)
    fig,ax=plt.subplots(figsize=(10,5))
    ax.barh(fi["f"][::-1],fi["i"][::-1],color="#3B82F6",height=0.5)
    ax.set_xlabel("Importance"); ax.grid(axis='x',color='#F3F4F6',linestyle='-')
    light_fig(fig); st.pyplot(fig); plt.close(fig)
    st.markdown('</div>',unsafe_allow_html=True)
    if df is not None:
        cols=[c for c in ["api_calls_90d","logins_90d","active_days_90d","avg_transaction_value","points_in_wallet"] if c in df.columns]
        sel=st.multiselect("Select features",cols,default=cols[:3])
        if sel and "churn" in df.columns:
            st.markdown('<div class="card"><div class="card-title">📊 Feature Distributions by Churn</div>',unsafe_allow_html=True)
            fig,axes=plt.subplots(1,len(sel),figsize=(5*len(sel),3.5))
            if len(sel)==1: axes=[axes]
            for ax,c in zip(axes,sel):
                ax.hist(df[df.churn==0][c].dropna(),bins=35,alpha=.6,color="#3B82F6",label="Retained",density=True)
                ax.hist(df[df.churn==1][c].dropna(),bins=35,alpha=.6,color="#EF4444",label="Churned",density=True)
                ax.set_title(c.replace("_"," ").title(),fontsize=10); ax.legend(fontsize=8)
            light_fig(fig); st.pyplot(fig); plt.close(fig)
            st.markdown('</div>',unsafe_allow_html=True)

# ═══ BEHAVIOR ═══
elif "Behavior" in page:
    st.markdown("## Behavioral Insights"); st.caption("Compare retained vs churned customers")
    if df is None or "churn" not in df.columns: st.warning("Data not available."); st.stop()
    cols=[c for c in ["api_calls_90d","logins_90d","active_days_90d","session_minutes_90d","days_since_last_login"] if c in df.columns]
    sel=st.selectbox("Select metric",cols)
    c1,c2=st.columns(2)
    with c1:
        st.markdown('<div class="card"><div class="card-title">Density Plot</div>',unsafe_allow_html=True)
        fig,ax=plt.subplots(figsize=(6,4))
        sns.kdeplot(data=df[df.churn==0],x=sel,fill=True,color="#3B82F6",alpha=.25,lw=2,label="Retained",ax=ax)
        sns.kdeplot(data=df[df.churn==1],x=sel,fill=True,color="#EF4444",alpha=.25,lw=2,label="Churned",ax=ax)
        ax.legend(); ax.set_xlabel(sel.replace("_"," ").title())
        light_fig(fig); st.pyplot(fig); plt.close(fig)
        st.markdown('</div>',unsafe_allow_html=True)
    with c2:
        st.markdown('<div class="card"><div class="card-title">Boxplot Comparison</div>',unsafe_allow_html=True)
        fig,ax=plt.subplots(figsize=(6,4))
        sns.boxplot(x="churn",y=sel,data=df,palette=["#3B82F6","#EF4444"],boxprops=dict(alpha=.7),ax=ax)
        ax.set_xticklabels(["Retained","Churned"])
        ax.set_xlabel(""); ax.set_ylabel(sel.replace("_"," ").title())
        light_fig(fig); st.pyplot(fig); plt.close(fig)
        st.markdown('</div>',unsafe_allow_html=True)

# ═══ PREDICTION ═══
elif "Prediction" in page:
    st.markdown("## Churn Prediction"); st.caption("Input customer data to predict churn risk")
    cl,cr=st.columns([1.6,1])
    with cl:
        with st.form("pf"):
            st.markdown('<div class="card-title">Customer Profile</div>',unsafe_allow_html=True)
            r1,r2,r3=st.columns(3)
            api=r1.number_input("API Calls 90d",0,value=5000); lg=r2.number_input("Logins 90d",0,value=30); ad=r3.number_input("Active Days 90d",0,value=25)
            atx=r1.number_input("Avg Tx Value",0.0,value=500.0,step=10.0); sm=r2.number_input("Session Min 90d",0.0,value=800.0,step=10.0); dl=r3.number_input("Days Since Login",0,value=5)
            pw=r1.number_input("Points Wallet",0.0,value=300.0); asd=r2.number_input("Avg Session Dur",0.0,value=60.0); af=r3.number_input("Avg Freq Login",0.0,value=20.0)
            dj=r1.number_input("Days Joined",0,value=365); da=r2.number_input("Days Active",0,value=3); age=r3.number_input("Age",10,100,value=35)
            st.markdown("---")
            p1,p2,p3=st.columns(3)
            gen=p1.selectbox("Gender",["M","F"]); reg=p2.selectbox("Region",["City","Town","Village"]); pt=p3.selectbox("Plan",["Basic","Enterprise","Premium"])
            ref=p1.selectbox("Referral",["Yes","No"]); off=p2.selectbox("Offer",["Gift Vouchers/Coupons","Credit/Debit Card Offers","Without Offers"]); med=p3.selectbox("Medium",["Desktop","Smartphone","Both"])
            net=p1.selectbox("Internet",["Wi-Fi","Mobile_Data","Fiber_Optic"]); cmp=p2.selectbox("Complaint",["Yes","No"]); cs=p3.selectbox("Complaint Status",["Solved","Unsolved","Solved in Follow-up","Not Applicable","No Info"])
            fb=p1.selectbox("Feedback",["Quality Customer Care","Products always in Stock","User Friendly Website","Reasonable Price","Poor Website","Poor Customer Service","Poor Product Quality","Too Many Ads","No reason specified"])
            dc=p2.selectbox("Discount",["Yes","No"]); op=p3.selectbox("Offer Pref",["Yes","No"])
            sub=st.form_submit_button("Predict Churn Risk",use_container_width=True,type="primary")
    with cr:
        st.markdown('<div class="card-title">Result</div>',unsafe_allow_html=True)
        if not sub:
            st.markdown('<div class="card" style="text-align:center;padding:40px"><p style="font-size:2.5rem;opacity:.4">🎯</p><p style="color:#6B7280">Fill the form and click predict</p></div>',unsafe_allow_html=True)
        else:
            row=dict(age=age,gender=gen,region_category=reg,joined_through_referral=ref,preferred_offer_types=off,medium_of_operation=med,internet_option=net,days_since_last_login=dl,avg_session_duration=asd,avg_transaction_value=atx,avg_frequency_login_days=af,points_in_wallet=pw,used_special_discount=dc,offer_application_preference=op,past_complaint=cmp,complaint_status=cs,feedback=fb,plan_tier=pt,logins_90d=lg,active_days_90d=ad,api_calls_90d=api,session_minutes_90d=sm,days_since_active=da,days_since_joined=dj)
            with st.spinner("Analyzing…"):
                res=predict_batch(pd.DataFrame([row]),pipeline)
            p=int(res["prediction"].iloc[0]); prob=float(res["probability"].iloc[0])
            cls="danger" if p else "safe"; lbl="HIGH CHURN RISK" if p else "LOW RISK"
            clr="#EF4444" if p else "#10B981"
            st.markdown(f'<div class="pred-result {cls}"><div class="big">{lbl}</div><div style="font-size:2.8rem;font-weight:800;color:{clr};margin:12px 0">{prob:.1%}</div><div class="sub">Churn Probability</div></div>',unsafe_allow_html=True)
            st.markdown("<div style='height:12px'></div>",unsafe_allow_html=True)
            risk="Critical 🔴" if prob>.7 else "Moderate 🟡" if prob>.4 else "Low 🟢"
            m1,m2=st.columns(2); m1.metric("Risk Level",risk); m2.metric("Prediction","Churn" if p else "Retained")

# ═══ UPLOAD ═══
elif "Upload" in page:
    st.markdown("## Batch Prediction"); st.caption("Upload CSV to predict multiple customers")
    up=st.file_uploader("Upload CSV",type="csv")
    if up:
        du=pd.read_csv(up); st.success(f"Loaded {du.shape[0]:,} rows")
        with st.expander("Preview",expanded=True): st.dataframe(du.head(),use_container_width=True)
        if st.button("Run Prediction",use_container_width=True,type="primary"):
            with st.spinner("Processing…"):
                r=predict_batch(du,pipeline).sort_values("probability",ascending=False)
            cn=int((r.prediction==1).sum()); tot=len(r)
            k1,k2,k3=st.columns(3); k1.metric("Total",f"{tot:,}"); k2.metric("Predicted Churn",f"{cn:,}"); k3.metric("Churn Rate",f"{cn/tot*100:.1f}%")
            mp=st.slider("Min probability filter",0.0,1.0,0.0,0.05)
            fl=r[r.probability>=mp]
            st.write(f"**{len(fl):,}** customers shown")
            st.dataframe(fl,use_container_width=True,height=380)
            st.download_button("Download CSV",fl.to_csv(index=False).encode(),"predictions.csv","text/csv",use_container_width=True)

# ═══ PERFORMANCE ═══
elif "Performance" in page:
    st.markdown("## Model Performance"); st.caption("Evaluation metrics")
    if df is None or "churn" not in df.columns: st.warning("Need processed data with churn labels."); st.stop()
    from feature_engineering import encode_inference, apply_scaler
    @st.cache_data(show_spinner="Computing…")
    def comp(_d,_f,_l,_s):
        de=encode_inference(_d.drop(columns=["churn"],errors="ignore"),_l,_f)
        xs=apply_scaler(_s,de); return pipeline["model"].predict(xs),pipeline["model"].predict_proba(xs)[:,1]
    yt=df.churn.astype(int); yp,ypr=comp(df,pipeline["feature_names"],pipeline["label_encoders"],pipeline["scaler"])
    auc=roc_auc_score(yt,ypr); rpt=classification_report(yt,yp,target_names=["Retained","Churned"],output_dict=True)
    k1,k2,k3=st.columns(3)
    k1.metric("ROC-AUC",f"{auc:.4f}"); k2.metric("Precision",f'{rpt["Churned"]["precision"]:.3f}'); k3.metric("Recall",f'{rpt["Churned"]["recall"]:.3f}')
    c1,c2=st.columns(2)
    with c1:
        st.markdown('<div class="card"><div class="card-title">Confusion Matrix</div>',unsafe_allow_html=True)
        fig,ax=plt.subplots(figsize=(5,4))
        sns.heatmap(confusion_matrix(yt,yp),annot=True,fmt="d",cmap="Blues",ax=ax,xticklabels=["Retained","Churned"],yticklabels=["Retained","Churned"])
        ax.set_xlabel("Predicted"); ax.set_ylabel("Actual"); light_fig(fig); st.pyplot(fig); plt.close(fig)
        st.markdown('</div>',unsafe_allow_html=True)
    with c2:
        st.markdown('<div class="card"><div class="card-title">ROC Curve</div>',unsafe_allow_html=True)
        fpr,tpr,_=roc_curve(yt,ypr); fig,ax=plt.subplots(figsize=(5,4))
        ax.plot(fpr,tpr,color="#3B82F6",lw=2,label=f"AUC={auc:.4f}"); ax.plot([0,1],[0,1],"--",color="#D1D5DB",lw=1)
        ax.set_xlabel("FPR"); ax.set_ylabel("TPR"); ax.legend(fontsize=9); ax.grid(color="#F3F4F6")
        light_fig(fig); st.pyplot(fig); plt.close(fig)
        st.markdown('</div>',unsafe_allow_html=True)
    st.markdown("**Classification Report**"); st.dataframe(pd.DataFrame(rpt).T.round(3),use_container_width=True)
