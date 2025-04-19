import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { DappKitProvider } from "./dappKitProvider.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DappKitProvider>
        <App />
      </DappKitProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
