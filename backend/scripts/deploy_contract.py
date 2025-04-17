import subprocess
import os

def deploy_move_contract(contract_path, deployer_address, private_key):
    """
    Deploys a Move contract to the Sui chain using the Sui CLI.
    Returns (tx_hash, package_id)
    """
    # Assumes sui CLI is installed and configured
    # Save private key to a temp file for use by CLI (for demo only; use secure storage in prod)
    key_file = f"/tmp/sui_key_{deployer_address}.json"
    with open(key_file, 'w') as f:
        f.write(private_key)
    # Compile contract
    build_dir = os.path.dirname(contract_path)
    build_cmd = [
        "sui",
        "move",
        "build",
        "--path", build_dir
    ]
    subprocess.run(build_cmd, check=True)
    # Publish contract
    publish_cmd = [
        "sui",
        "client",
        "publish",
        "--gas-budget", "100000000",
        "--json",
        "--key-file", key_file,
        "--path", build_dir
    ]
    result = subprocess.run(publish_cmd, capture_output=True, check=True)
    output = result.stdout.decode()
    # Parse tx_hash and package_id from output (assumes JSON)
    import json
    resp = json.loads(output)
    tx_hash = resp.get('digest')
    package_id = resp.get('packageId')
    os.remove(key_file)
    return tx_hash, package_id
