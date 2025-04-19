import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file located at the project root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const config = {
    sui: {
        rpcUrl: process.env.SUI_RPC_URL,
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
        factoryPackageId: process.env.FACTORY_PACKAGE_ID,
    },
    server: {
        port: process.env.PORT || 8080, // Port for the Express API server
    },
    paths: {
        generatedTokens: path.resolve(__dirname, '..', '..', 'generated_tokens'),
    }
};

// Basic validation
if (!config.sui.rpcUrl) {
    console.warn("SUI_RPC_URL environment variable not set. Using default Devnet.");
    config.sui.rpcUrl = 'https://fullnode.devnet.sui.io:443'; // Default fallback
}

if (!config.sui.deployerPrivateKey || config.sui.deployerPrivateKey === 'YOUR_PRIVATE_KEY_HEX_HERE') {
    console.error("Error: DEPLOYER_PRIVATE_KEY environment variable is not set or is still the placeholder.");
    console.error("Please update the .env file in the backendnode directory with your deployer's private key (Ed25519 hex format).");
    // Decide if the application can run without it (e.g., for read-only operations)
    // For deployment, it's essential, so we might exit.
    // process.exit(1); 
}

// Create the default directory for generated tokens if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(config.paths.generatedTokens)) {
    try {
        fs.mkdirSync(config.paths.generatedTokens, { recursive: true });
        console.log(`Created directory for generated tokens: ${config.paths.generatedTokens}`);
    } catch (err) {
        console.error(`Error creating directory ${config.paths.generatedTokens}:`, err);
    }
}
