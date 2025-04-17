import subprocess
import json

def get_user_tokens(address):
    """
    Returns a list of tokens (Move coins) deployed/owned by the given address.
    This is a stub; in production, query Sui indexer or use Sui CLI for richer info.
    """
    # Example: use sui client objects --address <address> --json
    cmd = [
        "sui",
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
