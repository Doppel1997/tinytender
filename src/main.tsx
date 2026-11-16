import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { StoreProvider } from "./context/StoreContext";
import { ToastProvider } from "./context/ToastContext";
import { UIProvider } from "./context/UIContext";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("No se encontró el contenedor #root.");
}

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
