import "@mysten/dapp-kit/dist/index.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const networks = {
  testnet: { url: getFullnodeUrl("testnet") },
};

export function DappKitProvider({ children }) {
  return (
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}
