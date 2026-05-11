import re, pathlib

APP = pathlib.Path(__file__).parent / "streamlit_app.py"
src = APP.read_text(encoding="utf-8", errors="replace")

NEW_CSS = r"""/* ══ HIDE NATIVE STREAMLIT SIDEBAR ═════════════════════════════════════════ */
section[data-testid="stSidebar"],
button[data-testid="stSidebarCollapseButton"],
[data-testid="stSidebarCollapseButton"] {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    overflow: hidden !important;
}

/* ══ MODERN CUSTOM SIDEBAR ════════════════════════════════════════ */
:root {
    --sb-width: 270px;
    --sb-collapsed: 80px;
    --sb-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Push Streamlit's main content to the right */
div[data-testid="stMain"], .main {
    padding-left: var(--sb-width) !important;
    transition: padding-left var(--sb-transition) !important;
}
.stApp.sb-collapsed div[data-testid="stMain"],
.stApp.sb-collapsed .main {
    padding-left: var(--sb-collapsed) !important;
}

#cs-sidebar {
    position: fixed;
    top: 0; left: 0;
    width: var(--sb-width);
    height: 100vh;
    background: #ffffff;
    border-right: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    transition: width var(--sb-transition);
    z-index: 999999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 2px 0 10px rgba(0,0,0,0.02);
}
#cs-sidebar.collapsed {
    width: var(--sb-collapsed);
}

/* Header */
.cs-header {
    display: flex;
    align-items: center;
    padding: 24px 20px;
    position: relative;
    box-sizing: border-box;
    height: 88px;
}
.cs-logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity var(--sb-transition);
}
.cs-logo {
    width: 38px;
    height: 38px;
    background: #2563eb;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
    flex-shrink: 0;
}
.cs-logo-text {
    display: flex;
    flex-direction: column;
}
.cs-logo-title {
    font-weight: 600;
    font-size: 15px;
    color: #0f172a;
    line-height: 1.2;
}
.cs-logo-subtitle {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
}

.cs-toggle-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s;
}
.cs-toggle-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
}
.cs-toggle-icon {
    width: 18px;
    height: 18px;
    transition: transform var(--sb-transition);
}

#cs-sidebar.collapsed .cs-logo-text {
    opacity: 0;
    width: 0;
    display: none;
}
#cs-sidebar.collapsed .cs-header {
    padding: 24px 0;
    justify-content: center;
}
#cs-sidebar.collapsed .cs-logo-container {
    gap: 0;
}
#cs-sidebar.collapsed .cs-toggle-btn {
    right: 50%;
    transform: translateX(50%);
    background: transparent;
}
#cs-sidebar.collapsed .cs-toggle-icon {
    transform: rotate(180deg);
}

/* Search */
.cs-search {
    padding: 12px 20px 24px;
    transition: padding var(--sb-transition), opacity var(--sb-transition), height var(--sb-transition);
    overflow: hidden;
    border-bottom: 1px solid #f1f5f9;
}
.cs-search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.cs-search-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    width: 16px;
    height: 16px;
}
.cs-search-input {
    width: 100%;
    padding: 10px 10px 10px 36px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #334155;
    outline: none;
    transition: border-color 0.2s;
    background: #ffffff;
    box-sizing: border-box;
    font-family: inherit;
}
.cs-search-input:focus {
    border-color: #2563eb;
    background: white;
}
.cs-search-input::placeholder {
    color: #94a3b8;
}

#cs-sidebar.collapsed .cs-search {
    opacity: 0;
    padding: 0;
    height: 0;
    border-bottom: none;
}

/* Nav */
.cs-nav {
    flex: 1;
    padding: 16px 12px;
    overflow-y: auto;
    overflow-x: hidden;
}
.cs-nav::-webkit-scrollbar { width: 3px; }
.cs-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }

.cs-nav-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    margin-bottom: 4px;
    border-radius: 8px;
    color: #475569;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    font-size: 14px;
    position: relative;
    font-family: inherit;
}
.cs-nav-item:hover {
    background: #f8fafc;
    color: #0f172a;
}
.cs-nav-item.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 600;
}
.cs-nav-icon {
    width: 18px;
    height: 18px;
    margin-right: 14px;
    flex-shrink: 0;
}
.cs-nav-text {
    flex: 1;
    white-space: nowrap;
    opacity: 1;
    transition: opacity var(--sb-transition);
}

.cs-nav-badge {
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    margin-left: 8px;
}
.cs-nav-item.active .cs-nav-badge {
    background: #dbeafe;
    color: #1d4ed8;
}

#cs-sidebar.collapsed .cs-nav-item {
    justify-content: center;
    padding: 12px 0;
}
#cs-sidebar.collapsed .cs-nav-icon {
    margin-right: 0;
}
#cs-sidebar.collapsed .cs-nav-text,
#cs-sidebar.collapsed .cs-nav-badge {
    opacity: 0;
    width: 0;
    display: none;
}

/* Tooltip for collapsed nav */
.cs-tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: #0f172a;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    margin-left: 10px;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 100;
}
.cs-tooltip::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: transparent #0f172a transparent transparent;
}
#cs-sidebar.collapsed .cs-nav-item:hover .cs-tooltip {
    opacity: 1;
    visibility: visible;
}

/* Bottom Sections */
.cs-bottom {
    margin-top: auto;
}
.cs-profile {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    transition: padding var(--sb-transition);
    background: #ffffff;
    cursor: default;
}
.cs-profile:hover {
    background: #f8fafc;
}
.cs-avatar {
    width: 36px;
    height: 36px;
    background: #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0f172a;
    font-weight: 600;
    font-size: 13px;
    flex-shrink: 0;
    position: relative;
}
.cs-avatar-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background: #22c55e;
    border: 2px solid white;
    border-radius: 50%;
    display: none;
}
.cs-profile-info {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--sb-transition);
}
.cs-profile-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
}
.cs-profile-role {
    font-size: 11px;
    color: #64748b;
}
.cs-profile-status {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    flex-shrink: 0;
}

#cs-sidebar.collapsed .cs-profile {
    padding: 16px 0;
    justify-content: center;
    background: #ffffff;
}
#cs-sidebar.collapsed .cs-profile-info {
    opacity: 0;
    width: 0;
    display: none;
}
#cs-sidebar.collapsed .cs-profile-status {
    display: none;
}
#cs-sidebar.collapsed .cs-avatar-dot {
    display: block;
}

/* Logout */
.cs-logout {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    color: #ef4444;
    cursor: pointer;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    font-size: 14px;
    transition: background 0.2s;
    font-weight: 500;
    font-family: inherit;
}
.cs-logout:hover {
    background: #fef2f2;
}
.cs-logout-icon {
    width: 18px;
    height: 18px;
    margin-right: 14px;
    flex-shrink: 0;
}
.cs-logout-text {
    flex: 1;
    white-space: nowrap;
    transition: opacity var(--sb-transition);
}
#cs-sidebar.collapsed .cs-logout {
    justify-content: center;
    padding: 16px 0;
}
#cs-sidebar.collapsed .cs-logout-icon {
    margin-right: 0;
}
#cs-sidebar.collapsed .cs-logout-text {
    opacity: 0;
    width: 0;
    display: none;
}
"""

