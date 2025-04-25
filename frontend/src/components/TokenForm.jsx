import React, { useState } from "react";
import { Box, Typography, TextField, Button, Card } from "@mui/material";
import { Transaction } from "@mysten/sui/transactions";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const FACTORY_PACKAGE_ID =
  "0xc17a461ed86747587def7cd511e42f63fa147fa73d085ebb936162ab6465529a";
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
    description: "",
  });
  const [deploying, setDeploying] = useState(false);
  const [deployedToken, setDeployedToken] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Defensive field validation before transaction
  const validateForm = () => {
    if (
      !form.name ||
      !form.symbol ||
      !form.decimals ||
      !form.initialSupply ||
      !form.description
    ) {
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
    setDeploying(true);
    if (!account) {
      onSnackbar("Connect your wallet!", "error");
      setDeploying(false);
      return;
    }
    if (!validateForm()) {
      setDeploying(false);
      return;
    }
    try {
      // Prepare arguments for create_token using correct types
      const nameBytes = new TextEncoder().encode(form.name);
      const symbolBytes = new TextEncoder().encode(form.symbol);
      const decimalsNum = Number(form.decimals);
      // Multiply initial supply by 10 ** decimals before sending to contract
      const initialSupplyBig =
        BigInt(form.initialSupply) * 10n ** BigInt(decimalsNum);
      const metadataBytes = new TextEncoder().encode(form.metadataUri);
      const descriptionBytes = new TextEncoder().encode(form.description);

      // Log what will be sent to the TokenFactory contract
      console.log("[TokenForm] Calling TokenFactory contract with:", {
        name: form.name,
        symbol: form.symbol,
        decimals: decimalsNum,
        initialSupply: initialSupplyBig.toString(),
        metadataUri: form.metadataUri,
        description: form.description,
        encodedArgs: {
          nameBytes,
          symbolBytes,
          decimalsNum,
          initialSupplyBig: initialSupplyBig.toString(),
          metadataBytes,
          descriptionBytes,
        },
      });

      const tx = new Transaction();
      tx.moveCall({
        target: `${FACTORY_PACKAGE_ID}::${FACTORY_MODULE}::${FACTORY_FUNCTION}`,
        arguments: [
          tx.pure("vector<u8>", nameBytes),
          tx.pure("vector<u8>", symbolBytes),
          tx.pure("u8", decimalsNum),
          tx.pure("u64", initialSupplyBig),
          tx.pure("vector<u8>", metadataBytes),
          tx.pure("vector<u8>", descriptionBytes),
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
      onSnackbar("Deploying your token contract...", "info");
      pollForDeployedToken();
    } catch (err) {
      onSnackbar(`Transaction error: ${err.message}`, "error");
      setDeploying(false);
    }
  };

  function pollForDeployedToken() {
    const MAX_ATTEMPTS = 20; // e.g., 20 attempts x 3s = 60 seconds
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/user_tokens?address=${account.address}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        console.log("[TokenForm] Polling for deployed token:", data);
        const found = data.tokens.find(
          (t) =>
            t.name === form.name &&
            t.symbol === form.symbol &&
            (t.packageId || t.package_id) // Only accept if packageId is present
        );
        if (found) {
          setDeploying(false);
          setDeployedToken(found);
          console.log("[TokenForm] Deployed token info for green card:", found);
          onSnackbar("Token contract deployed!", "success");
          clearInterval(interval);
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setDeploying(false);
          onSnackbar(
            "Token deployment failed or took too long. Please try again or contact support.",
            "error"
          );
          clearInterval(interval);
        }
      } catch (err) {
        setDeploying(false);
        onSnackbar("Error fetching deployed token info.", "error");
        clearInterval(interval);
      }
    }, 3000);
  }

  return (
    <Box>
      <Typography variant="h5">Create a New Token</Typography>
      <form onSubmit={handleSubmit}>
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
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          required
          sx={{ my: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={deploying}
          sx={{ mt: 2 }}
        >
          {deploying ? "Deploying..." : "Create Token"}
        </Button>
      </form>
      {deployedToken && (
        <Box mt={3}>
          <Typography variant="subtitle1" color="success.main">
            Token Contract Deployed!
          </Typography>
          <Card sx={{ mt: 2, p: 2, background: "#f6fff6" }}>
            <Typography variant="body1">
              <b>Name:</b> {deployedToken.name}
            </Typography>
            <Typography variant="body1">
              <b>Symbol:</b> {deployedToken.symbol}
            </Typography>
            <Typography variant="body1">
              <b>Decimals:</b> {deployedToken.decimals}
            </Typography>
            <Typography variant="body1">
              <b>Initial Supply:</b> {deployedToken.initial_supply || deployedToken.initialSupply}
            </Typography>
            <Typography variant="body1">
              <b>Metadata URI:</b> {deployedToken.metadata_uri || deployedToken.metadataUri}
            </Typography>
            <Typography variant="body1">
              <b>Description:</b> {deployedToken.description}
            </Typography>
            <Typography variant="body1">
              <b>Package ID:</b>{" "}
              <span style={{ wordBreak: "break-all" }}>
                {deployedToken.package_id || deployedToken.packageId}
              </span>
            </Typography>
            <Button
              size="small"
              href={`https://suiexplorer.com/object/${deployedToken.package_id || deployedToken.packageId}?network=testnet`}
              target="_blank"
              sx={{ mt: 1 }}
            >
              View on Explorer
            </Button>
          </Card>
        </Box>
      )}
    </Box>
  );
}
