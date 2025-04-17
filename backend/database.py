import json
import os
from threading import Lock

DB_FILE = os.path.join(os.path.dirname(__file__), 'tokens_db.json')
_db_lock = Lock()

# Ensure the DB file exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump([], f)

def add_token_record(record):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        data.append(record)
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)

def get_tokens_by_deployer(deployer_address):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        return [rec for rec in data if rec.get('deployer_address') == deployer_address]

def get_all_tokens():
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
