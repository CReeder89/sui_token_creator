// Utility to add Sui Devnet to the user's Sui Wallet if not present
export async function ensureDevnetInWallet() {
    if (!window.suiWallet) return false;
    try {
        // Sui Wallet exposes switchNetwork and addNetwork methods
        const networks = await window.suiWallet.getNetworks();
        const hasDevnet = networks.some(n => n.name.toLowerCase().includes('devnet'));
        if (!hasDevnet) {
            // Add Sui Devnet
            await window.suiWallet.addNetwork({
                name: 'Sui Devnet',
                rpcUrl: 'https://fullnode.devnet.sui.io:443',
                faucetUrl: 'https://faucet.devnet.sui.io/gas',
                id: 'devnet',
                websocketUrl: '',
                explorerUrl: 'https://suiexplorer.com/?network=devnet',
            });
        }
        // Switch to Devnet
        await window.suiWallet.switchNetwork('devnet');
        return true;
    } catch (e) {
        console.error('Error ensuring Sui Devnet in wallet:', e);
        return false;
    }
}
