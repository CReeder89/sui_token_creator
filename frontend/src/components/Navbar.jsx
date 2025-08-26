import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PaidIcon from '@mui/icons-material/Paid';
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

export default function Navbar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { label: "Token Creator", path: "/create" },
    { label: "Profile", path: "/profile" },
    { label: "Coin Merge", path: "/coinmerge" },
    { label: "Coming Soon", path: "/comingsoon" },
  ];

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {/* Logo + Title */}
          <IconButton edge="start" color="primary" sx={{ mr: 1 }} onClick={() => navigate("/")}>
            <PaidIcon fontSize="large" />
          </IconButton>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: 700,
            }}
          >
            Sui Token Creator
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {menuItems.map((item) => (
              <Button key={item.label} color="primary" component={RouterLink} to={item.path}>
                {item.label}
              </Button>
            ))}
            <WalletConnect />
          </Box>

          {/* Mobile Hamburger */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton color="primary" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer for Mobile */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.label} component={RouterLink} to={item.path}>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <WalletConnect />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
