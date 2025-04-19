import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const FACTORY_PACKAGE_ID =
  "0xb7695b31d40c1c1023fb427bc08a8d62dda2087e387136cb05bc7a7eea0dfcf6";
const FACTORY_MODULE = "factory";
const FACTORY_FUNCTION = "create_token";

export default function TokenForm({ onSnackbar }) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const suiClient = useSuiClient();
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    decimals: 9,
    initialSupply: "",
    metadataUri: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Defensive field validation before transaction
  const validateForm = () => {
    if (!form.name || !form.symbol || !form.decimals || !form.initialSupply) {
      onSnackbar("All fields except metadata URI are required.", "error");
      return false;
    }
    if (
      isNaN(Number(form.decimals)) ||
      Number(form.decimals) < 0 ||
      Number(form.decimals) > 255
    ) {
      onSnackbar("Decimals must be a number between 0 and 255.", "error");
      return false;
    }
    try {
      if (BigInt(form.initialSupply) < 0n) {
        onSnackbar("Initial supply must be a positive integer.", "error");
        return false;
      }
    } catch (e) {
      onSnackbar("Initial supply must be a valid integer.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      onSnackbar("Connect your wallet!", "error");
      return;
    }
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Prepare arguments for create_token using correct types
      const nameBytes = new TextEncoder().encode(form.name);
      const symbolBytes = new TextEncoder().encode(form.symbol);
      const decimalsNum = Number(form.decimals);
      const initialSupplyBig = BigInt(form.initialSupply);
      const metadataBytes = new TextEncoder().encode(form.metadataUri);

      const tx = new Transaction();
      tx.moveCall({
        target: `${FACTORY_PACKAGE_ID}::${FACTORY_MODULE}::${FACTORY_FUNCTION}`,
        arguments: [
          tx.pure("vector<u8>", nameBytes),
          tx.pure("vector<u8>", symbolBytes),
          tx.pure("u8", decimalsNum),
          tx.pure("u64", initialSupplyBig),
          tx.pure("vector<u8>", metadataBytes),
        ],
      });
      // 1. Sign the transaction using the dApp Kit hook
      const signed = await signTransaction({ transaction: tx });
      // 2. Execute the transaction using the SuiClient
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: signed.bytes,
        signature: signed.signature,
        options: { showEffects: true, showEvents: true },
      });
      onSnackbar(
        "Token creation transaction sent! Await backend deployment.",
        "success"
      );
    } catch (err) {
      onSnackbar(`Transaction error: ${err.message}`, "error");
    }
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5">Create a New Token</Typography>
      <TextField
        label="Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      <TextField
        label="Symbol"
        name="symbol"
        value={form.symbol}
        onChange={handleChange}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      <TextField
        label="Decimals"
        name="decimals"
        type="number"
        value={form.decimals}
        onChange={handleChange}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      <TextField
        label="Initial Supply"
        name="initialSupply"
        type="number"
        value={form.initialSupply}
        onChange={handleChange}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      <TextField
        label="Metadata URI"
        name="metadataUri"
        value={form.metadataUri}
        onChange={handleChange}
        fullWidth
        sx={{ my: 1 }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={22} /> : "Create Token"}
      </Button>
    </Box>
  );
}
