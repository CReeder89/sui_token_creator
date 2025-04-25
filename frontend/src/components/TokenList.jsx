import React, { useEffect, useState } from "react";
import { Box, Typography, List, Card, Button } from "@mui/material";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { BACKEND_URL } from '../config';

export default function TokenList({ onSnackbar }) {
  const account = useCurrentAccount();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/user_tokens?address=${account.address}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setTokens(data.tokens || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        onSnackbar && onSnackbar("Error fetching tokens: " + err.message, "error");
      });
  }, [account]);

  if (!account) return <Typography>Connect your wallet to view your tokens.</Typography>;
  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5">Your Deployed Tokens</Typography>
      {loading && <Typography>Loading...</Typography>}
      {tokens.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{ my: 2 }}>No tokens deployed yet.</Typography>
      )}
      <List>
        {tokens.map((token) => (
          <Card key={token.package_id} sx={{ my: 2 }}>
            <Typography variant="body1"><b>Name:</b> {token.name}</Typography>
            <Typography variant="body1"><b>Symbol:</b> {token.symbol}</Typography>
            <Typography variant="body1"><b>Decimals:</b> {token.decimals}</Typography>
            <Typography variant="body1"><b>Description:</b> {token.description}</Typography>
            <Typography variant="body1"><b>Initial Supply:</b> {token.initial_supply}</Typography>
            <Typography variant="body1"><b>Metadata URI:</b> {token.metadata_uri}</Typography>
            <Typography variant="body1"><b>Package ID:</b> <span style={{ wordBreak: 'break-all' }}>{token.package_id}</span></Typography>
            <Button size="small" href={`https://suiexplorer.com/object/${token.package_id}?network=testnet`} target="_blank" sx={{ mt: 1 }}>View on Explorer</Button>
            {/* Optionally: Mint, Burn, Transfer buttons */}
          </Card>
        ))}
      </List>
    </Box>
  );
}
