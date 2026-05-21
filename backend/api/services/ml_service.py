import os
import sys

# Add src to path so we can import from the existing ml code
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
sys.path.insert(0, os.path.join(ROOT, "src"))

from predict import load_pipeline, predict_single, predict_batch
import pandas as pd

# Load pipeline at module level so it's ready
try:
    _PIPELINE = load_pipeline()
except Exception as e:
    print(f"Warning: Could not load ML pipeline: {e}")
    _PIPELINE = None

def get_pipeline():
    global _PIPELINE
    if _PIPELINE is None:
        _PIPELINE = load_pipeline()
    return _PIPELINE

def run_single_prediction(customer_dict: dict) -> dict:
    pipeline = get_pipeline()
    result = predict_single(customer_dict, pipeline)
    return result

def run_batch_prediction(df: pd.DataFrame) -> pd.DataFrame:
    pipeline = get_pipeline()
    result_df = predict_batch(df, pipeline)
    return result_df
