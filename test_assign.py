import requests
API_URL = "https://churn-prediction-jahv.onrender.com/api/v1"
resp = requests.post(f"{API_URL}/auth/login", data={"username": "admin@churnsense.com", "password": "Admin#123"})
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
resp = requests.post(f"{API_URL}/campaigns/1/recipients", json={"customer_ids": ["6080"]}, headers=headers)
print(f"Status: {resp.status_code}")
print(f"Data: {resp.text}")
