from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import predictions, analytics, customers, auth
from backend.api.routers import mitigation
from backend.core.database import engine
from backend.core import models

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

# Create database tables (including new ones: mitigation_logs, upload_attempts)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChurnSense API", version="1.0.0")

@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend())
    
    # Ensure new columns exist on existing tables (SQLite migration)
    _migrate_database()
    
    # Keep-alive self-ping to prevent Render free tier cold starts
    import asyncio, os, httpx
    
    async def _keep_alive():
        """Ping our own /health endpoint every 10 minutes to stay warm."""
        render_url = os.getenv("RENDER_EXTERNAL_URL")
        if not render_url:
            return  # Only run on Render (not local dev)
        health_url = f"{render_url}/health"
        async with httpx.AsyncClient() as client:
            while True:
                await asyncio.sleep(600)  # 10 minutes
                try:
                    await client.get(health_url, timeout=10)
                    print("[KEEP-ALIVE] Pinged /health OK")
                except Exception as e:
                    print(f"[KEEP-ALIVE] Ping failed: {e}")
    
    asyncio.create_task(_keep_alive())

def _migrate_database():
    """Add new columns to existing tables if they don't exist (SQLite compatible)."""
    import sqlite3
    import os
    from backend.core.database import DB_PATH
    
    db_url = os.getenv("DATABASE_URL")
    if db_url and not db_url.startswith("sqlite"):
        return # Postgres will use create_all() to build the schema properly

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get existing columns for admin_users
    cursor.execute("PRAGMA table_info(admin_users)")
    admin_columns = {row[1] for row in cursor.fetchall()}
    
    if "role" not in admin_columns:
        cursor.execute("ALTER TABLE admin_users ADD COLUMN role VARCHAR DEFAULT 'Admin'")
    if "status" not in admin_columns:
        cursor.execute("ALTER TABLE admin_users ADD COLUMN status VARCHAR DEFAULT 'Active'")
    if "last_login" not in admin_columns:
        cursor.execute("ALTER TABLE admin_users ADD COLUMN last_login DATETIME")
    if "phone" not in admin_columns:
        cursor.execute("ALTER TABLE admin_users ADD COLUMN phone VARCHAR")
    if "department" not in admin_columns:
        cursor.execute("ALTER TABLE admin_users ADD COLUMN department VARCHAR")
    
    # Get existing columns for activity_logs
    cursor.execute("PRAGMA table_info(activity_logs)")
    log_columns = {row[1] for row in cursor.fetchall()}
    
    if "result" not in log_columns:
        cursor.execute("ALTER TABLE activity_logs ADD COLUMN result VARCHAR")
    if "email_status" not in log_columns:
        cursor.execute("ALTER TABLE activity_logs ADD COLUMN email_status VARCHAR")
    
    # Get existing columns for customers
    cursor.execute("PRAGMA table_info(customers)")
    cust_columns = {row[1] for row in cursor.fetchall()}
    
    if "mitigation_status" not in cust_columns:
        cursor.execute("ALTER TABLE customers ADD COLUMN mitigation_status VARCHAR")
    if "assigned_to" not in cust_columns:
        cursor.execute("ALTER TABLE customers ADD COLUMN assigned_to VARCHAR")
    if "retention_campaign" not in cust_columns:
        cursor.execute("ALTER TABLE customers ADD COLUMN retention_campaign VARCHAR")
    if "campaign_assigned_date" not in cust_columns:
        cursor.execute("ALTER TABLE customers ADD COLUMN campaign_assigned_date DATETIME")
    if "created_at" not in cust_columns:
        cursor.execute("ALTER TABLE customers ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
    
    # Set default role for existing admin (Super Admin for the seed account)
    cursor.execute("UPDATE admin_users SET role = 'Super Admin' WHERE email = 'admin@churnsense.com' AND (role IS NULL OR role = 'Admin')")
    
    conn.commit()
    conn.close()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev and production flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(mitigation.router, prefix="/api/v1/mitigation", tags=["Mitigation"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}
