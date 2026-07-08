import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { resetLocalDatabase } from "@gestion-clases/core";
import App from "./App";
import { AuthGate } from "./components/auth/AuthGate";
import { DemoGate } from "./components/auth/DemoGate";
import { queryClient } from "./lib/queryClient";
import { IS_DEMO } from "./lib/appMode";
import "./styles/index.css";

async function main() {
  if (import.meta.env.VITE_RESET_DB === "true") {
    await resetLocalDatabase();
    // eslint-disable-next-line no-console
    console.info("[gestion-clases] Base de datos local borrada (npm run dev:reset).");
  }

  const Gate = IS_DEMO ? DemoGate : AuthGate;
  // GitHub Pages has no server-side rewrites for deep links (unlike Firebase Hosting), so the demo
  // uses hash routing — always resolves to index.html on any static host, refresh-proof.
  const Router = IS_DEMO ? HashRouter : BrowserRouter;

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Gate>
            <App />
          </Gate>
        </Router>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

main();
