import React, { useState, useEffect } from 'react';
import {
    useSignAndExecuteTransaction,
    useSuiClientContext,
    useCurrentAccount,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// The admin wallet address for access control
const ADMIN_ADDRESS = '0xcaf14df9da34a51e9370b877d44ad6e31f14c0596990cbe85ce579546930f2d4';

// Environment variables from your .env file
const ENV_VARS = {
    testnet: {
        FEE_STORE: import.meta.env.VITE_FEE_STORE_OBJECT_ID,
        PACKAGE_ID: import.meta.env.VITE_FACTORY_PACKAGE_ID,
        ADMIN_CAP: import.meta.env.VITE_FEE_ADMIN_CAP,
    },
    mainnet: {
        FEE_STORE: import.meta.env.VITE_FEE_STORE_OBJECT_ID_MAINNET,
        PACKAGE_ID: import.meta.env.VITE_FACTORY_PACKAGE_ID_MAINNET,
        ADMIN_CAP: import.meta.env.VITE_FEE_ADMIN_CAP_MAINNET,
    },
};

export default function AdminDashboard() {
    const account = useCurrentAccount();
    const { network } = useSuiClientContext();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [newFee, setNewFee] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('');

    // State to hold the dynamic object IDs
    const [ids, setIds] = useState(null);

    // Dynamically load the correct IDs based on the network
    useEffect(() => {
        if (network && ENV_VARS[network]) {
            setIds(ENV_VARS[network]);
        } else {
            setIds(null); // Clear IDs for unsupported networks
        }
    }, [network]);

    // Check if the current user is the admin
    const isAdmin = account && account.address === ADMIN_ADDRESS;

    // Render a "permission denied" message if the user is not the admin
    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1 style={{ color: 'red' }}>Access Denied</h1>
                <p>You must be the admin to view this page.</p>
                <p>Your address: {account ? account.address : 'Not connected'}</p>
                <p>Admin address: {ADMIN_ADDRESS}</p>
            </div>
        );
    }

    // Handle the form submission to update the fee
    const handleUpdateFee = async () => {
        if (!newFee || !ids) {
            setStatus('Please enter a new fee and connect to a supported network.');
            return;
        }

        setIsSubmitting(true);
        setStatus('Submitting transaction...');

        try {
            const tx = new Transaction();
            const feeInMIST = Number(newFee) * 1_000_000_000;
            const feeInMISTBig = BigInt(feeInMIST);

            //   "u64", initialSupplyBig

            tx.moveCall({
                target: `${ids.PACKAGE_ID}::factory::update_fee`,
                arguments: [
                    tx.object(ids.ADMIN_CAP),
                    tx.object(ids.FEE_STORE),
                    tx.pure("u64", feeInMISTBig),
                ],
            });

            signAndExecuteTransaction(
                {
                    transaction: tx,
                    options: { showEffects: true },
                },
                {
                    onSuccess: (result) => {
                        console.log('executed transaction', result);
                        setStatus('Transaction successful! Fee updated.');
                        setIsSubmitting(false);
                    },
                    onError: (error) => {
                        console.error('failed to execute transaction', error);
                        setStatus(`Transaction failed: ${error.message || error}`);
                        setIsSubmitting(false);
                    },

                },
            );


        }
        catch (error) {
            console.error('Error preparing transaction:', error);
            setStatus(`Error: ${error.message || error}`);
            setIsSubmitting(false);
        }
    }

        return (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
                <h1>Admin Dashboard</h1>
                <p>
                    <strong style={{ color: 'green' }}>Access Granted</strong> - You are logged in as the admin.
                </p>
                <p>Current Network: <strong>{network || 'Unknown'}</strong></p>

                {ids ? (
                    <>
                        <p>Factory Package ID: {ids.PACKAGE_ID}</p>
                        <p>Fee Store Object ID: {ids.FEE_STORE}</p>
                        <p>Admin Cap ID: {ids.ADMIN_CAP}</p>
                        <hr style={{ margin: '20px 0' }} />
                        <div>
                            <h2>Update Token Creation Fee</h2>
                            <p>
                                Enter the new fee in SUI. Current fee is in MIST (1 SUI = 1,000,000,000 MIST).
                            </p>
                            <input
                                type="number"
                                value={newFee}
                                onChange={(e) => setNewFee(e.target.value)}
                                placeholder="Enter new fee in SUI"
                                style={{ padding: '10px', fontSize: '16px', width: '200px' }}
                            />
                            <button
                                onClick={handleUpdateFee}
                                disabled={isSubmitting || !newFee}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    marginLeft: '10px',
                                    cursor: 'pointer',
                                }}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Fee'}
                            </button>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <p style={{ color: status.includes('Failed') ? 'red' : 'green' }}>
                                {status}
                            </p>
                        </div>
                    </>
                ) : (
                    <p>Loading configuration or unsupported network.</p>
                )}
            </div>
        );
    }