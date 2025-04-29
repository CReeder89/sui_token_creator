import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Props: tokenInfo { name, symbol, decimals, packageId, treasuryCapId, ... }
export default function TokenProfile({ tokenInfo, onSnackbar }) {
  const account = useCurrentAccount();
  const [loading, setLoading] = useState("");
  const [dialog, setDialog] = useState({ open: false, action: null });
  const [form, setForm] = useState({ amount: "", recipient: "" });

  const openDialog = (action) => {
    setDialog({ open: true, action });
    setForm({ amount: "", recipient: "" });
  };
  const closeDialog = () => setDialog({ open: false, action: null });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Helper for all actions
  const handleAction = async () => {
    if (!account) {
      onSnackbar("Connect your wallet!", "error");
      return;
    }
    setLoading(dialog.action);
    try {
      const tx = new Transaction();
      let args = [];
      if (dialog.action === "mint") {
        args = [tokenInfo.treasuryCapId, Number(form.amount), form.recipient];
      } else if (dialog.action === "burn") {
        args = [tokenInfo.treasuryCapId, Number(form.amount)];
      } else if (dialog.action === "transfer") {
        args = [tokenInfo.coinObjectId, form.recipient, Number(form.amount)];
      }
      tx.moveCall({
        target: `${tokenInfo.packageId}::token::${dialog.action}`,
        arguments: args,
      });
      // TODO: Add wallet kit signing logic here
      onSnackbar(
        `${dialog.action} transaction built! (sign/send not implemented)`,
        "info"
      );
      setLoading("");
      closeDialog();
    } catch (err) {
      onSnackbar(`Transaction error: ${err.message}`, "error");
      setLoading("");
    }
  };

  return (
    <Box>
      <Typography variant="h4">
        {tokenInfo.name} ({tokenInfo.symbol})
      </Typography>
      <Typography variant="subtitle1">
        Decimals: {tokenInfo.decimals}
      </Typography>
      <Typography variant="subtitle2">
        Package: {tokenInfo.packageId}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item>
          <Button
            variant="contained"
            disabled={loading === "mint" || !account}
            onClick={() => openDialog("mint")}
          >
            {loading === "mint" ? <CircularProgress size={22} /> : "Mint"}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            disabled={loading === "burn" || !account}
            onClick={() => openDialog("burn")}
          >
            {loading === "burn" ? <CircularProgress size={22} /> : "Burn"}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            disabled={loading === "transfer" || !account}
            onClick={() => openDialog("transfer")}
          >
            {loading === "transfer" ? (
              <CircularProgress size={22} />
            ) : (
              "Transfer"
            )}
          </Button>
        </Grid>
      </Grid>
      <Dialog open={dialog.open} onClose={closeDialog}>
        <DialogTitle>
          {dialog.action &&
            dialog.action.charAt(0).toUpperCase() + dialog.action.slice(1)}
        </DialogTitle>
        <DialogContent>
          {(dialog.action === "mint" ||
            dialog.action === "burn" ||
            dialog.action === "transfer") && (
            <TextField
              label="Amount"
              name="amount"
              type="number"
              fullWidth
              value={form.amount}
              onChange={handleFormChange}
              sx={{ my: 1 }}
            />
          )}
          {(dialog.action === "mint" || dialog.action === "transfer") && (
            <TextField
              label="Recipient Address"
              name="recipient"
              fullWidth
              value={form.recipient}
              onChange={handleFormChange}
              sx={{ my: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleAction} disabled={loading} variant="contained">
            {loading ? <CircularProgress size={22} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
