// Utility to add Sui Testnet to the user's Sui Wallet if not present
export async function ensureTestnetInWallet() {
    if (!window.suiWallet) return false;
    try {
        // Sui Wallet exposes switchNetwork and addNetwork methods
        const networks = await window.suiWallet.getNetworks();
        const hasTestnet = networks.some(n => n.name.toLowerCase().includes('testnet'));
        if (!hasTestnet) {
            // Add Sui Testnet
            await window.suiWallet.addNetwork({
                name: 'Sui Testnet',
                rpcUrl: 'https://fullnode.testnet.sui.io:443',
                faucetUrl: 'https://faucet.testnet.sui.io/gas',
                id: 'testnet',
                websocketUrl: '',
                explorerUrl: 'https://suiexplorer.com/?network=testnet',
            });
        }
        // Switch to Testnet
        await window.suiWallet.switchNetwork('testnet');
        return true;
    } catch (e) {
        console.error('Error ensuring Sui Testnet in wallet:', e);
        return false;
    }
}
