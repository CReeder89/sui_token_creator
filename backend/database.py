import json
import os
from threading import Lock

DB_FILE = os.path.join(os.path.dirname(__file__), 'tokens_db.json')
_db_lock = Lock()

# Ensure the DB file exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump([], f)

def add_token_record(token):
    with _db_lock:
        # Ensure owner is set to creator if not provided
        if 'owner' not in token or not token['owner']:
            token['owner'] = token.get('creator')
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        data.append(token)
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)

def get_tokens_by_deployer(deployer_address):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        # Normalize both addresses for comparison (lowercase, with 0x prefix)
        norm_addr = deployer_address.lower()
        def norm(a):
            a = a.lower()
            if not a.startswith('0x'):
                a = '0x' + a
            return a
        return [rec for rec in data if norm(rec.get('creator', '')) == norm(norm_addr)]

def get_tokens_by_owner(owner_address):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        return [rec for rec in data if rec.get('owner') == owner_address]

def get_all_tokens():
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            return json.load(f)

def delete_token_record(package_id):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        data = [rec for rec in data if rec.get('package_id') != package_id]
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)

def update_token_owner(package_id, new_owner):
    with _db_lock:
        with open(DB_FILE, 'r') as f:
            data = json.load(f)
        for rec in data:
            if rec.get('package_id') == package_id:
                rec['owner'] = new_owner
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)
