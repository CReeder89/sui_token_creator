import argparse
import os
import re
import math

def sanitize_name(name):
    """Converts a token name to a valid Move module/identifier format."""
    name = name.lower()
    name = re.sub(r'\s+', '_', name)  # Replace spaces with underscores
    name = re.sub(r'[^a-z0-9_]', '', name) # Remove invalid characters
    name = name.strip('_')
    if not name or not name[0].isalpha():
        name = "token_" + name # Ensure it starts with a letter
    return name

def generate_move_contract(args):
    """Generates the Move contract code."""
    module_name = sanitize_name(args.token_name)
    witness_name = module_name.upper()
    raw_initial_supply = args.initial_supply * (10**args.decimals)

    # Ensure integer representation for large numbers if needed
    raw_initial_supply_str = str(int(raw_initial_supply))

    # Format description and image URL as byte strings
    description_bytes = args.description.encode('utf-8').hex()
    image_url_bytes = args.image_url.encode('utf-8').hex()
    symbol_bytes = args.token_symbol.encode('utf-8').hex()
    name_bytes = args.token_name.encode('utf-8').hex() # Use original name for metadata

    move_code = f"""\
module {module_name}::{module_name} {{
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{{Self, TxContext}};
    use sui::url::{{Self, Url}};

    /// Witness struct for the {args.token_name} coin. Matches the module name in uppercase.
    public struct {witness_name} has drop {{}}

    /// Module initializer called once on module publish.
    fun init(witness: {witness_name}, ctx: &mut TxContext) {{
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            {args.decimals}, // decimals
            b"{args.token_symbol}", // symbol
            b"{args.token_name}", // name
            b"{args.description}", // description
            option::some(url::new_unsafe_from_bytes(b"{args.image_url}")), // icon url
            ctx
        );

        // Freeze the metadata to make it immutable
        transfer::public_freeze_object(metadata);

        // Mint the initial supply to the deployer
        let initial_amount = {raw_initial_supply_str}; // {args.initial_supply} tokens with {args.decimals} decimals
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury, initial_amount, deployer, ctx);

        // Transfer the TreasuryCap to the deployer for future minting
        transfer::public_transfer(treasury, deployer);
    }}

    // --- Optional: Add standard mint/burn functions if needed ---

    // public entry fun mint(
    //     treasury: &mut coin::TreasuryCap<{witness_name}>,
    //     amount: u64,
    //     recipient: address,
    //     ctx: &mut TxContext
    // ) {{
    //     coin::mint_and_transfer(treasury, amount, recipient, ctx);
    // }}

    // public entry fun burn(
    //     treasury: &mut coin::TreasuryCap<{witness_name}>,
    //     coin: coin::Coin<{witness_name}>,
    // ) {{
    //     coin::burn(treasury, coin);
    // }}
}}
"""
    return module_name, move_code

def generate_move_toml(module_name, sui_version="1.22.0"): # Use a recent Sui version
    """Generates the Move.toml content."""
    toml_content = f"""\
[package]
name = "{module_name}"
version = "0.0.1"
# edition = "2024.beta" # Optional: Specify Move edition if needed

[dependencies]
Sui = {{ git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/{sui_version}" }}

[addresses]
{module_name} = "0x0" # Placeholder address
"""
    return toml_content

def main():
    parser = argparse.ArgumentParser(description="Generate a Sui Move fungible token contract.")
    parser.add_argument("--token-name", required=True, help="Name of the token (e.g., 'My Cool Token')")
    parser.add_argument("--token-symbol", required=True, help="Symbol of the token (e.g., 'COOL')")
    parser.add_argument("--decimals", type=int, required=True, help="Number of decimal places for the token (e.g., 9)")
    parser.add_argument("--initial-supply", type=float, required=True, help="Initial supply of the token (e.g., 1000000)")
    parser.add_argument("--description", default="", help="Description of the token")
    parser.add_argument("--image-url", default="", help="URL to the token's image/icon")
    parser.add_argument("--output-dir", default=".", help="Directory to create the new token package in (default: current directory)")
    parser.add_argument("--sui-version", default="1.22.0", help="Sui framework version to use in Move.toml (default: 1.22.0)")


    args = parser.parse_args()

    if not args.image_url:
        print("Warning: No image URL provided. Using an empty string.")
    if not args.description:
        print("Warning: No description provided. Using an empty string.")


    module_name, move_code = generate_move_contract(args)
    toml_content = generate_move_toml(module_name, args.sui_version)

    package_dir = os.path.join(args.output_dir, module_name)
    sources_dir = os.path.join(package_dir, "sources")
    move_file_path = os.path.join(sources_dir, f"{module_name}.move")
    toml_file_path = os.path.join(package_dir, "Move.toml")

    try:
        os.makedirs(sources_dir, exist_ok=True)

        with open(move_file_path, "w") as f:
            f.write(move_code)
        print(f"Successfully generated Move contract: {move_file_path}")

        with open(toml_file_path, "w") as f:
            f.write(toml_content)
        print(f"Successfully generated Move.toml: {toml_file_path}")

        print(f"\nGenerated token package '{module_name}' in '{package_dir}'")
        print("To build the package, navigate to the directory and run:")
        print(f"  cd {package_dir}")
        print(f"  sui move build")

    except Exception as e:
        print(f"Error generating token package: {e}")

if __name__ == "__main__":
    main()