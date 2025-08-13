import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { signInAnon } from "./firebase";

const theme = extendTheme({
  fonts: { heading: "system-ui, -apple-system, Segoe UI, Roboto, Arial", body: "system-ui, -apple-system, Segoe UI, Roboto, Arial" },
  styles: { global: { body: { bg: "#f7f7fb", color: "#111" } } },
});

// Kick off anonymous auth (required for Firestore writes)
signInAnon().catch(() => { /* handled in firebase.js */ });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
