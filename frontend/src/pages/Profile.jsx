import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { BACKEND_URL } from "../config";

export default function Profile({ onSnackbar }) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [mintOpen, setMintOpen] = useState(false);
  const [burnOpen, setBurnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [mintAmount, setMintAmount] = useState("");
  const [mintRecipient, setMintRecipient] = useState("");
  const [burnCoinId, setBurnCoinId] = useState("");
  const [transferCoinId, setTransferCoinId] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [coinObjects, setCoinObjects] = useState([]);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/my_tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: account.address }),
    })
      .then((res) => res.json())
      .then((data) => {
        fetch(`${BACKEND_URL}/my_owned_tokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner_address: account.address }),
        })
          .then((res2) => res2.json())
          .then((data2) => {
            const combined = [...(data.tokens || []), ...(data2.tokens || [])];
            const unique = Object.values(
              combined.reduce((acc, t) => {
                acc[t.package_id] = t;
                return acc;
              }, {})
            );


            const netFileredCoins = unique.filter(t => t.network === account.chains[0].slice(4)); // Remove 'sui:' prefix

            setTokens(netFileredCoins);
          })
          .catch(() => {
            setTokens(data.tokens || []);
          });
      })
      .catch(() => onSnackbar && onSnackbar("Failed to load tokens", "error"))
      .finally(() => setLoading(false));
  }, [account]);

  const fetchCoinObjects = async (token) => {
    if (!account || !token) return;
    try {
      const moduleName = token.symbol.toLowerCase();
      const coinType = `${token.package_id}::${moduleName}::${token.symbol}`;
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType,
      });
      setCoinObjects(coins.data || []);
    } catch (e) {
      setCoinObjects([]);
      onSnackbar && onSnackbar("Failed to fetch coin objects", "error");
    }
  };

  // ---- Handlers ----
  const handleMint = async () => {
    try {
      const moduleName = selectedToken.symbol.toLowerCase();
      const tx = new Transaction();
      tx.moveCall({
        target: `${selectedToken.package_id}::${moduleName}::mint`,
        arguments: [
          tx.object(selectedToken.treasury_cap_id),
          tx.pure("u64", BigInt(mintAmount)),
          tx.pure("address", mintRecipient),
        ],
      });
      const signed = await signTransaction({ transaction: tx });
      await suiClient.executeTransactionBlock({
        transactionBlock: signed.bytes,
        signature: signed.signature,
      });
      setMintOpen(false);
      onSnackbar && onSnackbar("Mint transaction submitted!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Mint failed: " + e.message, "error");
    }
  };

  const handleBurn = async () => {
    try {
      const moduleName = selectedToken.symbol.toLowerCase();
      const tx = new Transaction();
      tx.moveCall({
        target: `${selectedToken.package_id}::${moduleName}::burn`,
        arguments: [
          tx.object(selectedToken.treasury_cap_id),
          tx.object(burnCoinId),
        ],
      });
      const signed = await signTransaction({ transaction: tx });
      await suiClient.executeTransactionBlock({
        transactionBlock: signed.bytes,
        signature: signed.signature,
      });
      setBurnOpen(false);
      onSnackbar && onSnackbar("Burn transaction submitted!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Burn failed: " + e.message, "error");
    }
  };

  const handleTransfer = async () => {
    try {
      const moduleName = selectedToken.symbol.toLowerCase();
      const tx = new Transaction();
      tx.moveCall({
        target: `${selectedToken.package_id}::${moduleName}::transfer`,
        arguments: [
          tx.object(transferCoinId),
          tx.pure("address", transferRecipient),
        ],
      });
      const signed = await signTransaction({ transaction: tx });
      await suiClient.executeTransactionBlock({
        transactionBlock: signed.bytes,
        signature: signed.signature,
      });
      setTransferOpen(false);
      onSnackbar && onSnackbar("Transfer transaction submitted!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Transfer failed: " + e.message, "error");
    }
  };

  // ---- Openers ----
  const openMintDialog = (token) => {
    setSelectedToken(token);
    setMintOpen(true);
    setMintAmount("");
    setMintRecipient("");
  };
  const openBurnDialog = async (token) => {
    setSelectedToken(token);
    setBurnOpen(true);
    setBurnCoinId("");
    await fetchCoinObjects(token);
  };
  const openTransferDialog = async (token) => {
    setSelectedToken(token);
    setTransferOpen(true);
    setTransferCoinId("");
    setTransferRecipient("");
    await fetchCoinObjects(token);
  };

  // ---- UI ----
  if (!account)
    return <Typography>Connect your wallet to view your profile.</Typography>;
  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        My Token Profile
      </Typography>

      {tokens.length === 0 && (
        <Typography color="text.secondary">
          You don’t own or have deployed any tokens yet.
        </Typography>
      )}

      <Grid container spacing={2}>
        {tokens.map((token) => (
          <Grid item xs={12} sm={6} md={4} key={token.package_id}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              {token.metadata_uri && (
                <CardMedia
                  component="img"
                  height="160"
                  image={token.metadata_uri}
                  alt={token.name}
                  onError={(e) =>
                  (e.currentTarget.src =
                    "https://via.placeholder.com/300x160?text=No+Image")
                  }
                />
              )}
              <CardContent>
                <Typography variant="h6">{token.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {token.symbol} — Decimals: {token.decimals}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {token.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  href={`https://suiexplorer.com/object/${token.package_id}?network=testnet`}
                  target="_blank"
                >
                  View
                </Button>
                <Button size="small" onClick={() => openMintDialog(token)}>
                  Mint
                </Button>
                <Button size="small" onClick={() => openBurnDialog(token)}>
                  Burn
                </Button>
                <Button size="small" onClick={() => openTransferDialog(token)}>
                  Transfer
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mint Dialog */}
      <Dialog open={mintOpen} onClose={() => setMintOpen(false)}>
        <DialogTitle>Mint Tokens</DialogTitle>
        <DialogContent>
          <TextField
            label="Amount"
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
          />
          <TextField
            label="Recipient Address"
            value={mintRecipient}
            onChange={(e) => setMintRecipient(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMintOpen(false)}>Cancel</Button>
          <Button onClick={handleMint} variant="contained">
            Mint
          </Button>
        </DialogActions>
      </Dialog>

      {/* Burn Dialog */}
      <Dialog open={burnOpen} onClose={() => setBurnOpen(false)}>
        <DialogTitle>Burn Token</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Select Coin Object"
            value={burnCoinId}
            onChange={(e) => setBurnCoinId(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
          >
            {coinObjects.length === 0 && (
              <MenuItem value="" disabled>
                No Coin Objects
              </MenuItem>
            )}
            {coinObjects.map((obj) => (
              <MenuItem key={obj.coinObjectId} value={obj.coinObjectId}>
                {obj.coinObjectId}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBurnOpen(false)}>Cancel</Button>
          <Button onClick={handleBurn} variant="contained">
            Burn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)}>
        <DialogTitle>Transfer Token</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Select Coin Object"
            value={transferCoinId}
            onChange={(e) => setTransferCoinId(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
          >
            {coinObjects.length === 0 && (
              <MenuItem value="" disabled>
                No Coin Objects
              </MenuItem>
            )}
            {coinObjects.map((obj) => (
              <MenuItem key={obj.coinObjectId} value={obj.coinObjectId}>
                {obj.coinObjectId}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Recipient Address"
            value={transferRecipient}
            onChange={(e) => setTransferRecipient(e.target.value)}
            fullWidth
            sx={{ my: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
