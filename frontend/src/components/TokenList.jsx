import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  Card,
  Button,
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

export default function TokenList({ onSnackbar }) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const suiClient = useSuiClient();
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
    fetch(`${BACKEND_URL}/api/user_tokens?address=${account.address}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        console.log(res);
        return res.json();
      })
      .then((data) => {
        setTokens(data.tokens || []);
        console.log(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        onSnackbar &&
          onSnackbar("Error fetching tokens: " + err.message, "error");
      });
  }, [account]);

  // Fetch user's Coin<THOKO> objects for the selected token
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

  // Mint handler
  const handleMint = async () => {
    if (!selectedToken || !mintAmount || !mintRecipient) return;
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
        options: { showEffects: true, showEvents: true },
      });
      setMintOpen(false);
      onSnackbar && onSnackbar("Mint transaction submitted!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Mint failed: " + e.message, "error");
    }
  };

  // Burn handler
  const handleBurn = async () => {
    if (!selectedToken || !burnCoinId) return;
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
        options: { showEffects: true, showEvents: true },
      });
      // Call backend to delete token record
      await fetch(`${BACKEND_URL}/delete_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: selectedToken.package_id }),
      });
      setBurnOpen(false);
      onSnackbar &&
        onSnackbar("Burn transaction submitted and token deleted!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Burn failed: " + e.message, "error");
    }
  };

  // Transfer handler
  const handleTransfer = async () => {
    if (!selectedToken || !transferCoinId || !transferRecipient) return;
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
        options: { showEffects: true, showEvents: true },
      });
      // Call backend to update token owner
      await fetch(`${BACKEND_URL}/update_token_owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: selectedToken.package_id,
          new_owner: transferRecipient,
        }),
      });
      setTransferOpen(false);
      onSnackbar &&
        onSnackbar("Transfer transaction submitted and owner updated!", "success");
    } catch (e) {
      onSnackbar && onSnackbar("Transfer failed: " + e.message, "error");
    }
  };

  // Dialog openers
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

  if (!account)
    return <Typography>Connect your wallet to view your tokens.</Typography>;
  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5">Your Deployed Tokens</Typography>
      {loading && <Typography>Loading...</Typography>}
      {tokens.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{ my: 2 }}>
          No tokens deployed yet.
        </Typography>
      )}
      <List>
        {tokens.map((token) => (
          <Card key={token.package_id} sx={{ my: 2, p: 2 }}>
            <Typography variant="body1">
              <b>Name:</b> {token.name}
            </Typography>
            <Typography variant="body1">
              <b>Symbol:</b> {token.symbol}
            </Typography>
            <Typography variant="body1">
              <b>Decimals:</b> {token.decimals}
            </Typography>
            <Typography variant="body1">
              <b>Description:</b> {token.description}
            </Typography>
            <Typography variant="body1">
              <b>Initial Supply:</b> {token.initial_supply}
            </Typography>
            <Typography variant="body1">
              <b>Metadata URI:</b> {token.metadata_uri}
            </Typography>
            <Typography variant="body1">
              <b>Package ID:</b>{" "}
              <span style={{ wordBreak: "break-all" }}>{token.package_id}</span>
            </Typography>
            <Typography variant="body1">
              <b>Treasury Cap ID:</b>{" "}
              <span style={{ wordBreak: "break-all" }}>
                {token.treasury_cap_id && token.treasury_cap_id !== "0xnan"
                  ? token.treasury_cap_id
                  : token.treasuryCapId && token.treasuryCapId !== "0xnan"
                  ? token.treasuryCapId
                  : "N/A"}
              </span>
            </Typography>
            <Button
              size="small"
              href={`https://suiexplorer.com/object/${token.package_id}?network=testnet`}
              target="_blank"
              sx={{ mt: 1 }}
            >
              View on Explorer
            </Button>
            {/* Mint, Burn, Transfer buttons */}
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => openMintDialog(token)}
              >
                Mint
              </Button>
              <Button
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => openBurnDialog(token)}
              >
                Burn
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => openTransferDialog(token)}
              >
                Transfer
              </Button>
            </Box>
          </Card>
        ))}
      </List>

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
