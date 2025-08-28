// import "@mysten/dapp-kit/dist/index.css";
// import { SuiClientProvider, WalletProvider, createNetworkConfig, useCurrentAccount } from "@mysten/dapp-kit";
// import { getFullnodeUrl } from "@mysten/sui/client";

// const networks = {
//   testnet: { url: getFullnodeUrl("testnet") },
//   mainnet: { url: getFullnodeUrl("mainnet") },
// };

//   // const account2 = useCurrentAccount();
//   // console.log('Current account:', account2.chains);

// export function DappKitProvider({ children }) {
//   return (
//     <SuiClientProvider networks={networks} defaultNetwork="testnet">
//       <WalletProvider autoConnect>{children}</WalletProvider>
//     </SuiClientProvider>
//   );
// }

import "@mysten/dapp-kit/dist/index.css";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { useState } from 'react';

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	testnet: { url: getFullnodeUrl('testnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
});

export function DappKitProvider({ children }) {
	const [activeNetwork, setActiveNetwork] = useState('testnet');

	return (
		<SuiClientProvider
			networks={networkConfig}
			network={activeNetwork}
			onNetworkChange={(network) => {
				setActiveNetwork(network);
			}}
		>
			<WalletProvider autoConnect>{children}</WalletProvider>
		</SuiClientProvider>
	);
}