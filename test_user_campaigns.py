import requests

API_URL = "https://churn-prediction-jahv.onrender.com/api/v1"

# 1. Login as user
resp = requests.post(f"{API_URL}/auth/login", data={"username": "user1@churnsense.com", "password": "User#123"})
if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    exit(1)

token = resp.json()["access_token"]
print("Logged in as user.")

# 2. Fetch campaigns
headers = {"Authorization": f"Bearer {token}"}
resp = requests.get(f"{API_URL}/campaigns", headers=headers)
print(f"Campaigns status: {resp.status_code}")
print(f"Campaigns data: {resp.json()}")
