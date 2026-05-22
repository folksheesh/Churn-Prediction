import pandas as pd
import os

# Define columns and sample row based on user specification
columns = [
    "age", "gender", "security_no", "region_category", "joining_date",
    "joined_through_referral", "referral_id", "preferred_offer_types",
    "medium_of_operation", "internet_option", "last_visit_time",
    "days_since_last_login", "avg_session_duration", "avg_transaction_value",
    "avg_frequency_login_days", "points_in_wallet", "used_special_discount",
    "offer_application_preference", "past_complaint", "complaint_status",
    "feedback", "plan_tier", "logins_90d", "active_days_90d",
    "api_calls_90d", "session_minutes_90d", "days_since_active"
]

sample_row = {
    "age": 25,
    "gender": "M",
    "security_no": "ABCD123",
    "region_category": "City",
    "joining_date": "15-01-2023",
    "joined_through_referral": "Yes",
    "referral_id": "CID12345",
    "preferred_offer_types": "Gift Vouchers/Coupons",
    "medium_of_operation": "Desktop",
    "internet_option": "Wi-Fi",
    "last_visit_time": "12:30:00",
    "days_since_last_login": 5,
    "avg_session_duration": 300.5,
    "avg_transaction_value": 1500.75,
    "avg_frequency_login_days": 12.5,
    "points_in_wallet": 500,
    "used_special_discount": "Yes",
    "offer_application_preference": "Yes",
    "past_complaint": "No",
    "complaint_status": "Not Applicable",
    "feedback": "Good Customer Service",
    "plan_tier": "Premium",
    "logins_90d": 40,
    "active_days_90d": 35,
    "api_calls_90d": 5000,
    "session_minutes_90d": 950.5,
    "days_since_active": 2,
}

df = pd.DataFrame([sample_row], columns=columns)

output_path = os.path.join("frontend", "public", "template_churn.xlsx")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
    df.to_excel(writer, index=False, sheet_name="Customer Data")

    # Auto-adjust column widths
    worksheet = writer.sheets["Customer Data"]
    for col_idx, col in enumerate(df.columns, 1):
        max_len = max(len(str(col)), len(str(df.iloc[0, col_idx - 1]))) + 2
        worksheet.column_dimensions[worksheet.cell(row=1, column=col_idx).column_letter].width = max_len

print(f"Template created at: {output_path}")
