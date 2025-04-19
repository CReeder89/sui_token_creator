import subprocess
import os
import uuid
from scripts.move_package_utils import create_move_package, cleanup_package

def deploy_move_contract(move_code, module_name, deployer_address, private_key):
    """
    1. Create a Move package (Move.toml + sources/) for the contract.
    2. Build the package.
    3. Publish the package to Sui.
    4. Clean up temp files.
    Returns (tx_hash, package_id)
    """
    package_root = "/tmp/sui_move_packages"
    os.makedirs(package_root, exist_ok=True)
    package_dir = create_move_package(package_root, module_name, move_code)
    key_file = f"/tmp/sui_key_{deployer_address}.json"
    with open(key_file, 'w') as f:
        f.write(private_key)
    try:
        # Build the Move package
        build_cmd = [
            "sui", "move", "build", "--path", package_dir
        ]
        subprocess.run(build_cmd, check=True)
        # Publish the package
        publish_cmd = [
            "sui", "client", "publish", "--gas-budget", "100000000", "--json", "--key-file", key_file, "--path", package_dir
        ]
        result = subprocess.run(publish_cmd, capture_output=True, check=True)
        output = result.stdout.decode()
        import json
        resp = json.loads(output)
        tx_hash = resp.get('digest')
        package_id = resp.get('packageId')
        return tx_hash, package_id
    finally:
        os.remove(key_file)
        cleanup_package(package_dir)

def generate_token_contract(name, symbol, decimals, initial_supply, metadata_uri):
    """
    Generate a Move contract for a custom Sui token with the given parameters.
    Returns the path to the contract directory.
    """
    # Fill in the Move template with user parameters
    module_name = symbol.upper()
    move_code = f"""
module {module_name}::token {{
    use sui::coin;
    use sui::tx_context::sender;
    use sui::transfer;

    public struct {symbol} has store, copy, drop {{}}

    public fun mint(
        treasury_cap: &mut coin::TreasuryCap<{symbol}>,
        amount: u64,
        recipient: address,
        ctx: &mut sui::tx_context::TxContext
    ) {{
        let coin = coin::mint<{symbol}>(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }}

    public fun burn(
        treasury_cap: &mut coin::TreasuryCap<{symbol}>,
        amount: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {{
        let coin = coin::mint<{symbol}>(treasury_cap, amount, ctx);
        coin::burn(treasury_cap, coin);
    }}

    public fun transfer(
        mut coin: coin::Coin<{symbol}>,
        recipient: address,
        amount: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {{
        let send = coin::split(&mut coin, amount, ctx);
        transfer::public_transfer(send, recipient);
        if (coin::value(&coin) > 0) {{
            transfer::public_transfer(coin, sender(ctx));
        }} else {{
            coin::destroy_zero(coin);
        }}
    }}
}}
"""
    # Create the Move package directory
    package_root = "/tmp/sui_move_packages"
    os.makedirs(package_root, exist_ok=True)
    package_dir = create_move_package(package_root, module_name, move_code)
    return package_dir

def deploy_token_contract(contract_dir, creator_address):
    """
    Deploy the generated Move contract to Sui and return package_id.
    """
    try:
        # Build the Move package
        build_cmd = ["sui", "move", "build", "--path", contract_dir]
        build_result = subprocess.run(build_cmd, capture_output=True, text=True)
        print(f"[DeployContract] Build stdout:\n{build_result.stdout}")
        print(f"[DeployContract] Build stderr:\n{build_result.stderr}")
        if build_result.returncode != 0:
            return {'success': False, 'error': f"Build failed: {build_result.stderr}"}
        # Publish the package
        publish_cmd = [
            "sui", "client", "publish", contract_dir, "--gas-budget", "100000000", "--json"
        ]
        publish_result = subprocess.run(publish_cmd, capture_output=True, text=True)
        print(f"[DeployContract] Publish stdout:\n{publish_result.stdout}")
        print(f"[DeployContract] Publish stderr:\n{publish_result.stderr}")
        if publish_result.returncode != 0:
            return {'success': False, 'error': f"Publish failed: {publish_result.stderr}"}
        output = publish_result.stdout
        import json
        resp = json.loads(output)
        package_id = None
        for obj in resp.get('objectChanges', []):
            if obj.get('type') == 'published':
                package_id = obj.get('packageId')
                break
        return {'success': True, 'package_id': package_id}
    except Exception as e:
        print(f"[DeployContract] Exception: {e}")
        return {'success': False, 'error': str(e)}
    finally:
        cleanup_package(contract_dir)
