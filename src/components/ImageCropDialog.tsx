// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import ResolvedImg from "./ResolvedImg";
import { getImageDataUrl, saveImageFromDataUrl } from "../lib/idb";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string; // idb: or data/http url
  onCropped: (newSrc: string) => void; // returns idb:<id> or data url
}

export default function ImageCropDialog({
  open,
  onOpenChange,
  src,
  onCropped,
}: ImageCropDialogProps) {
  const [box, setBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  useEffect(() => {
    setBox(null);
    setDragStart(null);
  }, [open, src]);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (
      containerRef.current as HTMLDivElement
    ).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setBox({ x, y, w: 0, h: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const rect = (
      containerRef.current as HTMLDivElement
    ).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - dragStart.x;
    const h = y - dragStart.y;
    setBox({ x: dragStart.x, y: dragStart.y, w, h });
  };
  const onPointerUp = () => setDragStart(null);

  const crop = async () => {
    try {
      const display = containerRef.current;
      const imageEl = imgRef.current as HTMLImageElement;
      if (!display || !imageEl || !box) return;
      // compute scale from displayed img to natural size
      const dw = imageEl.clientWidth;
      const dh = imageEl.clientHeight;
      const scaleX = natural.w / dw;
      const scaleY = natural.h / dh;
      const sx = Math.round(
        Math.max(0, Math.min(dw, box.w >= 0 ? box.x : box.x + box.w)) * scaleX
      );
      const sy = Math.round(
        Math.max(0, Math.min(dh, box.h >= 0 ? box.y : box.y + box.h)) * scaleY
      );
      const sw = Math.round(Math.min(dw, Math.abs(box.w)) * scaleX);
      const sh = Math.round(Math.min(dh, Math.abs(box.h)) * scaleY);
      // resolve to dataUrl if idb
      let srcData = src;
      if (src.startsWith("idb:")) {
        const d = await getImageDataUrl(src.slice(4));
        if (!d) return;
        srcData = d;
      }
      // draw crop
      const imgObj = new Image();
      await new Promise<void>((resolve) => {
        imgObj.onload = () => resolve();
        imgObj.src = srcData;
      });
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(imgObj, sx, sy, sw, sh, 0, 0, sw, sh);
      const out = canvas.toDataURL("image/jpeg", 0.9);
      try {
        const id = await saveImageFromDataUrl(out);
        onCropped(`idb:${id}`);
      } catch {
        onCropped(out);
      }
      onOpenChange(false);
    } catch {
      // ignore
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">
            領域切り出し（OCR前の補正）
          </div>
          <button className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            閉じる
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div
            ref={containerRef}
            className="relative w-full aspect-4/3 overflow-hidden rounded-lg border"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <ResolvedImg
              src={src}
              alt="crop"
              className="w-full h-full object-contain"
              // capture natural size once loaded
              onLoad={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                setNatural({ w: t.naturalWidth, h: t.naturalHeight });
                imgRef.current = t;
              }}
            />
            {box && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10"
                style={{
                  left: `${Math.min(box.x, box.x + box.w)}px`,
                  top: `${Math.min(box.y, box.y + box.h)}px`,
                  width: `${Math.abs(box.w)}px`,
                  height: `${Math.abs(box.h)}px`,
                }}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={crop} disabled={!box}>
              切り出して置換
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
