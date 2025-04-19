// src/services/suiService.ts (Part 1)
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
// Transaction will be needed later
import { Transaction } from '@mysten/sui/transactions';
import type { SuiObjectChange, SuiObjectChangePublished, SuiObjectChangeCreated, EventId } from '@mysten/sui/client';
import execa from 'execa';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config'; // Load configuration

// Interface matching the expected output of `sui move build --json`
interface SuiMoveBuildOutput {
    modules: string[]; // Array of base64 encoded module bytes
    dependencies: string[]; // Array of dependency package IDs (Object IDs)
    digest: string; // Build digest - may not be present in all versions
}

export interface PublishResult {
    packageId: string;
    createdObjects: Array<{ objectType: string; objectId: string }>; // List of created objects
    digest: string;
}

export class SuiService {
    private client: SuiClient;
    private keypair: Ed25519Keypair | null = null;
    private deployerAddress: string | null = null;
    private eventCursor: EventId | null = null; // Cursor for polling

    constructor() {
        const rpcUrl = config.sui.rpcUrl || getFullnodeUrl('devnet'); // Ensure devnet default if needed
        this.client = new SuiClient({ url: rpcUrl });
        console.log(`SuiService initialized with RPC URL: ${rpcUrl}`);
        this.initializeSigner();
    }

    private initializeSigner(): void {
        const privateKeyHex = config.sui.deployerPrivateKey;
        if (privateKeyHex && privateKeyHex !== 'YOUR_PRIVATE_KEY_HEX_HERE') {
            try {
                // Remove '0x' prefix if present
                const keyHex = privateKeyHex.startsWith('0x') ? privateKeyHex.substring(2) : privateKeyHex;
                const raw = Buffer.from(keyHex, 'hex');

                if (raw.length !== 32) {
                    throw new Error(`Invalid private key length. Expected 32 bytes (64 hex characters), got ${raw.length}.`);
                }
                this.keypair = Ed25519Keypair.fromSecretKey(raw);
                this.deployerAddress = this.keypair.getPublicKey().toSuiAddress();
                console.log(`Signer initialized for address: ${this.deployerAddress}`);
            } catch (error: any) {
                console.error("Error initializing signer from private key:", error.message);
                console.error("Please ensure DEPLOYER_PRIVATE_KEY in .env is a valid Ed25519 secret key (32 bytes hex string, optionally starting with 0x).");
                this.keypair = null; // Ensure keypair is null if init fails
            }
        } else {
            console.warn("Deployer private key not found or is placeholder in .env. Transactions requiring signing will fail.");
        }
    }

    // --- Method to poll for TokenCreationEvent ---
    async pollTokenCreationEvents(): Promise<void> {
        const factoryPackageId = config.sui.factoryPackageId;
        const factoryModule = 'factory'; // Your module name
        const eventStructName = 'TokenCreationEvent'; // Your event struct name

        if (!factoryPackageId || factoryPackageId === 'YOUR_FACTORY_PACKAGE_ID_HERE') {
            // Log only once or less frequently if needed
            // console.warn("FACTORY_PACKAGE_ID not set in .env. Cannot poll for events.");
            return;
        }

        const eventType = `${factoryPackageId}::${factoryModule}::${eventStructName}`;

        try {
            // console.log(`Polling for events after cursor: ${JSON.stringify(this.eventCursor)}`); // Debug log
            const result = await this.client.queryEvents({
                query: {
                     // Filter by the specific event type more efficiently
                     MoveEventType: eventType
                },
                cursor: this.eventCursor, // Start from the last known event
                limit: 50, // Adjust limit as needed
                order: 'ascending' // Process events in the order they occurred
            });

            if (result.data && result.data.length > 0) {
                console.log(`Found ${result.data.length} new ${eventStructName} event(s).`);
                result.data.forEach(event => {
                   // Already filtered by MoveEventType, no need to double-check type
                   console.log("\n--- Received TokenCreationEvent (via Polling) ---");
                   console.log(JSON.stringify(event.parsedJson, null, 2));
                   console.log(`  (Event ID: ${event.id.txDigest}/${event.id.eventSeq})`);
                   console.log("---------------------------------------------------\n");
                });

                // Update the cursor to point *past* the last processed event for the next poll
                this.eventCursor = result.nextCursor ?? null; // Use nullish coalescing: if nextCursor is undefined or null, use null.

            } else {
                 // Optional: Log if no events found
                 // console.log(`No new ${eventType} events found.`);
            }

             // If there are more pages, we might need to fetch them immediately
             // or rely on the next interval poll to catch up.
             // For simplicity, this example relies on the next interval.

        } catch (error) {
            console.error(`Error polling events for ${eventType}:`, error);
            // Consider adding retry logic or specific error handling
            // Reset cursor on certain errors? Maybe not, could re-process events.
        }
    }

    getClient(): SuiClient {
        return this.client;
    }

