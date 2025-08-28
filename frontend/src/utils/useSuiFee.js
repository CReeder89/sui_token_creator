import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';


/**
 * Replace with the actual object ID of your FeeStore.
 * This ID is obtained when the module is published.
 * It should be stored in your application's configuration (e.g., .env file).
 */
const FEE_STORE_OBJECT_ID = import.meta.env.VITE_FEE_STORE_OBJECT_ID; // ***IMPORTANT: Replace this placeholder***


/**
 * A custom React Hook to fetch the current token creation fee from the Sui network.
 * @returns {object} An object containing the fee, loading state, and error message.
 */
export const useSuiFee = (objectId) => {
  const [fee, setFee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const suiClient = useSuiClient()
  

  useEffect(() => {
    const fetchFee = async () => {
      if (!objectId) {
      
        return;
      }

      try {
        setIsLoading(true);
        const response = await suiClient.getObject({
          id: objectId,
          options: { showContent: true },
        });

        if (response.data?.content?.dataType === 'moveObject') {
          const feeStoreData = response.data.content.fields;
          setFee(feeStoreData.fee);
          setError(null);
        } else {
          setError('Could not retrieve a valid FeeStore object.');
        }
      } catch (err) {
        console.error('Failed to fetch fee store object:', err);
        setError('Failed to fetch fee data from the network. Mainnet not deployed');
        setFee(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, [objectId]); // Empty dependency array ensures this runs once on component mount

  return { fee, isLoading, error };
};