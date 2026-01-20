// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { DIAGRAM_SRC, STEP_Y, parts as baseParts } from "../lib/parts";
import { saveImageFromDataUrl } from "../lib/idb";

type Part = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
type Defect = { type: string; level?: string };
type PartDefects = { partId: string; list: Defect[]; photos?: string[] };

export type OnDefectsChange = (defs: PartDefects[]) => void;

const HITBOX_PAD = 2.5; // タップ領域の拡張（SVG座標単位・モバイル強化）
const parts: Part[] = baseParts;
export function CarPartSelector({
  onDefectsChange,
}: {
  onDefectsChange?: OnDefectsChange;
}) {
  const [selected, setSelected] = useState<Part | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [level, setLevel] = useState<string>("");
  const [defects, setDefects] = useState<PartDefects[]>([]);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [editableParts, setEditableParts] = useState<Part[]>(parts);
  const [editMode, setEditMode] = useState(false);
  const [levelOverlay, setLevelOverlay] = useState<string | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const webcamRef = useRef<Webcam | null>(null);

  // Toggle-add or remove a defect; replaces same type with new level and removes on re-tap
  const toggleDefect = (partId: string, newDef: Defect) => {
    let added = false;
    setDefects((prev) => {
      const idx = prev.findIndex((d) => d.partId === partId);
      const current = idx >= 0 ? prev[idx].list : [];
      const sameIdx = current.findIndex(
        (d) => d.type === newDef.type && d.level === newDef.level
      );

      let nextList: Defect[];
      if (sameIdx >= 0) {
        nextList = current.filter((_, i) => i !== sameIdx);
      } else {
        const filtered = current.filter((d) => d.type !== newDef.type);
        nextList = [...filtered, newDef].slice(-2);
        added = true;
      }

      if (nextList.length === 0) {
        if (idx < 0) return prev;
        return prev.filter((_, i) => i !== idx);
      }

      const copy = [...prev];
      if (idx >= 0) copy[idx] = { partId, list: nextList, photos: prev[idx].photos };
      else copy.push({ partId, list: nextList });
      return copy;
    });
    return added;
  };

  useEffect(() => {
    if (onDefectsChange) onDefectsChange(defects);
  }, [defects, onDefectsChange]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {}
  };

  const capturePhoto = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot || !selected) return;
    // compress
    const img = new Image();
    img.onload = async () => {
      const maxW = 1200;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", 0.8);
      // save to IndexedDB and store reference idb:<id>
      let ref = out;
      try {
        const id = await saveImageFromDataUrl(out);
        ref = `idb:${id}`;
      } catch {}
      setDefects((prev) => {
        const idx = prev.findIndex((d) => d.partId === selected.id);
        if (idx >= 0) {
          const copy = [...prev];
          const photos = copy[idx].photos ? [...copy[idx].photos, ref] : [ref];
          copy[idx] = { ...copy[idx], photos };
          return copy;
        }
        return [...prev, { partId: selected.id, list: [], photos: [ref] }];
      });
      setCamOpen(false);
    };
    img.src = shot;
  };

  return (
    <div className="p-4">
      <div
        ref={containerRef}
        className={`relative ${
          isFullscreen ? "rounded-none border-0 bg-white" : "card"
        }`}
        style={{ height: isFullscreen ? ("100dvh" as any) : undefined }}
      >
        <div className="absolute right-2 top-2 z-10">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => setIsFullscreen((v) => !v)}
          >
            {isFullscreen ? "縮小" : "全画面"}
          </button>
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={`w-full block ${isFullscreen ? "h-dvh" : "h-[70vh]"}`}
          style={{ touchAction: "none" }}
        >
          <image href={DIAGRAM_SRC} x="0" y="0" width="100" height="100" />
          {editableParts.map((p) => (
            <g key={p.id}>
              <rect
                x={p.x - HITBOX_PAD}
                y={p.y - HITBOX_PAD}
                width={p.w + HITBOX_PAD * 2}
                height={p.h + HITBOX_PAD * 2}
                fill="transparent"
                stroke="none"
                onPointerDown={() => setPressedId(p.id)}
                onPointerUp={() => {
                  setPressedId(null);
                  setSelected(p);
                            const added = toggleDefect(selected.id, { type: code });
                opacity={0}
                pointerEvents="none"
              />
                            if (added) {
                              setLevelOverlay(code);
                              setTimeout(() => setLevelOverlay(null), 1200);
                            }
                y={p.y - 1}
                width={p.w + 2}
                height={p.h + 2}
                fill="none"
                stroke={
                  pressedId === p.id || selected?.id === p.id
                    ? "#38bdf8"
                    : "transparent"
                }
                strokeWidth={
                  pressedId === p.id || selected?.id === p.id ? 2 : 0
                }
                pointerEvents="none"
              />
              {(() => {
                const pd = defects.find((d) => d.partId === p.id);
                if (!pd || pd.list.length === 0) return null;
                const items = pd.list
                  .slice(0, 2)
                  .map((d) => (d.level ? `${d.type}${d.level}` : d.type));
                let startY = p.y + p.h - 6;
                const offsetMap: Record<string, number> = {
                  roof: -10,
                  left_front_door: -2,
                  right_front_door: -2,
                  left_rear_door: -2,
                  right_rear_door: -2,
                  front_bumper: -1,
                  rear_bumper: -1,
                  hood: -4,
                  gate: -4,
                };
                startY += offsetMap[p.id] ?? 0;
                return (
                  <text
                    x={p.x + p.w / 2}
                    y={startY}
                    textAnchor="middle"
                    fontSize={3.8}
                    fontWeight={700}
                    fill="#dc2626"
                  >
                    {items.map((t, i) => (
                      <tspan key={i} x={p.x + p.w / 2} dy={i === 0 ? 0 : 3.5}>
                        {t}
                      </tspan>
                    ))}
                  </text>
                );
              })()}
            </g>
          ))}
        </svg>

        {selected && (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setPendingType(null);
                setLevel("");
                setSelected(null);
              }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm">
              <div className="modal p-4 space-y-3">
                <div className="modal-header justify-between">
                  <span className="text-sm font-semibold">
                    瑕疵選択: {selected.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-outline text-xs"
                      onClick={() => setCamOpen(true)}
                    >
                      カメラ
                    </button>
                  </div>
                </div>
                <div className="divider" />

                <div>
                  <div className="section-title-accent mb-2">メイン瑕疵</div>
                  <div className="grid grid-cols-5 gap-3 md:gap-4">
                    {(selected.id === "front-glass"
                      ? ["G", "ヒビ", "ワレ"]
                      : ["A", "U", "B", "W", "XX"]
                    ).map((code) => (
                      <button
                        key={code}
                        className={`btn btn-full btn-primary text-xl py-4 min-h-12 active:translate-y-[1px] ${
                          pendingType === code ? "ring-4 ring-blue-400" : ""
                        }`}
                        onClick={() => {
                          if (!selected) return;
                          if (code === "XX" || selected.id === "front-glass") {
                            const added = toggleDefect(selected.id, { type: code });
                            setPendingType(null);
                            setLevel("");
                            setSelected(null);
                            if (added) {
                              setLevelOverlay(code);
                              setTimeout(() => setLevelOverlay(null), 1200);
                            }
                          } else {
                            setPendingType(code);
                            setLevel("");
                          }
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headerにカメラ/閉じるを移動済み */}

                {pendingType && pendingType !== "XX" && (
                  <div className="space-y-2">
                    <div className="panel-blue p-3">
                      <div className="text-xs text-blue-700 flex items-center gap-2">
                        <span className="text-blue-700">📱</span>
                        フリック入力（簡易）
                      </div>
                      <div className="text-[11px] text-blue-700 mt-1">
                        タップでレベルを選択（1/2/3）
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {["1", "2", "3"].map((lv) => (
                        <button
                          key={lv}
                          className={`btn text-base px-5 py-2.5 min-h-10 active:translate-y-[1px] ${
                            level === lv ? "btn-primary" : "btn-ghost"
                          }`}
                          onClick={() => {
                            if (!selected || !pendingType) return;
                            const added = toggleDefect(selected.id, {
                              type: pendingType,
                              level: lv,
                            });
                            setPendingType(null);
                            setLevel("");
                            setSelected(null);
                            if (added) {
                              setLevelOverlay(`${pendingType}${lv}`);
                              setTimeout(() => setLevelOverlay(null), 1000);
                            }
                          }}
                        >
                          レベル{lv}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="section-title-accent mb-2">その他の瑕疵</div>
                  <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {["Y1", "Y2", "C1", "C2", "S1"].map((code) => (
                      <button
                        key={code}
                        className={`btn btn-full btn-amber text-xs py-1.5 min-h-10 active:translate-y-[1px] ${
                          pendingType === code ? "ring-4 ring-amber-400" : ""
                        }`}
                        onClick={() => {
                          if (!selected) return;
                          const match = code.match(/^([A-Z]+)(\d)$/);
                          if (match) {
                            const [, t, lv] = match;
                            toggleDefect(selected.id, { type: t, level: lv });
                            setPendingType(null);
                            setLevel("");
                            setSelected(null);
                          } else {
                            setPendingType(code);
                            setLevel("");
                          }
                        }}
                      >
                        {code}
                      </button>
                    ))}
                    {["S2"].map((code) => (
                      <button
                        key={code}
                        className={`btn btn-full btn-amber text-xs py-1.5 min-h-10 active:translate-y-[1px] ${
                          pendingType === code ? "ring-4 ring-amber-400" : ""
                        }`}
                        onClick={() => {
                          if (!selected) return;
                          // Codes that embed level (e.g., Y1, Y2, C1, C2) should add immediately
                          const match = code.match(/^([A-Z]+)(\d)$/);
                          if (match) {
                            const [, t, lv] = match;
                            toggleDefect(selected.id, { type: t, level: lv });
                            setPendingType(null);
                            setLevel("");
                            setSelected(null);
                          } else {
                            // Codes without level (e.g., S) behave like main type awaiting level if applicable
                            setPendingType(code);
                            setLevel("");
                          }
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {levelOverlay && <LevelOverlay text={levelOverlay} />}

        {camOpen && selected && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 no-print">
            <div className="bg-white rounded-xl shadow-xl w-[92%] max-w-md p-4 space-y-3">
              <div className="text-sm font-semibold">
                部位撮影: {selected.name}
              </div>
              <Webcam
                ref={webcamRef as any}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full aspect-4/3 object-cover rounded-lg border"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setCamOpen(false)}
                >
                  キャンセル
                </button>
                <button className="btn btn-primary" onClick={capturePhoto}>
                  撮影して添付
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 選択後に瑕疵レベルのみ大きく表示するオーバーレイ
// ルート要素内で描画（コンポーネントの末尾に追記）
export function LevelOverlay({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-100 pointer-events-none flex items-center justify-center no-print">
      <div className="bg-black/70 text-white rounded-2xl px-8 py-6 text-4xl font-bold shadow-2xl overlay-pop">
        {text}
      </div>
    </div>
  );
}

export default CarPartSelector;
