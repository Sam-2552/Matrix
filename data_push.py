import os
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

# Get path to service account key from env variable
key_path = os.getenv('FIREBASE_PYTHON_KEY_PATH')

if not key_path:
    raise Exception("FIREBASE_KEY_PATH environment variable not set!")

# Initialize Firebase
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load Excel
excel_file = "C:\\Users\\Harshini_S\\Documents\\Matrix-Data-push\\PCI Agency and URLs.xlsx"  # Replace with your file name
df = pd.read_excel(excel_file)

# Forward fill Agency Name
df['Agency Name'] = df['Agency Name'].ffill()

# Remove rows without URLs
df = df.dropna(subset=['Urls'])

# Track created agencies to avoid duplicates
agency_id_map = {}

# Insert Agencies
for agency in df['Agency Name'].unique():
    agency_doc = db.collection('agencies').document()  # auto-id
    agency_doc.set({
        'name': agency
    })
    agency_id_map[agency] = agency_doc.id
    print(f"✅ Added agency: {agency} (ID: {agency_doc.id})")

# Insert URLs
for _, row in df.iterrows():
    agency_name = row['Agency Name']
    url_link = row['Urls']
    agency_id = agency_id_map[agency_name]

    url_doc = db.collection('urls').document()  # auto-id
    url_doc.set({
        'agencyId': agency_id,
        'link': url_link
    })
    print(f"🌐 Added URL: {url_link} (Agency: {agency_name})")

print("🎉 Upload complete!")