import os
import sys
import pandas as pd
import uuid

# Add root to sys.path
ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, ROOT)

from backend.core.database import SessionLocal, engine
from backend.core.models import Base, Customer, User, Campaign
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
    
    # Seed admins
    print("Seeding 3 admins...")
    admin_pwd = get_password_hash("Admin#123")
    admins = [
        User(email="admin@churnsense.com", name="Jonathan Carter", hashed_password=admin_pwd, role="super_admin", status="active"),
        User(email="sarah.jenkins@churnsense.com", name="Sarah Jenkins", hashed_password=admin_pwd, role="company_admin", status="active"),
        User(email="michael.chen@churnsense.com", name="Michael Chen", hashed_password=admin_pwd, role="company_admin", status="active")
    ]
    db.bulk_save_objects(admins)
    
    # Seed users
    print("Seeding 3 users...")
    user_pwd = get_password_hash("User#123")
    users = [
        User(email="user1@churnsense.com", name="Emily Rodriguez", hashed_password=user_pwd, role="user", status="active"),
        User(email="david.kim@churnsense.com", name="David Kim", hashed_password=user_pwd, role="user", status="active"),
        User(email="jessica.taylor@churnsense.com", name="Jessica Taylor", hashed_password=user_pwd, role="user", status="active")
    ]
    db.bulk_save_objects(users)

    # Seed campaigns
    print("Seeding 3 campaigns...")
    campaigns = [
        Campaign(
            name="Win-back Campaign 2026",
            type="custom",
            description="Campaign to win back high-risk customers.",
            subject="We miss you! Here is a special offer just for you",
            content="""<div style="padding: 10px;">
  <h2 style="color: #2563eb; margin-bottom: 15px;">We've Missed You, {{customer_name}}!</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">It's been a while since we last saw you active on your account. We understand that things get busy, but we wanted to reach out and let you know that we've been working hard to improve our platform and add exciting new features that we think you'll love.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">As a valued customer, we are thrilled to offer you an exclusive <strong>20% discount</strong> on your next renewal. Simply use the promo code <strong>COMEBACK20</strong> at checkout.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Don't miss out on this limited-time offer. Click the button below to reactivate your subscription and explore what's new!</p>
  <div style="margin-top: 25px;">
    <a href="#" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Claim My 20% Discount</a>
  </div>
</div>""",
            status="active",
            created_by="admin@churnsense.com"
        ),
        Campaign(
            name="VIP Loyalty Program",
            type="custom",
            description="Reward program for enterprise customers.",
            subject="Exclusive VIP Rewards Inside 🎁",
            content="""<div style="padding: 10px;">
  <h2 style="color: #059669; margin-bottom: 15px;">Welcome to the VIP Club!</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hi {{customer_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Your continuous support and loyalty mean the world to us. Because you are one of our most valued clients, we want to formally invite you to our <strong>VIP Loyalty Program</strong>.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">This program is strictly by invitation and grants you access to a dedicated account manager, priority 24/7 support, and early access to all beta features before they are released to the public.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">We've already upgraded your account status. To start enjoying your new perks, simply log into your dashboard and explore the VIP section.</p>
  <div style="margin-top: 25px;">
    <a href="#" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access My VIP Dashboard</a>
  </div>
</div>""",
            status="draft",
            created_by="admin@churnsense.com"
        ),
        Campaign(
            name="Product Feedback Survey",
            type="custom",
            description="Gathering feedback from active users.",
            subject="Help us shape the future of our product",
            content="""<div style="padding: 10px;">
  <h2 style="color: #d97706; margin-bottom: 15px;">Help Us Shape the Future!</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hello {{customer_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">We noticed that you've been actively using our platform recently, and we'd love to hear your thoughts. Our team is constantly striving to build the best possible product, and your feedback is crucial to our success.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Could you spare 2 minutes to answer a few quick questions about your experience? Your insights will directly influence our upcoming product roadmap and feature updates.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">As a token of our appreciation, completing the survey will automatically enter you into a draw to win a <strong>$100 Amazon Gift Card</strong>!</p>
  <div style="margin-top: 25px;">
    <a href="#" style="display: inline-block; background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Take the 2-Minute Survey</a>
  </div>
</div>""",
            status="completed",
            created_by="sarah.jenkins@churnsense.com"
        )
    ]
    db.bulk_save_objects(campaigns)

    db.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
