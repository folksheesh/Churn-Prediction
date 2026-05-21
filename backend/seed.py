import os
import sys
import pandas as pd
import uuid

# Add root to sys.path
ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, ROOT)

from backend.core.database import SessionLocal, engine
from backend.core.models import Base, Customer
from backend.api.services.ml_service import run_batch_prediction

def seed_db():
    print("Dropping tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
        
    csv_path = os.path.join(ROOT, "data", "processed", "cleaned_churn_data.csv")
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
    
    # Standardize names for the seed data since original CSV lacks names
    import random
    first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    companies = ["Acme Corp", "Globex", "Soylent", "Initech", "Umbrella", "Massive Dynamic", "Stark Ind", "Wayne Ent", "Cyberdyne", "Oscorp"]

    for idx, row in df_pred.iterrows():
        prob = row.get("probability", 0.0)
        risk = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
        
        # Generate a fake name/company
        is_company = random.choice([True, False])
        if is_company:
            name = f"{random.choice(companies)} {random.randint(1, 100)}"
        else:
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
        c = Customer(
            id=f"CUST-{uuid.uuid4().hex[:8].upper()}",
            name=name,
            age=row.get("age"),
            gender=row.get("gender"),
            region_category=row.get("region_category"),
            days_since_joined=row.get("days_since_joined"),
            plan_tier=row.get("plan_tier"),
            status="Active" if row.get("churn", 0) == 0 else "Inactive",
            
            days_since_active=row.get("days_since_active"),
            api_calls_90d=row.get("api_calls_90d"),
            logins_90d=row.get("logins_90d"),
            active_days_90d=row.get("active_days_90d"),
            avg_session_duration=row.get("avg_session_duration"),
            days_since_last_login=row.get("days_since_last_login"),
            avg_frequency_login_days=row.get("avg_frequency_login_days"),
            
            avg_transaction_value=row.get("avg_transaction_value"),
            points_in_wallet=row.get("points_in_wallet"),
            
            tickets_opened_90d=row.get("tickets_opened_90d", 0),
            feedback=row.get("feedback"),
            
            churn_risk=risk,
            churn_probability=prob
        )
        customers_to_add.append(c)
        
    db.bulk_save_objects(customers_to_add)
    db.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