NEW_SIDEBAR_PY = '''# ═══════════════════════════════════════════════════════════════════════════
# MODERN SIDEBAR — Pre-rendered HTML (No external CDN/JS dependency for rendering)
# ═══════════════════════════════════════════════════════════════════════════
import streamlit.components.v1 as components

NAV_PAGES = ["Dashboard", "Analytics", "Customers", "Prediction", "Batch Upload", "Performance"]
ICONS = {
    "Search": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    "Dashboard": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    "Analytics": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    "Customers": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    "Prediction": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
    "Batch Upload": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    "Performance": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
    "Logout": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    "Chevron": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>'
}

_qp = st.query_params.get("page", "Dashboard")
page = _qp if _qp in NAV_PAGES else "Dashboard"

def get_badge(p):
    if p == "Prediction": return "3"
    if p == "Performance": return "12"
    return ""

nav_html = ""
for p in NAV_PAGES:
    active_cls = " active" if page == p else ""
    badge_val = get_badge(p)
    badge_html = f'<span class="cs-nav-badge">{badge_val}</span>' if badge_val else ""
    nav_html += f"""
    <button class="cs-nav-item{active_cls}" data-page="{p}" onclick="window.parent.postMessage({{type: 'navigate', page: '{p}'}}, '*')">
      <div class="cs-nav-icon">{ICONS[p]}</div>
      <span class="cs-nav-text">{p}</span>
      {badge_html}
      <span class="cs-tooltip">{p} {f'({badge_val})' if badge_val else ''}</span>
    </button>
    """

st.markdown(f"""
<aside id="cs-sidebar">
  <div class="cs-header">
    <div class="cs-logo-container">
      <div class="cs-logo">A</div>
      <div class="cs-logo-text">
        <span class="cs-logo-title">Acme Corp</span>
        <span class="cs-logo-subtitle">Enterprise Dashboard</span>
      </div>
    </div>
    <button class="cs-toggle-btn" id="cs-toggle-btn" onclick="window.parent.postMessage({{type: 'toggle_sidebar'}}, '*')">
      <div class="cs-toggle-icon">{ICONS["Chevron"]}</div>
    </button>
  </div>

  <div class="cs-search">
    <div class="cs-search-input-wrapper">
      <div class="cs-search-icon">{ICONS["Search"]}</div>
      <input class="cs-search-input" id="cs-search" type="text" placeholder="Search..." autocomplete="off" oninput="window.parent.postMessage({{type: 'search', val: this.value}}, '*')"/>
    </div>
  </div>

  <nav class="cs-nav">
    <div id="cs-nav-list">
        {nav_html}
    </div>
  </nav>

  <div class="cs-bottom">
    <div class="cs-profile">
      <div class="cs-avatar">
        JD
        <div class="cs-avatar-dot"></div>
      </div>
      <div class="cs-profile-info">
        <div class="cs-profile-name">John Doe</div>
        <div class="cs-profile-role">Senior Administrator</div>
      </div>
      <div class="cs-profile-status"></div>
    </div>
    <button class="cs-logout" id="cs-logout" onclick="alert('Logout clicked')">
      <div class="cs-logout-icon">{ICONS["Logout"]}</div>
      <span class="cs-logout-text">Logout</span>
    </button>
  </div>
</aside>
""", unsafe_allow_html=True)

components.html("""
<script>
  const parent = window.parent.document;
  
  window.addEventListener('message', function(event) {
     if (!event.data || !event.data.type) return;
     
     if (event.data.type === 'navigate') {
         const url = new URL(window.parent.location.href);
         url.searchParams.set('page', event.data.page);
         window.parent.location.href = url.toString();
     }
     
     if (event.data.type === 'toggle_sidebar') {
         const sidebar = parent.getElementById('cs-sidebar');
         const app = parent.querySelector('.stApp');
         if (sidebar) {
             sidebar.classList.toggle('collapsed');
             if (app) {
                 if (sidebar.classList.contains('collapsed')) {
                     app.classList.add('sb-collapsed');
                 } else {
                     app.classList.remove('sb-collapsed');
                 }
             }
         }
     }
     
     if (event.data.type === 'search') {
         const term = event.data.val.toLowerCase();
         const items = parent.querySelectorAll('.cs-nav-item');
         items.forEach(item => {
             const text = item.querySelector('.cs-nav-text').textContent.toLowerCase();
             if (text.includes(term)) {
                 item.style.display = 'flex';
             } else {
                 item.style.display = 'none';
             }
         });
     }
  });
</script>
""", height=0, width=0)
'''