    getSigner(): Ed25519Keypair | null {
        return this.keypair;
    }

    getDeployerAddress(): string | null {
        return this.deployerAddress;
    }

    /**
     * Builds the Move package located at the specified path.
     * Uses the `sui move build --dump-bytecode-as-base64 --json` command.
     */
    async buildMovePackage(packagePath: string): Promise<SuiMoveBuildOutput> {
        console.log(`Building Move package at: ${packagePath}`);
        try {
            // Ensure sui CLI is available
            try {
                await execa('sui', ['--version']);
            } catch (err) {
                console.error("Error: 'sui' command not found. Please ensure the Sui CLI is installed and in your PATH.");
                throw new Error("Sui CLI not found.");
            }

            // Execute `sui move build` command with JSON output
            const { stdout, stderr } = await execa('sui', [
                'move',
                'build',
                '--dump-bytecode-as-base64', // Get compiled modules as base64
                '--path', packagePath,
                '--json' // Request JSON output
                // Consider adding --skip-fetch-latest-git-deps if needed
            ], {
                cwd: packagePath, // Run in the package directory
                timeout: 60000, // 60 second timeout for build
            });

            if (stderr) {
                // Log stderr but don't necessarily throw, as it might contain warnings
                console.warn("Build command stderr:", stderr);
            }

            // Basic validation of output structure - Important!
            let buildOutput: SuiMoveBuildOutput;
            try {
                buildOutput = JSON.parse(stdout);
                if (!buildOutput || !Array.isArray(buildOutput.modules) || !Array.isArray(buildOutput.dependencies)) {
                    console.error("Raw build output:", stdout);
                    throw new Error("Invalid structure in 'sui move build --json' output.");
                }
            } catch (parseError) {
                console.error("Error parsing build output JSON:", parseError);
                console.error("Raw build output:", stdout);
                throw new Error("Failed to parse 'sui move build --json' output.");
            }


            console.log(`Build successful for package: ${packagePath}`);
            return buildOutput;

        } catch (error: any) {
            // execa errors often have stderr attached
            const errorMsg = error.stderr || error.message || 'Unknown build error';
            console.error(`Error building Move package at ${packagePath}:`, errorMsg);
            throw new Error(`Failed to build Move package: ${errorMsg}`);
        }
    }

