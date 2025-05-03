import subprocess
import json
from config import SUI_CLI_PATH

def get_transactions_by_object(object_id):
    cmd = [SUI_CLI_PATH, "client", "transactions", "--object", object_id, "--json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(result.stderr)
    return json.loads(result.stdout)

def get_transactions_by_address(address):
    cmd = [SUI_CLI_PATH, "client", "transactions", "--address", address, "--json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(result.stderr)
    return json.loads(result.stdout)

def get_transaction_details(tx_digest):
    cmd = [SUI_CLI_PATH, "client", "transaction", tx_digest, "--json"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(result.stderr)
    return json.loads(result.stdout)
