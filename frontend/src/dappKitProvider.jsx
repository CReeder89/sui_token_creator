import "@mysten/dapp-kit/dist/index.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
};

export function DappKitProvider({ children }) {
  return (
    <SuiClientProvider networks={networks} defaultNetwork="devnet">
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}
