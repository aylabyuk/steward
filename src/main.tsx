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

// NOTE: React.StrictMode intentionally omitted. It double-invokes every
// useEffect in development, which causes firebase-js-sdk's `onSnapshot`
// listeners to attach/detach in rapid succession. The SDK's target
// reconciliation can't handle that pattern and throws
// "FIRESTORE INTERNAL ASSERTION FAILED (ID: ca9 / b815, ve: -1)" —
// a known open bug. The workaround is to avoid StrictMode at the root;
// the production build is unaffected either way (StrictMode's
// double-invoke is dev-only).
createRoot(rootElement).render(<App />);
