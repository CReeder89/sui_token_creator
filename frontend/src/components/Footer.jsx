import React from "react";
import { Box, Typography, Link, Container } from "@mui/material";
import TwitterIcon from "@mui/icons-material/Twitter";
import SvgIcon from "@mui/material/SvgIcon";

// Custom Discord SVG icon (since @mui/icons-material does not provide Discord)
function DiscordIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.0371c-1.4712.2492-3.2203.8227-4.8852 1.5152a.0699.0699 0 0 0-.0321.0277C.5334 7.0459-.319 9.5799.0992 12.0578c.0018.0101.0071.0192.0152.0254 2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.8732.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0152-.0254c.5004-3.177-.8382-5.6739-3.5485-7.6601a.061.061 0 0 0-.0312-.0286ZM8.02 14.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189Zm7.9748 0c-1.1826 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </SvgIcon>
  );
}

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "#f5f5f5", py: 3, mt: 8 }}>
      <Container maxWidth="md" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box mb={1}>
          <Link href="https://twitter.com/" target="_blank" color="inherit" sx={{ mx: 1 }}>
            <TwitterIcon />
          </Link>
          <Link href="https://discord.com/" target="_blank" color="inherit" sx={{ mx: 1 }}>
            <DiscordIcon />
          </Link>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {new Date().getFullYear()} Sui Token Creator. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
