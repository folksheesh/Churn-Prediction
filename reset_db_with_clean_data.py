import os
import sys
import uuid
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import warnings
warnings.filterwarnings('ignore')

from backend.core.database import SQLALCHEMY_DATABASE_URL
from backend.core.models import Customer, Base
from backend.api.services.ml_service import run_batch_prediction

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_db():
    print("Clearing customers table...")
    db = SessionLocal()
    db.query(Customer).delete()
    db.commit()
    
    print("Loading cleaned_churn_data.csv...")
    df = pd.read_csv("data/processed/cleaned_churn_data.csv")
    
    print("Running ML predictions (this might take a minute for 37k rows)...")
    try:
        result_df = run_batch_prediction(df)
    except Exception as e:
        print("ML Prediction failed, inserting raw data. Error:", e)
        result_df = df.copy()
        result_df['probability'] = 0.5
    
    print("Preparing data for DB insert...")
    result_df['id'] = [f"CUST-{str(uuid.uuid4())[:8].upper()}" for _ in range(len(result_df))]
    result_df['name'] = [f"Customer {i}" for i in result_df['id']]
    
    if 'probability' in result_df.columns:
        result_df['churn_probability'] = result_df['probability']
        result_df['churn_risk'] = result_df['probability'].apply(lambda x: "High" if x > 0.7 else "Medium" if x > 0.4 else "Low")
    
    result_df['status'] = "Active"
    
    valid_keys = {c.name for c in Customer.__table__.columns}
    
    records = []
    for _, row in result_df.iterrows():
        row_dict = row.dropna().to_dict()
        filtered = {k: v for k, v in row_dict.items() if k in valid_keys}
        records.append(Customer(**filtered))
        
    print(f"Inserting {len(records)} records into DB...")
    chunk_size = 5000
    for i in range(0, len(records), chunk_size):
        db.add_all(records[i:i+chunk_size])
        db.commit()
        print(f"Inserted {i+len(records[i:i+chunk_size])}/{len(records)}")
        
    db.close()
    print("Done!")

if __name__ == "__main__":
    reset_db()
