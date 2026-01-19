// @ts-nocheck
import "./styles.css";
import { createRoot } from "react-dom/client";
import App from "./App";
// Register service worker for PWA on supported browsers
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = (import.meta as any).env?.BASE_URL || "/";
    const swVersion = "v7"; // bump to force SW update when deployed
    const swUrl = new URL(`sw.js?v=${swVersion}`, base).toString();
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.update?.();
      })
      .catch(() => {
        // silent failure
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
