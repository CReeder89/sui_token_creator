import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Link,
} from "@mui/material";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function CoinMerge({ onSnackbar }) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [coinList, setCoinList] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [logs, setLogs] = useState("");

  // Fetch coin balances for the connected wallet
  const getAllBalances = async () => {
    if (!account) return;
    setIsLoading(true);
    setCoinList([]);
    setSelectedCoin("");
    setLogs("");

    try {
      const coins = await suiClient.getAllBalances({
        owner: account.address,
      });

      const updatedList = [];
      for (const coin of coins) {
        const metadata = await suiClient.getCoinMetadata({
          coinType: coin.coinType,
        });
        if (metadata) {
          const humanBalance =
            parseFloat(coin.totalBalance) / Math.pow(10, metadata.decimals);
          updatedList.push({
            coinType: coin.coinType,
            symbol: metadata.symbol,
            name: metadata.name,
            humanBalance,
            coinObjectCount: coin.coinObjectCount,
          });
        }
      }
      setCoinList(updatedList);
    } catch (e) {
      console.error("Error fetching balances:", e);
      onSnackbar && onSnackbar("Failed to fetch balances", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle merge of coins
  const handleMergeClick = async () => {
    if (!account) return;
    if (!selectedCoin) return;

    setIsMerging(true);
    setLogs("Collecting coin objects...");

    try {
      const coinObjectIds = [];
      let cursor = null;

      // Fetch coin objects
      do {
        const response = await suiClient.getCoins({
          owner: account.address,
          coinType: selectedCoin,
          cursor,
          limit: 100,
        });

        coinObjectIds.push(...response.data.map((c) => c.coinObjectId));

        cursor = response.hasNextPage ? response.nextCursor : null;
        if (coinObjectIds.length >= 500) cursor = null;
      } while (cursor);

      setLogs("Coin objects collected.");

      // Check minimum objects to merge
      if (
        (selectedCoin !== "0x2::sui::SUI" && coinObjectIds.length < 2) ||
        (selectedCoin === "0x2::sui::SUI" && coinObjectIds.length < 3)
      ) {
        setLogs("Not enough objects to merge");
        setIsMerging(false);
        return;
      }

      if (selectedCoin === "0x2::sui::SUI") coinObjectIds.shift();

      const tx = new Transaction();

      const first = coinObjectIds.shift();
      const remaining = coinObjectIds.map((id) => tx.object(id));

      
      tx.mergeCoins(tx.object(first), remaining);

      setLogs(`Merging ${coinObjectIds.length + 1} coins, please confirm wallet...`);

      const signed = await signTransaction({ transaction: tx });
      await suiClient.executeTransactionBlock({
        transactionBlock: signed.bytes,
        signature: signed.signature,
        options: { showEffects: true, showEvents: true },
      });

      setLogs("Merge transaction submitted!");
      getAllBalances();
    } catch (e) {
      console.error("Merge failed:", e);
      setLogs("Merge failed: " + e.message);
      onSnackbar && onSnackbar("Merge failed", "error");
    } finally {
      setIsMerging(false);
    }
  };

  useEffect(() => {
    if (account) getAllBalances();
  }, [account]);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <a
          href={
            account
              ? `https://suiscan.xyz/testnet/account/${account.address}`
              : "https://suiscan.xyz/"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/Color.png"
            alt="Sui Explorer"
            style={{ height: 50 }}
          />
        </a>
      </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        $SUI Merge Coins
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Merge your fragmented SUI and other coins into fewer objects. This helps
        with transfers, swaps, and saves on storage costs.
      </Typography>

      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardHeader title="Wallet & Coins" />
        <CardContent>
          

          {!account ? (
            <Typography color="error">Please connect wallet first</Typography>
          ) : isLoading ? (
            <CircularProgress />
          ) : (
            <Typography>Select a coin to merge:</Typography>
          )}

          <Select
            fullWidth
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">Select a coin</MenuItem>
            {coinList.map((coin) => (
              <MenuItem key={coin.coinType} value={coin.coinType}>
                {`${coin.symbol} (${coin.name}): ${coin.humanBalance} (${coin.coinObjectCount} objects)`}
              </MenuItem>
            ))}
          </Select>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={getAllBalances}
              disabled={isMerging || isLoading}
            >
              Reload
            </Button>
            {selectedCoin && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleMergeClick}
                disabled={isMerging || isLoading}
              >
                {isMerging ? "Merging..." : "Merge"}
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {logs && (
            <Typography
              variant="body2"
              color={logs.includes("digest: ") ? "success.main" : "text.primary"}
            >
              {logs.includes("digest: ") ? (
                <Link
                  href={`https://suiexplorer.com/txblock/${logs.split("digest: ")[1]}`}
                  target="_blank"
                  underline="hover"
                >
                  {logs + " (Click to view)"}
                </Link>
              ) : (
                logs
              )}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