    /**
     * Publishes the Move package using the compiled modules and dependencies.
     */
    async publishPackage(packagePath: string): Promise<PublishResult> {
        if (!this.keypair) {
            throw new Error("Deployer keypair not initialized. Cannot publish package.");
        }
        const deployer = this.getDeployerAddress();
        if (!deployer) {
            throw new Error("Deployer address not available. Cannot publish package.");
        }

        console.log(`Publishing package from path: ${packagePath}`);
        try {
            // 1. Build the package
            const buildResult = await this.buildMovePackage(packagePath);

            // 2. Create a new Transaction
            const txb = new Transaction();

            // 3. Add the publish transaction & transfer upgrade cap
            const [upgradeCap] = txb.publish({
                // Revert back to using the base64 strings directly
                modules: buildResult.modules,
                dependencies: buildResult.dependencies,
            });
            txb.transferObjects([upgradeCap], txb.pure.address(deployer));


            // 4. Sign and execute the transaction
            console.log("Signing and executing publish transaction...");
            const result = await this.client.signAndExecuteTransaction({
                transaction: txb,
                signer: this.keypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true, // Need this to find packageId and created objects
                },
                // requestType: 'WaitForLocalExecution' // Optional: Faster but less certain confirmation
            });
            console.log("Publish transaction sent. Digest:", result.digest);

            // 5. Wait for transaction finality and analyze the result
            await this.client.waitForTransaction({
                digest: result.digest,
                options: { showEffects: true, showObjectChanges: true } // Ensure we get needed data
            });
            console.log("Publish transaction finalized.");

            if (result.effects?.status.status !== 'success') {
                throw new Error(`Publish transaction failed: ${result.effects?.status.error || 'Unknown error'}`);
            }

            // Find the published package ID
            const packageId = result.objectChanges?.find(
                (change: SuiObjectChange): change is SuiObjectChangePublished => change.type === 'published'
            )?.packageId;

            if (!packageId) {
                console.error("Full transaction result:", JSON.stringify(result, null, 2));
                throw new Error("Could not find package ID in publish transaction result.");
            }
            console.log("Published Package ID:", packageId);

            // Collect all created objects
            const createdObjects = result.objectChanges
                ?.filter((change: SuiObjectChange): change is SuiObjectChangeCreated => change.type === 'created')
                .map((change: SuiObjectChangeCreated) => ({ objectType: change.objectType, objectId: change.objectId })) ?? [];

            console.log("Created objects:", createdObjects);


            return {
                packageId: packageId,
                createdObjects: createdObjects,
                digest: result.digest,
            };

        } catch (error: any) {
            console.error(`Error publishing package from ${packagePath}:`, error.message || error);
            throw new Error(`Failed to publish package: ${error.message || String(error)}`);
        }
    }

    /**
     * Queries events from the Sui network.
     * @param eventType Fully qualified event type (e.g., 0xPACKAGE::module::EventStruct)
     * @param cursor Optional cursor for pagination
     * @param limit Max number of events per page
     * @returns Promise resolving to the event query result
     */
    async queryEvents(eventType: string, cursor?: EventId | null, limit: number = 50) {
        console.log(`Querying events: ${eventType}, Cursor: ${cursor}, Limit: ${limit}`);
        try {
            const result = await this.client.queryEvents({
                query: { MoveEventType: eventType },
                cursor: cursor ?? undefined, // Pass undefined if cursor is null
                limit: limit,
                order: 'ascending' // Process oldest first
            });
            return result;
        } catch (error) {
            console.error(`Error querying events (${eventType}):`, error);
            throw error;
        }
    }

    /**
     * Transfers the TreasuryCap for a given package to a recipient.
     * Assumes the TreasuryCap is currently owned by the deployer defined in [.env](cci:7://file:///Users/happy/Developer/teackstack/move-program/fungable_token/backendnode/.env:0:0-0:0).
     * Finds the TreasuryCap by querying the deployer's objects.
     * @param packageId The ID of the package containing the coin module.
     * @param moduleName The name of the module defining the coin (e.g., 'my_coin').
     * @param recipient The Sui address to transfer the TreasuryCap to.
     * @returns The digest of the transfer transaction.
     */
    async transferTreasuryCap(packageId: string, moduleName: string, recipient: string): Promise<string> {
        if (!this.keypair || !this.deployerAddress) {
            throw new Error("Deployer keypair not initialized. Cannot transfer TreasuryCap.");
        }
        // Construct the full type for the TreasuryCap, including the generic parameter
        // The generic parameter type is usually PACKAGE_ID::MODULE_NAME::MODULE_NAME (witness type)
        const witnessType = `${packageId}::${moduleName}::${moduleName.toUpperCase()}`;
        const fullTreasuryCapType = `0x2::coin::TreasuryCap<${witnessType}>`;

        console.log(`Searching for TreasuryCap of type: ${fullTreasuryCapType} owned by ${this.deployerAddress}`);

        try {
            // Query objects owned by the deployer, filtering by the exact TreasuryCap struct type
            const { data: objects } = await this.client.getOwnedObjects({
                owner: this.deployerAddress,
                filter: { StructType: fullTreasuryCapType },
                options: { showType: true, showOwner: true, showContent: false } // Content not needed here
            });

            if (!objects || objects.length === 0) {
                console.error(`Could not find TreasuryCap of type ${fullTreasuryCapType} owned by ${this.deployerAddress}. Check if the contract was deployed correctly and the type string is exact.`);
                throw new Error(`No TreasuryCap found for type ${fullTreasuryCapType} owned by ${this.deployerAddress}.`);
            }
            if (objects.length > 1) {
                // This case might indicate a problem or previous failed cleanup.
                console.warn(`Multiple TreasuryCaps found for type ${fullTreasuryCapType} owned by ${this.deployerAddress}. Using the first one: ${objects[0].data?.objectId}. Consider investigating if this is unexpected.`);
            }

            const treasuryCapId = objects[0].data?.objectId;
            if (!treasuryCapId) {
                console.error("Failed to extract objectId from query result:", objects[0]);
                throw new Error(`Could not extract TreasuryCap Object ID from query result for type ${fullTreasuryCapType}.`);
            }

            console.log(`Found TreasuryCap ID: ${treasuryCapId}. Transferring to ${recipient}...`);

            const txb = new Transaction();
            txb.transferObjects(
                [txb.object(treasuryCapId)], // The object to transfer
                txb.pure.address(recipient)        // The recipient address
            );

            const result = await this.client.signAndExecuteTransaction({
                transaction: txb,
                signer: this.keypair,
                options: { showEffects: true }
            });

            // Wait for finality
            await this.client.waitForTransaction({ digest: result.digest });

            if (result.effects?.status.status !== 'success') {
                throw new Error(`TreasuryCap transfer transaction failed: ${result.effects?.status.error || 'Unknown error'}`);
            }

            console.log(`TreasuryCap transfer successful. Digest: ${result.digest}`);
            return result.digest;

        } catch (error: any) {
            console.error(`Error transferring TreasuryCap (${fullTreasuryCapType}):`, error.message || error);
            throw new Error(`Failed to transfer TreasuryCap: ${error.message || String(error)}`);
        }
    }

    // --- Placeholder for other methods (Mint, Burn, Transfer Coin, Query Balance etc.) ---
}

// Export a singleton instance for shared use across the application
export const suiService = new SuiService();
