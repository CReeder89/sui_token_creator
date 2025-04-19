import * as fs from 'fs/promises';
import * as path from 'path';
import { TokenParams, GeneratedPackageInfo } from '../types/token';

/**
 * Converts a token name to a valid Move module/identifier format.
 * Matches the logic in the original Python script.
 */
export function sanitizeName(name: string): string {
    let sanitized = name.toLowerCase();
    sanitized = sanitized.replace(/\s+/g, '_'); // Replace spaces with underscores
    sanitized = sanitized.replace(/[^a-z0-9_]/g, ''); // Remove invalid characters
    sanitized = sanitized.replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores

    // Ensure it starts with a letter
    if (!sanitized || !/^[a-zA-Z]/.test(sanitized)) {
        sanitized = "token_" + sanitized;
    }
    // Ensure it's not empty after sanitization
    if (!sanitized) {
      sanitized = `token_${Date.now().toString().slice(-4)}`; // Add some random chars if empty
    }
    return sanitized;
}

/**
 * Generates the Move contract code string.
 */
export function generateMoveContractCode(params: TokenParams, moduleName: string): string {
    const witnessName = moduleName.toUpperCase();
    // Calculate raw supply (handling potential floating point issues and large numbers)
    const rawInitialSupply = BigInt(Math.floor(params.initialSupply * (10 ** params.decimals)));

    // Note: Directly embedding user-provided strings like description/name/symbol/URL
    // into the b"" literal can be tricky if they contain non-ASCII or special chars.
    // The Python version did simple embedding which might break.
    // A safer approach in Move might involve passing these as args or using hex encoding,
    // but for direct porting, we'll replicate the simple embedding for now.
    // Consider using Buffer.from(str).toString('hex') if issues arise.

    const moveCode = `\
module ${moduleName}::${moduleName} {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};

    /// Witness struct for the ${params.name} coin. Matches the module name in uppercase.
    public struct ${witnessName} has drop {}

    /// Module initializer called once on module publish.
    fun init(witness: ${witnessName}, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            ${params.decimals}, // decimals
            b"${params.symbol}", // symbol (ASCII only)
            b"${params.name}", // name (ASCII only)
            b"${params.description}", // description (ASCII only)
            option::some(url::new_unsafe_from_bytes(b"${params.imageUrl}")), // icon url (ASCII only)
            ctx
        );

        // Freeze the metadata to make it immutable
        transfer::public_freeze_object(metadata);

        // Mint the initial supply to the deployer
        let initial_amount = ${rawInitialSupply.toString()}; // ${params.initialSupply} tokens with ${params.decimals} decimals
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer(&mut treasury, initial_amount, deployer, ctx);

        // Transfer the TreasuryCap to the deployer for future minting
        transfer::public_transfer(treasury, deployer);
    }

    // --- Optional standard functions (commented out like Python version) ---
    // public entry fun mint(...)
    // public entry fun burn(...)
}
`;
    return moveCode;
}

/**
 * Generates the Move.toml content string.
 */
export function generateMoveTomlContent(moduleName: string, suiVersion: string = "1.22.0"): string {
    const tomlContent = `\
[package]
name = "${moduleName}"
version = "0.0.1"
# edition = "2024.beta" # Optional

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/${suiVersion}" }

[addresses]
${moduleName} = "0x0" # Placeholder address
`;
    return tomlContent;
}

/**
 * Creates the Move package directory structure and files.
 */
export async function createTokenPackage(params: TokenParams): Promise<GeneratedPackageInfo> {
    const moduleName = sanitizeName(params.name);
    const outputDir = params.outputDir || path.join(__dirname, '..', '..', 'generated_tokens'); // Default output dir
    const suiVersion = params.suiVersion || "1.22.0"; // Default Sui version

    const moveCode = generateMoveContractCode(params, moduleName);
    const tomlContent = generateMoveTomlContent(moduleName, suiVersion);

    const packageDir = path.join(outputDir, moduleName);
    const sourcesDir = path.join(packageDir, "sources");
    const moveFilePath = path.join(sourcesDir, `${moduleName}.move`);
    const tomlFilePath = path.join(packageDir, "Move.toml");

    try {
        await fs.mkdir(sourcesDir, { recursive: true });
        await fs.writeFile(moveFilePath, moveCode);
        console.log(`Successfully generated Move contract: ${moveFilePath}`);
        await fs.writeFile(tomlFilePath, tomlContent);
        console.log(`Successfully generated Move.toml: ${tomlFilePath}`);

        console.log(`\nGenerated token package '${moduleName}' in '${packageDir}'`);
        console.log("To build the package locally, navigate to the directory and run:");
        console.log(`  cd ${path.relative(process.cwd(), packageDir)}`); // Show relative path
        console.log(`  sui move build`);

        return {
            packagePath: packageDir,
            moduleName: moduleName,
            moveFilePath: moveFilePath,
            tomlFilePath: tomlFilePath,
        };
    } catch (error) {
        console.error(`Error generating token package: ${error}`);
        throw new Error(`Failed to generate token package: ${error instanceof Error ? error.message : String(error)}`);
    }
}
