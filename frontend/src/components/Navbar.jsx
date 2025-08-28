import React, { useState, useEffect } from "react";
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
import NetworkSelector from "./NetworkSelect";
import { useSuiClientContext, useCurrentAccount} from '@mysten/dapp-kit';

export default function Navbar() {
  const { network } = useSuiClientContext();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ctx = useSuiClientContext();
  const account = useCurrentAccount();

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

   useEffect(() => {
    
    // This code will run every time the `network` variable changes
    if (network && account) {

      const chain = account?.chains[0].slice(4) // Remove 'sui:' prefix

      ctx.selectNetwork(chain)

      console.log(ctx.network)



      console.log(`The wallet network has changed to: ${chain}`);
      // You can call any function here, for example:
      // myFunctionToRunOnNetworkChange(network);
    }
  }, [network, account]); // The dependency array tells useEffect to watch the 'network' variable

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


            <Typography variant="body1" sx={{ mx: 2 }}>
              {network ? `Network: ${network}` : 'No Network Selected'}
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
