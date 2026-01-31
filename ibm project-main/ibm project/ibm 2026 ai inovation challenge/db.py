import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = None

if url and key and "your_supabase" not in url:
    try:
        supabase = create_client(url, key)
        print("Connected to Supabase!")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        supabase = None
else:
    print("Supabase credentials missing or invalid. Using mock DB mode.")

# Mock DB for fallback
mock_db = []

def get_all_issues():
    if supabase:
        try:
             response = supabase.table('issues').select("*").order('created_at', desc=True).execute()
             return response.data
        except Exception as e:
             print(f"Supabase error: {e}")
             return mock_db
    return mock_db

def create_issue_db(issue_data):
    if supabase:
        try:
            # Remap fields to match DB schema if needed, but current plan matches
            # 'time' in frontend is ms timestamp, DB 'created_at' is ISO string. 
            # We can let Supabase handle created_at or convert.
            # Let's clean up user data for DB insert
            db_row = {
                "category": issue_data.get('category'),
                "description": issue_data.get('desc'), # mapped from 'desc'
                "status": issue_data.get('status', 'Pending'),
                "lat": issue_data.get('lat'),
                "lng": issue_data.get('lng'),
                "ward_assigned": issue_data.get('ward_assigned'),
                "image_analysis": issue_data.get('image_analysis')
            }
            response = supabase.table('issues').insert(db_row).execute()
            return response.data[0]
        except Exception as e:
            print(f"Supabase insert error: {e}")
            
    # Fallback
    issue_data['id'] = len(mock_db) + 1
    mock_db.insert(0, issue_data)
    return issue_data
