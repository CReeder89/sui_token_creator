import { useState, useEffect } from 'react';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';


/**
 * Replace with the actual object ID of your FeeStore.
 * This ID is obtained when the module is published.
 * It should be stored in your application's configuration (e.g., .env file).
 */
const FEE_STORE_OBJECT_ID = '0xd04213315c6944582a5ec6f26b3817ac603e5810543ba8a2d7b2a7da8823df3e'; // ***IMPORTANT: Replace this placeholder***

const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'), // Or 'testnet', 'mainnet'
});

/**
 * A custom React Hook to fetch the current token creation fee from the Sui network.
 * @returns {object} An object containing the fee, loading state, and error message.
 */
export const useSuiFee = () => {
  const [fee, setFee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFee = async () => {
      if (!FEE_STORE_OBJECT_ID || FEE_STORE_OBJECT_ID === '0x...') {
        setError('FeeStore object ID is not configured.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await suiClient.getObject({
          id: FEE_STORE_OBJECT_ID,
          options: { showContent: true },
        });

        if (response.data?.content?.dataType === 'moveObject') {
          const feeStoreData = response.data.content.fields;
          setFee(feeStoreData.fee);
        } else {
          setError('Could not retrieve a valid FeeStore object.');
        }
      } catch (err) {
        console.error('Failed to fetch fee store object:', err);
        setError('Failed to fetch fee data from the network.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, []); // Empty dependency array ensures this runs once on component mount

  return { fee, isLoading, error };
};