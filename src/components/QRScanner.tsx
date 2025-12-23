import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: any) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      const name = err?.name;
      if (name === "NotAllowedError")
        setError(
          "カメラへのアクセスが拒否されました。ブラウザ設定で許可してください。"
        );
      else if (name === "NotFoundError")
        setError(
          "カメラが見つかりませんでした。デバイスの接続を確認してください。"
        );
      else if (name === "NotReadableError")
        setError("カメラが他のアプリで使用中の可能性があります。");
      else setError("カメラの起動に失敗しました。");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    setScanning(false);
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleQRCode(code.data);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleQRCode = (data: string) => {
    try {
      const text = data.trim();

      // 1) URL/クエリ形式 ?key=value&...
      const fromQuery = (() => {
        try {
          const url = new URL(text);
          const params = url.searchParams;
          const obj: any = {};
          params.forEach((v, k) => (obj[k.toLowerCase()] = v));
          return obj;
        } catch {
          return null;
        }
      })();

      // 2) JSON形式
      const fromJson = (() => {
        try {
          const obj = JSON.parse(text);
          if (obj && typeof obj === "object") return obj;
        } catch {}
        return null;
      })();

      // 3) key:value 行形式
      const fromKvLines = (() => {
        const lines = text.split(/\r?\n/);
        const obj: any = {};
        let hit = false;
        lines.forEach((line) => {
          const m = line.match(/^\s*([^:：]+)\s*[:：]\s*(.+)$/);
          if (m) {
            hit = true;
            const key = m[1].trim().toLowerCase();
            obj[key] = m[2].trim();
          }
        });
        return hit ? obj : null;
      })();

      // 4) CSV形式
      const fromCsv = (() => {
        const parts = text.split(/[,,\t|]/);
        if (parts.length >= 3) {
          return {
            modelType: parts[0],
            model: parts[1],
            year: parts[2],
            mileage: parts[3],
            vin: parts[4],
          };
        }
        return null;
      })();

      const raw = fromQuery || fromJson || fromKvLines || fromCsv || {};

      // 正規化と抽出
      const get = (...keys: string[]) => {
        for (const k of keys) {
          const v = raw[k] ?? raw[k.toLowerCase()];
          if (v) return String(v);
        }
        return "";
      };

      // 年式（西暦 or 和暦）
      const parseYear = (s: string) => {
        if (!s) return undefined as number | undefined;
        const m4 = s.match(/\b(19|20)\d{2}\b/);
        if (m4) return parseInt(m4[0]);
        const era = s.match(/(令和|平成)\s*(\d+)/);
        if (era) {
          const n = parseInt(era[2]);
          if (era[1] === "令和") return 2018 + n; // 令和1=2019
          if (era[1] === "平成") return 1988 + n; // 平成1=1989
        }
        return undefined;
      };

      const modelType = get("modelType", "型式").toUpperCase();
      const model = get("model", "車名");
      const yearStr = get("year", "初度登録", "初度検査");
      const year = parseYear(yearStr);
      const vin = get("vin", "車体番号");
      const grade = get("grade", "グレード");
      const colorNo = (() => {
        const v = get("colorNo", "カラー", "カラーNo", "色番号").toUpperCase();
        const m = v.match(/\b[0-9A-Z]{3}\b/);
        return m ? m[0] : v || "";
      })();

      const parsedData: any = {
        ...(modelType ? { modelType } : {}),
        ...(model ? { model } : {}),
        ...(typeof year !== "undefined" ? { year } : {}),
        ...(vin ? { vin } : {}),
        ...(grade ? { grade } : {}),
        ...(colorNo ? { colorNo } : {}),
      };

      stopCamera();
      onScan(parsedData);
      onOpenChange(false);
    } catch (err) {
      setError("QRコードの読み取りに失敗しました");
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>車検証QRコード読み取り</DialogTitle>
          <DialogDescription>
            車検証のQRコードをカメラでスキャンしてください
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" /> キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
