import pandas as pd
import random
import uuid
import os

print("Loading raw churn data...")
df = pd.read_csv("data/raw/churn_data.csv")

first_names_m = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Budi", "Agus", "Eko", "Andi", "Hendra"]
first_names_f = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Siti", "Dewi", "Ayu", "Putri", "Lina"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Saputra", "Wijaya", "Kusuma", "Setiawan", "Lestari"]
companies = ["Acme Corp", "Globex", "Soylent", "Initech", "Umbrella", "Massive Dynamic", "Stark Ind", "Wayne Ent", "Cyberdyne", "Oscorp"]
domains = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "churnsense.com"]
prefixes = ["0811", "0812", "0813", "0821", "0822", "0852", "0853", "0857", "0858", "0896", "0895", "0878", "0877"]

names = []
emails = []
phones = []

generated_emails = set()
generated_phones = set()

for idx, row in df.iterrows():
    gender = str(row.get("gender", "?")).strip().upper()
    
    # 1. Generate Name
    if gender == "F":
        fn = random.choice(first_names_f)
        ln = random.choice(last_names)
    elif gender == "M":
        fn = random.choice(first_names_m)
        ln = random.choice(last_names)
    else:
        fn = random.choice(companies)
        ln = ""
        
    num = random.randint(10, 9999)
    if ln:
        name = f"{fn} {ln} {num}"
        email_base = f"{fn.lower()}.{ln.lower()}.{num}"
    else:
        name = f"{fn} {num}"
        email_base = f"{fn.lower().replace(' ', '')}{num}"
        
    names.append(name)
    
    # 2. Generate Unique Email
    while True:
        domain = random.choice(domains)
        email = f"{email_base}@{domain}"
        if email not in generated_emails:
            generated_emails.add(email)
            emails.append(email)
            break

    # 3. Generate Unique Phone Number
    while True:
        prefix = random.choice(prefixes)
        suffix_length = random.randint(6, 9)
        suffix = "".join([str(random.randint(0, 9)) for _ in range(suffix_length)])
        phone = f"{prefix}{suffix}"
        if phone not in generated_phones:
            generated_phones.add(phone)
            phones.append(phone)
            break

df['name'] = names
df['email'] = emails
df['phone_number'] = phones

output_path = "data/raw/churn_data_with_emails.csv"
df.to_csv(output_path, index=False)
print(f"Successfully augmented {len(df)} rows and saved to {output_path}")
