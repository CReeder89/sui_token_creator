import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";
import TokenIcon from "@mui/icons-material/Token";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <IconButton edge="start" color="primary" sx={{ mr: 1 }} onClick={() => navigate("/")}> 
          <TokenIcon fontSize="large" />
        </IconButton>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", fontWeight: 700 }}
        >
          Sui Token Creator
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          <Button color="primary" component={RouterLink} to="/create">
            Token Creator
          </Button>
          <Button color="primary" component={RouterLink} to="/profile">
            Profile
          </Button>
        </Box>
        <WalletConnect />
      </Toolbar>
    </AppBar>
  );
}
