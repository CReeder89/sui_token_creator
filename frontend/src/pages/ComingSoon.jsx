import React from "react";
import { Box, Typography, Button, Card, CardContent, Grid, Container } from "@mui/material";

export default function ComingSoon() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4CA2FF 0%, #0A192F 100%)",
        color: "#fff",
        py: 8,
      }}
    >
      <Container maxWidth="md">
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Coming Soon: Safari Mobile Extension Wallet
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.8)">
            Seamlessly access your SUI assets directly in Safari. Fast, secure, and intuitive.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="secondary"
              sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
            >
              Join Waitlist
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
            Why You'll Love It
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    Quick Access
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Your SUI assets are just a click away. Seamlessly interact with dApps while browsing.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    Built for Safari
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Optimized for iOS and macOS Safari. Enjoy smooth, native-like experience on your devices.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    Secure & Private
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Your keys never leave your device. Bank-level security and privacy for your SUI tokens.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, p: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    Intuitive Design
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    A sleek and minimal interface makes managing your assets effortless, even for first-time crypto users.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Screenshots / Preview Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
            Sneak Peek
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }} justifyContent="center">
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Box
                  sx={{
                    height: 250,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "1.2rem",
                  }}
                >
                  Screenshot {i}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Get Ready for the Future of SUI on Safari
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Stay updated and be the first to try our mobile extension. Your SUI experience is about to get easier, faster, and safer.
          </Typography>
          <Button variant="contained" color="secondary" sx={{ px: 5, py: 1.5 }}>
            Join Waitlist
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
