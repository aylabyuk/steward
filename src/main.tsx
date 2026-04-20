import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { registerFcmServiceWorker } from "@/lib/registerSw";
import { initAuthListener } from "@/stores/authStore";
import "@/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

initAuthListener();
registerFcmServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
