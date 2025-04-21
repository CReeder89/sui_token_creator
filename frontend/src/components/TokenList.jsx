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
      {loading && <CircularProgress sx={{ my: 2 }} />}
      {tokens.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{ my: 2 }}>No tokens deployed yet.</Typography>
      )}
      <List>
        {tokens.map((token) => (
          <ListItem button key={token.packageId} onClick={() => setSelected(token)}>
            <ListItemText
              primary={`${token.name} (${token.symbol})`}
              secondary={
                <span>
                  <b>Package:</b> <span style={{ wordBreak: 'break-all' }}>{token.packageId}</span><br />
                  <b>Decimals:</b> {token.decimals} &nbsp; <b>Initial Supply:</b> {token.initialSupply}<br />
                  <b>Metadata URI:</b> {token.metadataUri}
                  <br />
                  <Button size="small" href={`https://suiexplorer.com/object/${token.packageId}?network=testnet`} target="_blank" sx={{ mt: 1 }}>View on Explorer</Button>
                </span>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
