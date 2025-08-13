// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { signInAnon } from "./firebase";
import { registerSW } from "./swRegistration";
import InstallPWA from "./InstallPWA";

const theme = extendTheme({
  fonts: {
    heading: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    body: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  styles: { global: { body: { bg: "#f7f7fb", color: "#111" } } },
});

// Kick off anonymous auth (required for Firestore writes)
signInAnon().catch(() => {
  /* handled in firebase.js */
});

// Register PWA service worker
registerSW();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      {/* Install banner lives at the app root */}
      <InstallPWA />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
