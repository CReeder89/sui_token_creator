from config import SUI_CLI_PATH
import subprocess
import os
import uuid
from scripts.move_package_utils import create_move_package, cleanup_package

# def deploy_move_contract(move_code, module_name, deployer_address, private_key):
#     """
#     1. Create a Move package (Move.toml + sources/) for the contract.
#     2. Build the package.
#     3. Publish the package to Sui.
#     4. Clean up temp files.
#     Returns (tx_hash, package_id)
#     """
#     package_root = "/tmp/sui_move_packages"
#     os.makedirs(package_root, exist_ok=True)
#     package_dir = create_move_package(package_root, module_name, move_code)
#     key_file = f"/tmp/sui_key_{deployer_address}.json"
#     with open(key_file, 'w') as f:
#         f.write(private_key)
#     try:
#         # Build the Move package
#         build_cmd = [
#             SUI_CLI_PATH, "move", "build", "--path", package_dir
#         ]
#         subprocess.run(build_cmd, check=True)
#         # Publish the package
#         publish_cmd = [
#             SUI_CLI_PATH, "client", "publish", "--gas-budget", "100000000", "--json", "--key-file", key_file, "--path", package_dir
#         ]
#         result = subprocess.run(publish_cmd, capture_output=True, check=True)
#         output = result.stdout.decode()
#         import json
#         resp = json.loads(output)
#         tx_hash = resp.get('digest')
#         package_id = resp.get('packageId')
#         return tx_hash, package_id
#     finally:
#         os.remove(key_file)
#         cleanup_package(package_dir)

def generate_token_contract(name, symbol, decimals, initial_supply, metadata_uri, description, deployer_address, module_name=None):
    """
    Generate a Move contract for a custom Sui token with the given parameters using the static template.
    Returns the path to the contract directory.
    """
    import os
    import re
    # Read the Move template
    template_path = os.path.join(os.path.dirname(__file__), "../templates/fungible_token_template.move")
    with open(template_path, "r") as f:
        template = f.read()

    # Determine module_name (default: sanitized symbol)
    if not module_name:
        # Use token symbol for both module name and witness struct (upper for witness, lower for module)
        token_name = symbol.lower()
        token_name_upper = symbol.upper()
        module_name = token_name
    else:
        token_name = module_name.lower()
        token_name_upper = module_name.upper()

    move_code = (
        template
        .replace("{{token_name}}", token_name)
        .replace("{{token_name_upper}}", token_name_upper)
        .replace("{{name}}", name)
        .replace("{{symbol}}", symbol)
        .replace("{{description}}", description)
        .replace("{{icon_url}}", metadata_uri)
        .replace("{{decimals}}", str(decimals))
        .replace("{{initial_supply}}", str(initial_supply))
        .replace("{{deployer_address}}", deployer_address)
    )

    file_name = "token_contract"
    package_root = "/tmp/sui_move_packages"
    os.makedirs(package_root, exist_ok=True)
    package_dir = create_move_package(package_root, file_name, move_code)
    return package_dir

def deploy_token_contract(contract_dir, creator_address):
    """
    Deploy the generated Move contract to Sui and return package_id.
    """
    try:
        # Build the Move package
        build_cmd = [SUI_CLI_PATH, "move", "build", "--path", contract_dir]
        build_result = subprocess.run(build_cmd, capture_output=True, text=True)
        print(f"[DeployContract] Build stdout:\n{build_result.stdout}")
        print(f"[DeployContract] Build stderr:\n{build_result.stderr}")
        if build_result.returncode != 0:
            return {'success': False, 'error': f"Build failed: {build_result.stderr}"}
        # Publish the package (NO --key-file, NO --path, just package_dir as positional argument)
        publish_cmd = [
            SUI_CLI_PATH, "client", "publish",
            "--gas-budget", "100000000",
            "--json",
            contract_dir
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
        treasury_cap_id = None
        # Find package_id and treasury_cap_id
        for obj in resp.get('objectChanges', []):
            if obj.get('type') == 'published':
                package_id = obj.get('packageId')
            if obj.get('type') == 'created' and obj.get('objectType', '').startswith('0x2::coin::TreasuryCap<'):
                treasury_cap_id = obj.get('objectId')
        return {'success': True, 'package_id': package_id, 'treasury_cap_id': treasury_cap_id}
    except Exception as e:
        print(f"[DeployContract] Exception: {e}")
        return {'success': False, 'error': str(e)}
    finally:
        # cleanup_package(contract_dir)
        pass
