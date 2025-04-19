import os
import shutil
import uuid

def create_move_package(package_root, module_name, move_code):
    """
    Creates a Move package directory structure for Sui:
    - package_root/module_name/Move.toml
    - package_root/module_name/sources/module_name.move
    Returns the path to the package directory.
    """
    package_dir = os.path.join(package_root, module_name)
    sources_dir = os.path.join(package_dir, "sources")
    os.makedirs(sources_dir, exist_ok=True)
    # Write Move.toml
    move_toml = f"""[package]\nname = \"{module_name}\"\nedition = \"2024.beta\"\n\n[dependencies]\nSui = {{ git = \"https://github.com/MystenLabs/sui.git\", subdir = \"crates/sui-framework/packages/sui-framework\", rev = \"framework/testnet\" }}\n\n[addresses]\n{module_name} = \"0x0\"\n"""
    with open(os.path.join(package_dir, "Move.toml"), "w") as f:
        f.write(move_toml)
    # Write .move source
    move_file = os.path.join(sources_dir, f"{module_name}.move")
    with open(move_file, "w") as f:
        f.write(move_code)
    return package_dir


def cleanup_package(package_dir):
    shutil.rmtree(package_dir, ignore_errors=True)
