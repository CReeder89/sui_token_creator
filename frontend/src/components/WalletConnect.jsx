import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletConnect() {
  const account = useCurrentAccount();
  return (
    <div>
      <ConnectButton />
      {/* {account && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontWeight: 600 }}>Connected:</span> {account.address}
        </div>
      )} */}
    </div>
  );
}
