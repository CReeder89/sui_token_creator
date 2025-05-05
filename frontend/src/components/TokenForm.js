import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";

const DEFAULT_DECIMALS = 9;

export default function TokenForm({
  onSuccess,
  onSnackbar,
  deployerAddress,
  setDeployerAddress,
}) {
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    decimals: DEFAULT_DECIMALS,
    description: "",
    icon_url: "",
    initial_supply: 1,
    mint: true,
    burn: true,
    transfer: true,
    private_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [successToken, setSuccessToken] = useState(null);

  // Helper: always treat decimals as at least 9
  const getDecimals = () => {
    const d = Number(form.decimals);
    return isNaN(d) || d === 0 ? 9 : d;
  };

  // Helper: display value for initial_supply (user sees base units, backend gets multiplied)
  const [displaySupply, setDisplaySupply] = useState(1);

  // Update decimals if empty or zero
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "decimals") {
      let d = value === "" ? 9 : Number(value);
      if (isNaN(d) || d <= 0) d = 9;
      setForm((prev) => ({ ...prev, decimals: d }));
      // Recompute display supply to keep logical value
      setForm((prev) => ({ ...prev, initial_supply: displaySupply }));
      return;
    }
    if (name === "initial_supply") {
      setDisplaySupply(value);
      setForm((prev) => ({ ...prev, initial_supply: value }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessToken(null); // Reset on new submit
    try {
      // Log the full form payload for the TokenFactory contract
      const tokenFactoryPayload = {
        ...form,
        decimals: getDecimals(),
        initial_supply: Number(displaySupply), // Send raw value without decimal multiplication
      };
      console.log(
        "[TokenForm] Payload sent to backend for TokenFactory contract:",
        tokenFactoryPayload
      );
      // REMOVE: API calls to /generate_contract and /deploy_contract
      // The new flow is event-driven; contract deployment is handled by the backend event listener.
      // You may want to show a message or poll for token status instead.
      onSnackbar("Token deployment initiated...", "info");
      if (onSuccess) onSuccess();
      return;
    } catch (err) {
      onSnackbar(err.message || "Error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" mb={2}>
        Create Your Custom Sui Token
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Token Name"
            name="name"
            fullWidth
            required
            value={form.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Symbol"
            name="symbol"
            fullWidth
            required
            value={form.symbol}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Decimals"
            name="decimals"
            type="number"
            fullWidth
            required
            value={form.decimals}
            onChange={handleChange}
            inputProps={{ min: 0, max: 18 }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            name="description"
            fullWidth
            required
            value={form.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Icon URL"
            name="icon_url"
            fullWidth
            value={form.icon_url}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label={`Initial Supply (will be multiplied by 10^${getDecimals()})`}
            name="initial_supply"
            type="number"
            fullWidth
            required
            value={displaySupply}
            onChange={handleChange}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Deployer Address"
            name="deployerAddress"
            fullWidth
            required
            value={deployerAddress}
            onChange={(e) => {
              setDeployerAddress(e.target.value);
              localStorage.setItem("deployerAddress", e.target.value);
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Private Key"
            name="private_key"
            fullWidth
            required
            value={form.private_key}
            onChange={handleChange}
            type="password"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.mint}
                onChange={handleChange}
                name="mint"
              />
            }
            label="Enable Mint"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.burn}
                onChange={handleChange}
                name="burn"
              />
            }
            label="Enable Burn"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.transfer}
                onChange={handleChange}
                name="transfer"
              />
            }
            label="Enable Transfer"
          />
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
      >
        {loading ? "Deploying..." : "Generate & Deploy Token"}
      </Button>
      {successToken && (
        <Box
          sx={{
            my: 2,
            p: 2,
            bgcolor: "#d0f5e8",
            borderRadius: 2,
            border: "1px solid #19cf8e",
          }}
        >
          <Typography variant="h6" color="success.main">
            Token Deployed!
          </Typography>
          <Typography>
            <b>Name:</b> {successToken.name}
          </Typography>
          <Typography>
            <b>Symbol:</b> {successToken.symbol}
          </Typography>
          <Typography>
            <b>Decimals:</b> {successToken.decimals}
          </Typography>
          <Typography>
            <b>Description:</b> {successToken.description || "N/A"}
          </Typography>
          <Typography>
            <b>Initial Supply:</b>{" "}
            {successToken.initial_supply
              ? `${successToken.initial_supply} (raw units), ${(
                  Number(successToken.initial_supply) /
                  Math.pow(10, Number(successToken.decimals || 9))
                ).toLocaleString()} tokens`
              : "N/A"}
          </Typography>
          <Typography>
            <b>Metadata URI:</b> {successToken.metadata_uri}
          </Typography>
          <Typography>
            <b>Package ID:</b>{" "}
            <span style={{ wordBreak: "break-all" }}>
              {successToken.package_id || "N/A"}
            </span>
          </Typography>
          {successToken.package_id && (
            <Button
              size="small"
              href={`https://suiexplorer.com/object/${successToken.package_id}?network=testnet`}
              target="_blank"
              sx={{ mt: 1 }}
            >
              View on Explorer
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
