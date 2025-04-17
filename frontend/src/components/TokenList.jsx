import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Link, CircularProgress
} from '@mui/material';

const SUI_BLOCK_EXPLORER = 'https://suiexplorer.com/object/';

export default function TokenList({ refresh, deployerAddress, onSnackbar }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deployerAddress) return;
    setLoading(true);
    fetch('/my_tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: deployerAddress })
    })
      .then(res => res.json())
      .then(data => setTokens(data.tokens || []))
      .catch(() => onSnackbar('Failed to load tokens', 'error'))
      .finally(() => setLoading(false));
  }, [refresh, deployerAddress]);

  const handleMint = (token) => {
    onSnackbar('Mint functionality coming soon!', 'info');
  };

  const handleBurn = (token) => {
    onSnackbar('Burn functionality coming soon!', 'info');
  };

  const handleTransfer = (token) => {
    onSnackbar('Transfer functionality coming soon!', 'info');
  };

  if (!deployerAddress) {
    return <Typography variant="body1">Enter your deployer address to view your tokens.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" mb={2}>Your Deployed Tokens</Typography>
      {loading ? <CircularProgress /> : (
        <Grid container spacing={2}>
          {tokens.length === 0 && (
            <Grid item xs={12}>
              <Typography>No tokens found for this address.</Typography>
            </Grid>
          )}
          {tokens.map((token, idx) => (
            <Grid item xs={12} sm={6} md={4} key={token.package_id || idx}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{token.name || token.module_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Symbol: {token.symbol}</Typography>
                  <Typography variant="body2" color="text.secondary">Decimals: {token.decimals}</Typography>
                  <Typography variant="body2" color="text.secondary">Description: {token.description}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Package ID: <span style={{ fontFamily: 'monospace' }}>{token.package_id}</span></Typography>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Link href={SUI_BLOCK_EXPLORER + token.package_id} target="_blank" rel="noopener">View on Explorer</Link>
                  </Box>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleMint(token)}>Mint</Button>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleBurn(token)}>Burn</Button>
                  <Button size="small" variant="outlined" onClick={() => handleTransfer(token)}>Transfer</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
