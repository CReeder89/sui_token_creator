import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import TokenDetails from "./pages/TokenDetails";
import TokenForm from "./components/TokenForm.jsx";
import TokenList from "./components/TokenList.jsx";
import { WalletConnect } from "./components/WalletConnect.jsx";
import CoinMerge from "./pages/CoinMerge.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import AdminDashboard from "./pages/AdminDash.jsx";
function App() {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [refreshTokens, setRefreshTokens] = useState(false);
  const [deployerAddress, setDeployerAddress] = useState("");

  useEffect(() => {
    // Optionally load address from localStorage or wallet connect
    const stored = localStorage.getItem("deployerAddress");
    if (stored) setDeployerAddress(stored);
  }, []);

  const handleSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h3" align="center" gutterBottom>
              Sui Custom Token Generator
            </Typography>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <TokenForm
                onSuccess={() => setRefreshTokens((r) => !r)}
                onSnackbar={handleSnackbar}
                deployerAddress={deployerAddress}
                setDeployerAddress={setDeployerAddress}
              />
            </Paper>
            <Box mt={4}>
              <TokenList
                refresh={refreshTokens}
                deployerAddress={deployerAddress}
                onSnackbar={handleSnackbar}
              />
            </Box>
          </Container>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/coinmerge" element={<CoinMerge />} />
        <Route path="/comingsoon" element={<ComingSoon />} />
        <Route path="/token/:tokenId" element={<TokenDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
      </Routes>
      <Footer />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Router>
  );
}

export default App;
