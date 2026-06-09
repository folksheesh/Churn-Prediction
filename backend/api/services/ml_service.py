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

import numpy as np

# ... existing code ...
def run_batch_prediction(df: pd.DataFrame) -> pd.DataFrame:
    pipeline = get_pipeline()
    result_df = predict_batch(df, pipeline)
    return result_df

def get_model_insights():
    import json
    import os
    
    # Check if we have a precomputed permutation importance file
    # This aligns the dashboard perfectly with the more accurate Permutation/SHAP importance from the notebook
    perm_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "permutation_importance.json")
    if os.path.exists(perm_file):
        try:
            with open(perm_file, "r") as f:
                fi_list = json.load(f)
            return {"feature_importance": fi_list}
        except Exception as e:
            print(f"Failed to load permutation importance: {e}")

    pipeline = get_pipeline()
    if not pipeline:
        return {"feature_importance": [], "shap_summary": []}
        
    model = pipeline["model"]
    feature_names = pipeline["feature_names"]
    
    # 1. Native XGBoost Feature Importance (Fallback)
    try:
        importances = model.feature_importances_
        # Sort them
        indices = np.argsort(importances)[::-1]
        fi_list = [{"feature": feature_names[i], "importance": float(importances[i])} for i in indices[:10]]
    except Exception as e:
        print(f"Error getting feature importance: {e}")
        fi_list = []

    return {
        "feature_importance": fi_list
    }
