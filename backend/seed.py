import os
import sys
import pandas as pd
import uuid

# Add root to sys.path
ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, ROOT)

from backend.core.database import SessionLocal, engine
from backend.core.models import Base, Customer, AdminUser
from backend.core.security import get_password_hash
from backend.api.services.ml_service import run_batch_prediction

def seed_db():
    print("Dropping tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
        
    csv_path = os.path.join(ROOT, "data", "raw", "churn_data_with_emails.csv")
    if not os.path.exists(csv_path):
        print(f"CSV not found at {csv_path}")
        return
        
    print("Loading CSV...")
    df = pd.read_csv(csv_path)
    
    # Process all rows instead of just 1000
    print("Running predictions for seed data...")
    try:
        df_pred = run_batch_prediction(df)
    except Exception as e:
        print(f"Prediction failed: {e}")
        df_pred = df
        df_pred["prediction"] = 0
        df_pred["probability"] = 0.1
        df_pred["label"] = "Not Churn"

    print("Inserting into database...")
    customers_to_add = []
    

    def safe_float(val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    def safe_int(val):
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return None

    for idx, row in df_pred.iterrows():
        prob = row.get("probability", 0.0)
        risk = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
        
        c = Customer(
            id=f"CUST-{uuid.uuid4().hex[:8].upper()}",
            name=row.get("name", "Unknown Customer"),
            email=row.get("email"),
            phone_number=row.get("phone_number"),
            age=safe_int(row.get("age")),
            gender=row.get("gender"),
            region_category=row.get("region_category"),
            days_since_joined=safe_int(row.get("days_since_joined")),
            plan_tier=row.get("plan_tier"),
            status="Active" if row.get("churn", 0) == 0 else "Inactive",
            
            days_since_active=safe_int(row.get("days_since_active")),
            api_calls_90d=safe_int(row.get("api_calls_90d")),
            logins_90d=safe_int(row.get("logins_90d")),
            active_days_90d=safe_int(row.get("active_days_90d")),
            avg_session_duration=safe_float(row.get("avg_session_duration")),
            days_since_last_login=safe_int(row.get("days_since_last_login")),
            avg_frequency_login_days=safe_float(row.get("avg_frequency_login_days")),
            
            avg_transaction_value=safe_float(row.get("avg_transaction_value")),
            points_in_wallet=safe_float(row.get("points_in_wallet")),
            
            tickets_opened_90d=safe_int(row.get("tickets_opened_90d", 0)),
            feedback=row.get("feedback"),
            
            churn_risk=risk,
            churn_probability=prob
        )
        customers_to_add.append(c)
        
    db.bulk_save_objects(customers_to_add)
    
    # Seed default admin
    print("Seeding default admin...")
    hashed_pwd = get_password_hash("Admin#123")
    default_admin = AdminUser(
        email="admin@churnsense.com",
        name="Super Admin",
        hashed_password=hashed_pwd,
        role="Super Admin",
        status="Active"
    )
    db.add(default_admin)
    db.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
