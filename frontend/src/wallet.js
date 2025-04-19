// Sui Wallet integration & convenience hooks
import { useEffect, useState } from 'react';
import { ensureTestnetInWallet } from './utils/suiNetwork';

export function useSuiWallet() {
    const [wallet, setWallet] = useState(null);
    const [address, setAddress] = useState(null);
    const [connected, setConnected] = useState(false);
    const [networkReady, setNetworkReady] = useState(false);

    useEffect(() => {
        async function setup() {
            if (window.suiWallet) {
                setWallet(window.suiWallet);
                const ok = await ensureTestnetInWallet();
                setNetworkReady(ok);
                if (ok) {
                    await window.suiWallet.requestPermissions();
                    const accounts = await window.suiWallet.getAccounts();
                    setAddress(accounts[0]);
                    setConnected(true);
                }
            }
        }
        setup();
    }, []);

    const connect = async () => {
        if (window.suiWallet) {
            const ok = await ensureTestnetInWallet();
            setNetworkReady(ok);
            if (ok) {
                await window.suiWallet.requestPermissions();
                const accounts = await window.suiWallet.getAccounts();
                setAddress(accounts[0]);
                setConnected(true);
            }
        }
    };

    const disconnect = () => {
        setAddress(null);
        setConnected(false);
    };

    return { wallet, address, connected, connect, disconnect, networkReady };
}

export function isSuiWalletInstalled() {
    return Boolean(window.suiWallet);
}
