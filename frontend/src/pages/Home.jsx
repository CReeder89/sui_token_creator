import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <img src="/logo192.png" alt="Sui Token Creator" style={{ width: 80, marginBottom: 16 }} />
        <Typography variant="h2" fontWeight={700} color="primary" gutterBottom>
          Sui Token Creator
        </Typography>
        <Typography variant="h5" color="text.secondary" mb={4}>
          Create your own Sui-based fungible token in under 1 minute. No coding required.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/create")}
        >
          Create My Token
        </Button>
      </Box>
      <Box mb={6}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          How It Works
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          1. Connect your Sui wallet.<br/>
          2. Fill out the token creation form.<br/>
          3. Deploy your token to the Sui blockchain.<br/>
          4. Manage and view your tokens in your profile.
        </Typography>
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={500} gutterBottom>
          Why Sui Token Creator?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          - Fast, secure, and easy token deployment<br/>
          - No coding knowledge needed<br/>
          - View and manage all your tokens in one place<br/>
          - Open source and community-driven
        </Typography>
      </Box>
    </Container>
  );
}
