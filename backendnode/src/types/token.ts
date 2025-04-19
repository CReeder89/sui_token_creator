export interface TokenParams {
    name: string; // User-friendly name, e.g., "My Cool Token"
    symbol: string; // e.g., "COOL"
    decimals: number; // e.g., 9
    initialSupply: number; // Base amount, e.g., 1000000
    description: string;
    imageUrl: string;
    outputDir?: string; // Directory to create the package in
    suiVersion?: string; // Sui framework version for Move.toml
}

export interface GeneratedPackageInfo {
    packagePath: string;
    moduleName: string;
    moveFilePath: string;
    tomlFilePath: string;
}