lines = src.splitlines(keepends=True)

css_start = None
css_end   = None
for i, ln in enumerate(lines):
    if css_start is None and 'SIDEBAR' in ln and 'section[data-testid' not in ln and i < 60:
        css_start = i
    if css_start is not None and css_end is None:
        if 'Radio: hide circles' in ln or 'hide circles completely' in ln:
            css_end = i
            break

if css_start is None or css_end is None:
    print(f"WARN: Could not locate CSS block cleanly. Start: {css_start}, End: {css_end}")
else:
    lines = lines[:css_start] + [NEW_CSS + "\n"] + lines[css_end:]

py_start = None
py_end   = None
for i, ln in enumerate(lines):
    if py_start is None and ln.strip() == 'with st.sidebar:':
        py_start = i
    if py_start is not None and py_end is None and i > py_start + 2:
        if ln.strip() == '# HELPER: Compute predictions on full dataset' or 'HELPER' in ln:
            py_end = i - 4 # To safely replace the block above
            break

if py_start is None or py_end is None:
    print(f"WARN: Could not locate Python block cleanly. Start: {py_start}, End: {py_end}")
else:
    # Just be careful not to delete too much
    lines = lines[:py_start] + [NEW_SIDEBAR_PY + "\n"] + lines[py_end:]

APP.write_text("".join(lines), encoding="utf-8")
print("Successfully patched streamlit_app.py")
