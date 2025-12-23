// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import ResolvedImg from "./ResolvedImg";

export default function TouchImageViewer({
  src,
  title,
  onClose,
}: {
  src: string;
  title?: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [last, setLast] = useState<{ x: number; y: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastDist = useRef<number | undefined>(undefined);
  const dblRef = useRef<{ ts: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const next = Math.min(6, Math.max(1, scale + delta * 0.0015));
    setScale(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setLast({ x: e.clientX, y: e.clientY });
    const now = Date.now();
    if (dblRef.current && now - dblRef.current.ts < 300) {
      // double tap
      setScale((s) => (s > 1 ? 1 : 2));
      dblRef.current = null;
    } else {
      dblRef.current = { ts: now, x: e.clientX, y: e.clientY };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const m = pointers.current;
    if (m.size >= 2) {
      m.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const arr = Array.from(m.values());
      const dx = arr[0].x - arr[1].x;
      const dy = arr[0].y - arr[1].y;
      const dist = Math.hypot(dx, dy);
      if (lastDist.current === undefined) lastDist.current = dist;
      const change = dist - (lastDist.current || dist);
      setScale((s) => Math.min(6, Math.max(1, s + change * 0.005)));
      lastDist.current = dist;
      return;
    }
    if (last) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      setLast({ x: e.clientX, y: e.clientY });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastDist.current = undefined;
    setLast(null);
  };

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70"
      onWheel={onWheel}
    >
      <div className="bg-white rounded-xl shadow-xl w-[92%] max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="text-sm font-semibold truncate">
            {title || "画像ビューア"}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={reset}>
              リセット
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          className="relative bg-black flex items-center justify-center select-none"
          style={{ height: "76vh" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            className="overflow-hidden"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: "transform 0s",
            }}
          >
            <ResolvedImg
              src={src}
              alt={title}
              className="max-h-[72vh] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
