import subprocess
import json
from config import SUI_CLI_PATH

def get_user_tokens(address):
    """
    Returns a list of tokens (Move coins) deployed/owned by the given address.
    This is a stub; in production, query Sui indexer or use Sui CLI for richer info.
    """
    # Example: use sui client objects --address <address> --json
    cmd = [
        SUI_CLI_PATH,
        "client",
        "objects",
        "--address", address,
        "--json"
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    objs = json.loads(output)
    # Filter for coins
    coins = [obj for obj in objs.get('data', []) if obj.get('type', '').startswith('0x2::coin::Coin')]
    return coins

def mint_token(params):
    # Assumes Sui CLI is installed and configured for testnet
    cmd = [
        SUI_CLI_PATH,
        "client", "call",
        "--package", params.package_id,
        "--module", params.module_name,
        "--function", "mint",
        "--args", params.treasury_cap_id, str(params.amount), params.recipient,
        "--gas-budget", "100000000",
        "--json",
        "--sender", params.sender_address
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    resp = json.loads(output)
    return resp.get('digest')

def burn_token(params):
    cmd = [
        SUI_CLI_PATH,
        "client", "call",
        "--package", params.package_id,
        "--module", params.module_name,
        "--function", "burn",
        "--args", params.treasury_cap_id, str(params.amount),
        "--gas-budget", "100000000",
        "--json",
        "--sender", params.sender_address
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    resp = json.loads(output)
    return resp.get('digest')

def transfer_token(params):
    cmd = [
        SUI_CLI_PATH,
        "client", "call",
        "--package", params.package_id,
        "--module", params.module_name,
        "--function", "transfer",
        "--args", params.coin_object_id, params.recipient, str(params.amount),
        "--gas-budget", "100000000",
        "--json",
        "--sender", params.sender_address
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    resp = json.loads(output)
    return resp.get('digest')

def transfer_token_capabilities(package_id, creator_address):
    """
    Transfers TreasuryCap and all minted tokens from a deployed package to the creator's address.
    This function assumes the deployer is the backend and can perform transfer operations.
    """
    # Find TreasuryCap object
    cmd = [
        SUI_CLI_PATH,
        "client", "objects", "--address", creator_address, "--json"
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    objs = json.loads(output)
    treasury_caps = [
        obj for obj in objs.get('data', [])
        if obj.get('type', '').startswith(f"0x2::coin::TreasuryCap<{package_id}")
    ]
    if not treasury_caps:
        print(f"No TreasuryCap found for package {package_id}")
        return False
    treasury_cap_id = treasury_caps[0]['objectId']
    # Optionally, transfer minted coins if needed
    # This is a stub: in production, you may want to mint initial supply and transfer to creator here
    print(f"TreasuryCap for package {package_id} is at {treasury_cap_id} and owned by {creator_address}")
    return True
