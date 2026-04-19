"""
template_renderer.py
Builds the Azia HTML template with injected churn data.
"""
import json, os

AZIA_DIR = r"C:\Users\mp2pf\Downloads\master\Azia-Admin-Bootstrap-Template-master"

def _read(path):
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return ""

def build_dashboard(data: dict) -> str:
    """
    data keys:
      total, churn_n, safe_n, churn_rate,
      feature_names (list), feature_importances (list),
      sentiment_counts (dict),
      plan_counts (dict),
      logins_mean_retained, logins_mean_churned,
      active_days_mean_retained, active_days_mean_churned,
    """
    azia_css = _read(os.path.join(AZIA_DIR, "css", "azia.css"))
    d = json.dumps(data)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
<title>ChurnSight Analytics</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/typicons/2.0.9/typicons.min.css">
<style>{azia_css}</style>
<style>
  body{{overflow-x:hidden;font-family:'Inter',sans-serif}}
  .az-header{{position:sticky;top:0;z-index:999}}
  .kpi-subtitle{{font-size:.75rem;color:#97a3b9;margin-top:4px}}
  .az-churn-badge{{display:inline-block;background:#dc3545;color:#fff;
    border-radius:20px;padding:2px 10px;font-size:.75rem;font-weight:600}}
  .az-safe-badge{{display:inline-block;background:#10b759;color:#fff;
    border-radius:20px;padding:2px 10px;font-size:.75rem;font-weight:600}}
  .az-purple-badge{{display:inline-block;background:#560bd0;color:#fff;
    border-radius:20px;padding:2px 10px;font-size:.75rem;font-weight:600}}
  canvas{{max-width:100%}}
</style>
</head>
<body>

<!-- HEADER (Azia style) -->
<div class="az-header">
  <div class="container-fluid px-4">
    <div class="az-header-left">
      <a href="#" class="az-logo"><span></span> ChurnSight</a>
    </div>
    <div class="az-header-menu d-none d-lg-block">
      <ul class="nav">
        <li class="nav-item active"><a class="nav-link" href="#overview"><i class="typcn typcn-chart-area-outline"></i> Overview</a></li>
        <li class="nav-item"><a class="nav-link" href="#features"><i class="typcn typcn-chart-bar-outline"></i> Features</a></li>
        <li class="nav-item"><a class="nav-link" href="#behavior"><i class="typcn typcn-group-outline"></i> Behavior</a></li>
        <li class="nav-item"><a class="nav-link" href="#advanced"><i class="typcn typcn-cog-outline"></i> Advanced</a></li>
        <li class="nav-item"><a class="nav-link" href="#report"><i class="typcn typcn-document-text"></i> Exec. Report</a></li>
      </ul>
    </div>
    <div class="az-header-right">
      <span class="az-safe-badge">● System Online</span>
      &nbsp;
      <a href="#" class="az-img-user" style="width:32px;height:32px;background:#0168fa;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;text-decoration:none">A</a>
    </div>
  </div>
</div>

<!-- MAIN CONTENT -->
<div class="az-content">
  <div class="container-fluid px-4">
    <div class="az-content-body">

      <!-- PAGE HEADER -->
      <div class="az-dashboard-one-title" id="overview">
        <div>
          <h2 class="az-dashboard-title">Hi, welcome back!</h2>
          <p class="az-dashboard-text">Churn Prediction Analytics Dashboard</p>
        </div>
        <div class="az-content-header-right">
          <div class="media"><div class="media-body"><label>Model</label><h6>XGBoost v2</h6></div></div>
          <div class="media"><div class="media-body"><label>Status</label><h6 style="color:#10b759">Active</h6></div></div>
          <span class="az-purple-badge">Export Ready</span>
        </div>
      </div>

      <!-- DASHBOARD NAV TABS -->
      <div class="az-dashboard-nav">
        <nav class="nav">
          <a class="nav-link active" data-toggle="tab" href="#">Overview</a>
          <a class="nav-link" data-toggle="tab" href="#">Features</a>
          <a class="nav-link" data-toggle="tab" href="#">Behavior</a>
        </nav>
        <nav class="nav">
          <a class="nav-link" href="#"><i class="far fa-save"></i> Save Report</a>
          <a class="nav-link" href="#"><i class="far fa-file-pdf"></i> Export PDF</a>
        </nav>
      </div>

      <!-- KPI ROW (uses card-dashboard-two style) -->
      <div class="row row-sm mg-b-20">
        <div class="col-sm-6 col-lg-3">
          <div class="card card-dashboard-two">
            <div class="card-header">
              <h6 id="kpi-total">--</h6>
              <p>Total Customers</p>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:40px">
                <canvas id="sparkTotal"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3 mg-t-20 mg-sm-t-0">
          <div class="card card-dashboard-two">
            <div class="card-header">
              <h6 id="kpi-churn" style="color:#dc3545">--</h6>
              <p>Churned</p>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:40px">
                <canvas id="sparkChurn"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-two">
            <div class="card-header">
              <h6 id="kpi-safe" style="color:#10b759">--</h6>
              <p>Retained</p>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:40px">
                <canvas id="sparkSafe"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-two">
            <div class="card-header">
              <h6 id="kpi-rate" style="color:#560bd0">--</h6>
              <p>Churn Rate</p>
            </div>
            <div class="card-body">
              <div class="chart-wrapper" style="height:40px">
                <canvas id="sparkRate"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CHARTS ROW -->
      <div class="row row-sm mg-b-20">
        <!-- Churn vs Retained Bar Chart (card-dashboard-one style) -->
        <div class="col-lg-7">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Churn Distribution</h6>
                <p class="card-text">Retained vs Churned customer breakdown</p>
              </div>
            </div>
            <div class="card-body">
              <div class="card-body-top">
                <div><label class="mg-b-0">Retained</label><h2 id="lbl-safe">--</h2></div>
                <div><label class="mg-b-0">Churned</label><h2 id="lbl-churn">--</h2></div>
                <div><label class="mg-b-0">Churn Rate</label><h2 id="lbl-rate">--</h2></div>
              </div>
              <div style="height:250px;margin-top:20px">
                <canvas id="churnBarChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Sentiment donut (card-dashboard-four style) -->
        <div class="col-lg-5 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-four">
            <div class="card-header">
              <h6 class="card-title">Sentiment Analysis</h6>
            </div>
            <div class="card-body row">
              <div class="col-md-6 d-flex align-items-center justify-content-center">
                <div style="height:180px;width:180px">
                  <canvas id="sentimentDonut"></canvas>
                </div>
              </div>
              <div class="col-md-6 mg-t-20 mg-md-t-0" id="sentiment-legend"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- FEATURE IMPORTANCE ROW -->
      <div class="row row-sm mg-b-20" id="features">
        <div class="col-lg-8">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Top Feature Importances</h6>
                <p class="card-text">Most predictive features from XGBoost model</p>
              </div>
            </div>
            <div class="card-body">
              <div style="height:300px">
                <canvas id="featureChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-pageviews">
            <div class="card-header">
              <h6 class="card-title">Feature Ranking</h6>
              <p class="card-text">Top 6 by importance score</p>
            </div>
            <div class="card-body" id="feature-list"></div>
          </div>
        </div>
      </div>

      <!-- BEHAVIOR ROW -->
      <div class="row row-sm mg-b-20" id="behavior">
        <div class="col-lg-6">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Avg Logins (90d) by Cohort</h6>
                <p class="card-text">Retained vs Churned comparison</p>
              </div>
            </div>
            <div class="card-body">
              <div style="height:220px">
                <canvas id="loginBehaviorChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Avg Active Days (90d) by Cohort</h6>
                <p class="card-text">Retained vs Churned comparison</p>
              </div>
            </div>
            <div class="card-body">
              <div style="height:220px">
                <canvas id="activeBehaviorChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PLAN TABLE & HIGH RISK TABLE ROW -->
      <div class="row row-sm mg-b-20">
        <div class="col-lg-6">
          <div class="card card-table-one" style="height:100%">
            <h6 class="card-title">Plan Tier Distribution</h6>
            <p class="az-content-text mg-b-20">Customer distribution across subscription tiers</p>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Plan Tier</th>
                    <th>Total Customers</th>
                    <th>Share</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="plan-table-body"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mg-t-20 mg-lg-t-0">
          <div class="card card-table-two" style="height:100%; border:1px solid #e3e7ed; border-radius:8px; padding:20px; background:#fff">
            <h6 class="card-title" style="margin-bottom:5px; color:#1c273c; font-weight:700">High-Risk Churn Alerts 🚨</h6>
            <p class="az-content-text mg-b-20">Top 5 customers with highest predicted churn probability</p>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr style="color:#97a3b9; font-size:0.75rem; text-transform:uppercase">
                    <th>Customer ID</th>
                    <th>Plan</th>
                    <th>Logins</th>
                    <th>Sentiment</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody id="risk-table-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ADVANCED EVALUATION ROW -->
      <div class="row row-sm mg-b-20" id="advanced">
        <div class="col-lg-6">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Model ROC Curve</h6>
                <p class="card-text">Receiver Operating Characteristic (AUC: <span id="lbl-auc">--</span>)</p>
              </div>
            </div>
            <div class="card-body">
              <div style="height:250px">
                <canvas id="rocChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mg-t-20 mg-lg-t-0">
          <div class="card card-dashboard-one">
            <div class="card-header">
              <div>
                <h6 class="card-title">Confusion Matrix</h6>
                <p class="card-text">Prediction accuracy heatmap</p>
              </div>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center">
              <!-- Custom HTML Heatmap for CM -->
              <table style="text-align:center; width:80%; max-width:400px; border-collapse:collapse; font-size:1.1rem; color:#1c273c">
                <tr>
                  <td></td>
                  <td colspan="2" style="padding-bottom:10px; font-weight:600; color:#97a3b9">Predicted</td>
                </tr>
                <tr>
                  <td rowspan="2" style="padding-right:10px; font-weight:600; color:#97a3b9">Actual</td>
                  <td id="cm-00" style="padding:20px; border:2px solid #fff; border-radius:8px">--</td>
                  <td id="cm-01" style="padding:20px; border:2px solid #fff; border-radius:8px">--</td>
                </tr>
                <tr>
                  <td id="cm-10" style="padding:20px; border:2px solid #fff; border-radius:8px">--</td>
                  <td id="cm-11" style="padding:20px; border:2px solid #fff; border-radius:8px">--</td>
                </tr>
                <tr>
                  <td></td>
                  <td style="padding-top:10px; font-size:.8rem; color:#97a3b9">Retained (0)</td>
                  <td style="padding-top:10px; font-size:.8rem; color:#97a3b9">Churned (1)</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- BUSINESS EXECUTIVE REPORT ROW -->
      <div class="row row-sm mg-b-20" id="report">
        <div class="col-12">
          <div class="card card-dashboard-pageviews">
            <div class="card-header" style="border-bottom:1px solid #f0f2f8; padding-bottom:15px; margin-bottom:15px">
              <h6 class="card-title" style="font-size:1.1rem; color:#1c273c"><i class="typcn typcn-chart-pie" style="color:#0168fa"></i> Executive Business Impact Report</h6>
              <p class="card-text">Key financial and operational insights derived from the model predictions</p>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 border-right">
                  <div class="az-list-item" style="border:none; padding-bottom:5px">
                    <div>
                      <h6 style="font-size:.85rem; color:#97a3b9; text-transform:uppercase; letter-spacing:1px">Estimated Revenue at Risk</h6>
                      <h3 style="color:#dc3545; font-weight:700; margin-top:5px" id="lbl-rev-risk">$0.00</h3>
                      <span style="font-size:.75rem; color:#97a3b9">Total transaction value of predicted churners</span>
                    </div>
                    <div style="font-size:3rem; color:#f0f2f8; line-height:1"><i class="fas fa-money-bill-wave"></i></div>
                  </div>
                </div>
                <div class="col-md-6 pl-md-4">
                  <div class="az-list-item" style="border:none; padding-bottom:5px">
                    <div>
                      <h6 style="font-size:.85rem; color:#97a3b9; text-transform:uppercase; letter-spacing:1px">Top Churn Driver (Feedback)</h6>
                      <h4 style="color:#560bd0; font-weight:700; margin-top:5px" id="lbl-top-fb">--</h4>
                      <span style="font-size:.75rem; color:#97a3b9">Accounted for <strong id="lbl-top-fb-pct">--%</strong> of churned customers</span>
                    </div>
                    <div style="font-size:3rem; color:#f0f2f8; line-height:1"><i class="fas fa-comment-dots"></i></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- az-content-body -->
  </div>
</div>

<!-- FOOTER -->
<div class="az-footer ht-40">
  <div class="container-fluid px-4 ht-100p pd-t-0-f">
    <span class="text-muted">ChurnSight © 2024 · Powered by XGBoost</span>
  </div>
</div>

<!-- SCRIPTS via CDN -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.bundle.min.js"></script>

<script>
// ── INJECT PYTHON DATA ─────────────────────────────────
const DATA = {d};

// ── POPULATE KPIs ──────────────────────────────────────
document.getElementById('kpi-total').textContent = DATA.total.toLocaleString();
document.getElementById('kpi-churn').textContent = DATA.churn_n.toLocaleString();
document.getElementById('kpi-safe').textContent  = DATA.safe_n.toLocaleString();
document.getElementById('kpi-rate').textContent  = DATA.churn_rate.toFixed(1) + '%';
document.getElementById('lbl-safe').textContent  = DATA.safe_n.toLocaleString();
document.getElementById('lbl-churn').textContent = DATA.churn_n.toLocaleString();
document.getElementById('lbl-rate').textContent  = DATA.churn_rate.toFixed(1) + '%';

// ── CHURN BAR CHART ────────────────────────────────────
new Chart(document.getElementById('churnBarChart'), {{
  type: 'bar',
  data: {{
    labels: ['Retained', 'Churned'],
    datasets: [{{
      data: [DATA.safe_n, DATA.churn_n],
      backgroundColor: ['rgba(1,104,250,0.8)', 'rgba(220,53,69,0.8)'],
      borderColor: ['#0168fa', '#dc3545'],
      borderWidth: 1, borderRadius: 4
    }}]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false,
    legend: {{display: false}},
    scales: {{
      yAxes: [{{ticks: {{beginAtZero:true, fontColor:'#97a3b9'}}, gridLines:{{color:'#f0f2f8'}}}}],
      xAxes: [{{ticks: {{fontColor:'#97a3b9'}}, gridLines:{{display:false}}}}]
    }}
  }}
}});

// ── SENTIMENT DONUT ────────────────────────────────────
const sentColors = ['#10b759','#0168fa','#97a3b9','#fd7e14','#dc3545'];
const sentLabels = Object.keys(DATA.sentiment_counts);
const sentVals   = Object.values(DATA.sentiment_counts);
new Chart(document.getElementById('sentimentDonut'), {{
  type: 'doughnut',
  data: {{
    labels: sentLabels,
    datasets: [{{ data: sentVals, backgroundColor: sentColors, borderWidth: 2, borderColor:'#fff' }}]
  }},
  options: {{ responsive:true, maintainAspectRatio:false, legend:{{display:false}}, cutoutPercentage:65 }}
}});
// Legend
const legEl = document.getElementById('sentiment-legend');
sentLabels.forEach((l,i) => {{
  legEl.innerHTML += `<div class="az-traffic-detail-item">
    <div><span>${{l}}</span><span style="color:${{sentColors[i]}};font-weight:700">${{sentVals[i].toLocaleString()}}</span></div>
    <div class="progress"><div class="progress-bar" role="progressbar"
      style="width:${{Math.round(sentVals[i]/DATA.total*100)}}%;background:${{sentColors[i]}}"></div></div>
  </div>`;
}});

// ── FEATURE IMPORTANCE BAR (horizontal) ────────────────
const fi = DATA.feature_names.map((n,i) => ({{n, v:DATA.feature_importances[i]}}))
             .sort((a,b)=>b.v-a.v).slice(0,12);
new Chart(document.getElementById('featureChart'), {{
  type: 'horizontalBar',
  data: {{
    labels: fi.map(x=>x.n),
    datasets: [{{
      data: fi.map(x=>x.v),
      backgroundColor: fi.map((_,i)=> i<3?'#0168fa': i<6?'#560bd0':'rgba(1,104,250,0.4)'),
      borderWidth: 0, borderRadius: 4
    }}]
  }},
  options: {{
    responsive:true, maintainAspectRatio:false, legend:{{display:false}},
    scales: {{
      xAxes:[{{ticks:{{beginAtZero:true,fontColor:'#97a3b9'}},gridLines:{{color:'#f0f2f8'}}}}],
      yAxes:[{{ticks:{{fontColor:'#596882',fontSize:11}},gridLines:{{display:false}}}}]
    }}
  }}
}});

// Feature list
const listEl = document.getElementById('feature-list');
fi.slice(0,6).forEach((f,i) => {{
  const pct = Math.round(f.v / fi[0].v * 100);
  listEl.innerHTML += `<div class="az-list-item">
    <div><h6>${{f.n}}</h6><span>${{(f.v*100).toFixed(2)}}%</span></div>
    <div><h6 class="tx-primary">#${{i+1}}</h6><span>${{pct}}% rel</span></div>
  </div>`;
}});

// ── BEHAVIOR CHARTS ────────────────────────────────────
new Chart(document.getElementById('loginBehaviorChart'), {{
  type: 'bar',
  data: {{
    labels: ['Retained', 'Churned'],
    datasets: [{{
      label: 'Avg Logins (90d)',
      data: [DATA.logins_mean_retained, DATA.logins_mean_churned],
      backgroundColor: ['rgba(1,104,250,0.7)','rgba(220,53,69,0.7)'],
      borderWidth: 0
    }}]
  }},
  options: {{
    responsive:true, maintainAspectRatio:false,
    legend:{{display:false}},
    scales:{{
      yAxes:[{{ticks:{{beginAtZero:true,fontColor:'#97a3b9'}},gridLines:{{color:'#f0f2f8'}}}}],
      xAxes:[{{ticks:{{fontColor:'#97a3b9'}},gridLines:{{display:false}}}}]
    }}
  }}
}});

new Chart(document.getElementById('activeBehaviorChart'), {{
  type: 'bar',
  data: {{
    labels: ['Retained', 'Churned'],
    datasets: [{{
      label: 'Avg Active Days',
      data: [DATA.active_days_mean_retained, DATA.active_days_mean_churned],
      backgroundColor: ['rgba(0,204,204,0.7)','rgba(253,126,20,0.7)'],
      borderWidth: 0
    }}]
  }},
  options: {{
    responsive:true, maintainAspectRatio:false,
    legend:{{display:false}},
    scales:{{
      yAxes:[{{ticks:{{beginAtZero:true,fontColor:'#97a3b9'}},gridLines:{{color:'#f0f2f8'}}}}],
      xAxes:[{{ticks:{{fontColor:'#97a3b9'}},gridLines:{{display:false}}}}]
    }}
  }}
}});

// ── PLAN TABLE ─────────────────────────────────────────
const tbody = document.getElementById('plan-table-body');
const planTotal = Object.values(DATA.plan_counts).reduce((a,b)=>a+b,0);
const planColors = {{'Basic':'#97a3b9','Enterprise':'#0168fa','Premium':'#560bd0','Pro':'#00cccc'}};
Object.entries(DATA.plan_counts).forEach(([plan,count]) => {{
  const pct = (count/planTotal*100).toFixed(1);
  const c = planColors[plan] || '#0168fa';
  tbody.innerHTML += `<tr>
    <td><strong>${{plan}}</strong></td>
    <td><strong>${{count.toLocaleString()}}</strong></td>
    <td>${{pct}}%</td>
    <td><span style="background:${{c}}20;color:${{c}};padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600">${{plan}}</span></td>
  </tr>`;
}});

// ── RISK TABLE ─────────────────────────────────────────
const rbody = document.getElementById('risk-table-body');
if(DATA.risk_table && DATA.risk_table.length > 0) {{
  DATA.risk_table.forEach(r => {{
    rbody.innerHTML += `<tr>
      <td><strong>${{r.id}}</strong></td>
      <td>${{r.plan}}</td>
      <td>${{r.logins}}</td>
      <td><span style="font-size:0.8rem; background:#f0f2f8; padding:3px 8px; border-radius:4px">${{r.sentiment}}</span></td>
      <td>
        <div class="progress" style="height:6px; margin-bottom:4px; width:60px">
          <div class="progress-bar bg-danger" role="progressbar" style="width:${{Math.round(r.prob*100)}}%"></div>
        </div>
        <span style="color:#dc3545; font-weight:700; font-size:.8rem">${{(r.prob*100).toFixed(1)}}%</span>
      </td>
    </tr>`;
  }});
}} else {{
  rbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No prediction data available</td></tr>`;
}}

// ── CONFUSION MATRIX ───────────────────────────────────
if(DATA.cm && DATA.cm.length === 2) {{
  const cm = DATA.cm;
  document.getElementById('cm-00').textContent = cm[0][0].toLocaleString();
  document.getElementById('cm-01').textContent = cm[0][1].toLocaleString();
  document.getElementById('cm-10').textContent = cm[1][0].toLocaleString();
  document.getElementById('cm-11').textContent = cm[1][1].toLocaleString();
  
  // Dynamic background color based on values (simulating heatmap)
  const maxVal = Math.max(cm[0][0], cm[0][1], cm[1][0], cm[1][1]);
  const getBGC = (val, isCorrect) => {{
    const alpha = Math.max(0.1, val/maxVal);
    // Correct predictions: shades of blue. Incorrect: shades of red/orange
    return isCorrect ? `rgba(1,104,250,${{alpha}})` : `rgba(220,53,69,${{alpha}})`;
  }};
  
  document.getElementById('cm-00').style.backgroundColor = getBGC(cm[0][0], true);
  document.getElementById('cm-11').style.backgroundColor = getBGC(cm[1][1], true);
  document.getElementById('cm-01').style.backgroundColor = getBGC(cm[0][1], false);
  document.getElementById('cm-10').style.backgroundColor = getBGC(cm[1][0], false);
}}

// ── ROC CURVE ──────────────────────────────────────────
if(DATA.roc_data && DATA.roc_data.length > 0) {{
  document.getElementById('lbl-auc').textContent = DATA.auc_score.toFixed(4);
  new Chart(document.getElementById('rocChart'), {{
    type: 'scatter',
    data: {{
      datasets: [
        {{
          label: 'ROC Curve',
          data: DATA.roc_data,
          showLine: true,
          borderColor: '#0168fa',
          backgroundColor: 'rgba(1,104,250,0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }},
        {{
          label: 'Random Model',
          data: [{{x:0,y:0}}, {{x:1,y:1}}],
          showLine: true,
          borderColor: '#e3e7ed',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }}
      ]
    }},
    options: {{
      responsive: true, maintainAspectRatio: false, legend: {{display: false}},
      scales: {{
        xAxes: [{{
          type: 'linear', position: 'bottom',
          scaleLabel: {{display: true, labelString: 'False Positive Rate'}},
          ticks: {{min: 0, max: 1, fontColor:'#97a3b9'}}
        }}],
        yAxes: [{{
          scaleLabel: {{display: true, labelString: 'True Positive Rate'}},
          ticks: {{min: 0, max: 1, fontColor:'#97a3b9'}}
        }}]
      }}
    }}
  }});
}}

// ── BUSINESS REPORT ────────────────────────────────────
if(DATA.report) {{
  // Format currency
  const rev = new Intl.NumberFormat('en-US', {{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}).format(DATA.report.revenue_at_risk);
  document.getElementById('lbl-rev-risk').textContent = rev;
  document.getElementById('lbl-top-fb').textContent = DATA.report.top_feedback;
  document.getElementById('lbl-top-fb-pct').textContent = DATA.report.top_feedback_pct.toFixed(1) + '%';
}}

// ── SPARK MINI CHARTS ──────────────────────────────────
function sparkLine(id, color) {{
  const rand = () => Array.from({{length:8}},()=>Math.floor(Math.random()*50+20));
  new Chart(document.getElementById(id), {{
    type:'line',
    data:{{labels:rand(),datasets:[{{data:rand(),borderColor:color,borderWidth:2,
      fill:true,backgroundColor:color+'20',pointRadius:0}}]}},
    options:{{responsive:true,maintainAspectRatio:false,legend:{{display:false}},
      scales:{{xAxes:[{{display:false}}],yAxes:[{{display:false}}]}}}}
  }});
}}
sparkLine('sparkTotal','#0168fa');
sparkLine('sparkChurn','#dc3545');
sparkLine('sparkSafe','#10b759');
sparkLine('sparkRate','#560bd0');

// Activate tabs
$('.az-dashboard-nav .nav-link').on('click', function(e) {{
  e.preventDefault();
  $(this).closest('.nav').find('.nav-link').removeClass('active');
  $(this).addClass('active');
}});
</script>
</body>
</html>"""
    return html
