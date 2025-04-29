import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
// TokenCard will be created later and imported here

export default function Profile() {
  // Placeholder for user info and tokens
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} mb={4}>
        My Profile
      </Typography>
      <Box mb={4}>
        <Typography variant="body1" color="text.secondary">
          {/* User info, e.g. wallet address, goes here */}
          Wallet Address: <b>[wallet address here]</b>
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={600} mb={2}>
        My Tokens
      </Typography>
      <Grid container spacing={3}>
        {/* TokenCard components will be mapped here */}
      </Grid>
    </Container>
  );
}
