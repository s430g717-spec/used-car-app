// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useState } from "react";

export default function PWAInstallButton({ className = "btn btn-outline" }) {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      setSupported(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!promptEvent) return;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      setSupported(false);
      console.log("PWA install choice:", choice.outcome);
    } catch (err) {
      console.warn("PWA install failed", err);
    }
  };

  // すでにインストール済や非対応の場合は非表示
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone;
  if (isStandalone || !supported) return null;

  return (
    <button className={className} onClick={onInstall}>
      アプリをインストール
    </button>
  );
}
