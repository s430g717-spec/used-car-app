// @ts-nocheck
import "./styles.css";
import { createRoot } from "react-dom/client";
import App from "./App";
// Register service worker for PWA on supported browsers
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // silent failure
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
