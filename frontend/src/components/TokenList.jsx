import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress } from "@mui/material";
import { useCurrentAccount } from "@mysten/dapp-kit";
import TokenProfile from "./TokenProfile";

export default function TokenList({ onSnackbar }) {
  const account = useCurrentAccount();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetch(`/api/user_tokens?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => {
        setTokens(data.tokens || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [account]);

  if (!account) return <Typography>Connect your wallet to view your tokens.</Typography>;
  if (loading) return <CircularProgress />;

  if (selected) {
    return <TokenProfile tokenInfo={selected} onSnackbar={onSnackbar} />;
  }

  return (
    <Box>
      <Typography variant="h5">Your Deployed Tokens</Typography>
      <List>
        {tokens.map((token) => (
          <ListItem button key={token.packageId} onClick={() => setSelected(token)}>
            <ListItemText primary={`${token.name} (${token.symbol})`} secondary={`Package: ${token.packageId}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
