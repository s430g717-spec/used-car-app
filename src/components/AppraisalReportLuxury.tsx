/** @jsxImportSource react */
import React, { useState } from "react";
import ResolvedImg from "./ResolvedImg";
import TouchImageViewer from "./TouchImageViewer";
import { DIAGRAM_SRC, parts as diagramParts } from "../lib/parts";

// 必要なpropsを定義（元のコードから推測）
interface AppraisalReportLuxuryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: any; // EvaluationScore型を想定
  partDefects?: Array<{
    partId: string;
    list: Array<{ type: string; level?: string }>;
  }>;
  brandLogoUrl?: string;
  brandColor?: string; // 例: "#f97316"
}

// 名前付きエクスポートを使用
export function AppraisalReportLuxury({
  open,
  onOpenChange,
  evaluation,
  partDefects,
  brandLogoUrl,
  brandColor,
}: AppraisalReportLuxuryProps) {
  if (!open || !evaluation) return null;

  const close = () => onOpenChange(false);

  const overallScale = ["R", "1", "2", "3", "3.5", "4", "4.5", "5", "6", "S"];
  const interiorScale = ["A", "B", "C", "D", "E"];
  const overall = String(evaluation.overallScore ?? "-");
  const interior = String(evaluation.interiorScore ?? "-");
  const car = evaluation.carData ?? {};

  const accent = brandColor ?? "#f97316"; // デフォルトアクセント色

  // 部位IDのエイリアス正規化（旧ID→新ID）
  const normalizePartId = (id: string) => {
    const map: Record<string, string> = {
      front_bumper: "front-bumper",
      rear_bumper: "rear-bumper",
      left_front_door: "left-f-door",
      right_front_door: "right-f-door",
      left_rear_door: "left-r-door",
      right_rear_door: "right-r-door",
      left_fender: "left-fender",
      right_fender: "right-fender",
      rear_gate: "rear-gate",
      gate: "rear-gate",
      front_glass: "front-glass",
    };
    return map[id] ?? id;
  };

  // カラーNo簡易スウォッチ（代表色のみ目安）
  const colorSwatchHex = (() => {
    const code = String((car as any).colorNo ?? "")
      .trim()
      .toUpperCase();
    const palette: Record<string, string> = {
      "070": "#f7f7f5",
      "202": "#0a0a0a",
      "040": "#ffffff",
      "1F7": "#b7b7b7",
      "3R3": "#9e1b32",
      "4T3": "#8a6a3c",
      "8W7": "#4b6b8a",
    };
    return palette[code];
  })();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print-root print-container">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-215 overflow-hidden print-area">
        {/* ヘッダー */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {brandLogoUrl ? (
                <img
                  src={brandLogoUrl}
                  alt="brand"
                  className="w-16 h-10 object-contain"
                  style={{ filter: "contrast(1.05)" }}
                />
              ) : (
                <div
                  className="w-14 h-10 rounded-md"
                  style={{ backgroundColor: accent }}
                />
              )}
              <h1 className="text-2xl font-bold tracking-wide text-slate-900">
                車両状態鑑定書
              </h1>
            </div>
            <button className="btn btn-ghost" onClick={close}>
              閉じる
            </button>
          </div>
        </div>

        {/* 本文レイアウト */}
        <div className="grid grid-cols-12 gap-5 p-6 report-block">
          {/* 左：車両画像＋ブランド */}
          <div className="col-span-5 space-y-3">
            <div className="bg-slate-100 aspect-4/3 rounded-md overflow-hidden flex items-center justify-center text-slate-400">
              {car.carImage ? (
                <ResolvedImg
                  src={car.carImage}
                  alt="car"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>車両画像</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 h-6 w-12 rounded" />
              <div className="bg-orange-500 h-6 w-24 rounded" />
            </div>
          </div>

          {/* 右上：評価点ボックス */}
          <div className="col-span-7 grid grid-cols-2 gap-4">
            {/* 車両評価点 */}
            <div className="rounded-md overflow-hidden border">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                車両評価点
              </div>
              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full w-20 h-20 flex items-center justify-center font-bold text-4xl border-4 border-slate-900">
                    {overall}
                  </div>
                  <div className="text-sm text-slate-600">点</div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {overallScale.map((s) => {
                    const isActive = s === overall;
                    const tone = isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600";
                    // しきい値色分け（目安）
                    const accent = isActive
                      ? overall === "S"
                        ? "ring-2 ring-amber-400"
                        : parseFloat(overall) >= 4.5
                        ? "ring-2 ring-emerald-400"
                        : parseFloat(overall) >= 4
                        ? "ring-2 ring-blue-400"
                        : overall === "R"
                        ? "ring-2 ring-red-400"
                        : "ring-2 ring-slate-300"
                      : "";
                    return (
                      <div
                        key={s}
                        className={`px-1.5 py-0.5 text-[10px] rounded ${tone} ${accent}`}
                      >
                        {s}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 内装評価点 */}
            <div className="rounded-md overflow-hidden border">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                内装評価点
              </div>
              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full w-20 h-20 flex items-center justify-center font-bold text-4xl border-4 border-slate-900">
                    {interior}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {interiorScale.map((s) => {
                    const isActive = s === interior;
                    const tone = isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600";
                    const accent = isActive
                      ? interior === "A"
                        ? "ring-2 ring-emerald-400"
                        : interior === "B"
                        ? "ring-2 ring-blue-400"
                        : interior === "C"
                        ? "ring-2 ring-amber-400"
                        : interior === "D" || interior === "E"
                        ? "ring-2 ring-red-400"
                        : "ring-2 ring-slate-300"
                      : "";
                    return (
                      <div
                        key={s}
                        className={`px-1.5 py-0.5 text-[10px] rounded ${tone} ${accent}`}
                      >
                        {s}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 修復歴 */}
            <div className="col-span-2 rounded-md overflow-hidden border">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                修復歴
              </div>
              <div className="px-3 py-2">
                <div className="text-2xl font-bold tracking-wide">無し</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  【修復とは】骨格部位の溶接等を伴う修理が施された状態を指します。
                </div>
              </div>
            </div>
          </div>

          {/* 下段：車名・年式・型式など／展開図／特記事項 */}
          <div className="col-span-12 grid grid-cols-12 gap-5 pt-2">
            {/* 車両情報 */}
            <div className="col-span-6 rounded-md overflow-hidden border report-block">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                車両情報
              </div>
              <div className="p-0">
                <div className="info-table text-sm">
                  <div className="row">
                    <div className="cell head">車名</div>
                    <div className="cell val">{car.model ?? "-"}</div>
                    <div className="cell head">年式</div>
                    <div className="cell val">{car.year ?? "-"}</div>
                  </div>
                  <div className="row">
                    <div className="cell head">型式</div>
                    <div className="cell val">{car.modelType ?? "-"}</div>
                    <div className="cell head">走行距離</div>
                    <div className="cell val">{car.mileage ?? "-"} km</div>
                  </div>
                  <div className="row">
                    <div className="cell head">VIN</div>
                    <div className="cell val" style={{ gridColumn: "span 3" }}>
                      {car.vin ?? "-"}
                    </div>
                  </div>
                  <div className="row">
                    <div className="cell head">グレード</div>
                    <div className="cell val">{evaluation.grade ?? "-"}</div>
                    <div className="cell head">カラーNo</div>
                    <div className="cell val flex items-center gap-2">
                      <span>{(car as any).colorNo ?? "-"}</span>
                      {colorSwatchHex && (
                        <span
                          className="inline-block w-5 h-5 rounded border"
                          style={{ backgroundColor: colorSwatchHex }}
                          aria-label="color swatch"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {Array.isArray((car as any).equipment) &&
                  (car as any).equipment.length > 0 && (
                    <div className="px-3 pb-3">
                      <div className="mt-2 text-xs font-medium text-slate-700">
                        装備
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(car as any).equipment.map((eq: string) => (
                          <span
                            key={eq}
                            className="px-2 py-0.5 text-xs rounded border bg-slate-50 text-slate-700"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* 展開図（ダミー） */}
            <div className="col-span-3 rounded-md overflow-hidden border report-block">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                展開図
              </div>
              <div className="p-3">
                <svg viewBox="0 0 100 100" className="w-full h-auto">
                  <image
                    href={DIAGRAM_SRC}
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                  />
                  {(partDefects ?? []).map((pd) => {
                    const partId = normalizePartId(pd.partId);
                    const part = diagramParts.find((p) => p.id === partId);
                    if (!part || pd.list.length === 0) return null;
                    const items = pd.list
                      .slice(0, 2)
                      .map((d) => (d.level ? `${d.type}${d.level}` : d.type));
                    const cx = part.x + part.w / 2;
                    let cy = part.y + part.h / 2;
                    if (part.id.includes("roof")) {
                      cy = Math.max(3, cy - 6); // ルーフはやや上に寄せる
                    }
                    return (
                      <text
                        key={pd.partId}
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        fontSize={3.2}
                        fill="#111827"
                      >
                        {items.map((t, i) => (
                          <tspan key={i} x={cx} dy={i === 0 ? 0 : 3.5}>
                            {t}
                          </tspan>
                        ))}
                        {Array.isArray((pd as any).photos) &&
                          (pd as any).photos.length > 0 && (
                            <tspan x={cx} dy={3.5}>
                              📷×{(pd as any).photos.length}
                            </tspan>
                          )}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* 特記事項 */}
            <div className="col-span-3 rounded-md overflow-hidden border report-block">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                特記事項
              </div>
              <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap">
                {car.inspectorComments?.join("\n") ?? "特記事項なし"}
              </div>
            </div>
          </div>

          {/* 部位写真ギャラリー（ある場合のみ表示） */}
          {Array.isArray(partDefects) &&
            partDefects.some(
              (pd: any) => Array.isArray(pd.photos) && pd.photos.length > 0
            ) && (
              <div className="col-span-12 rounded-md overflow-hidden border report-block">
                <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                  部位写真
                </div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {partDefects.flatMap((pd: any) => {
                    const partId = normalizePartId(pd.partId);
                    const part = diagramParts.find((p) => p.id === partId);
                    const title = part?.name ?? pd.partId;
                    const photos = Array.isArray(pd.photos) ? pd.photos : [];
                    return photos
                      .slice(0, 4)
                      .map((src: string, idx: number) => (
                        <PhotoThumb
                          key={`${pd.partId}-${idx}`}
                          title={title}
                          src={src}
                        />
                      ));
                  })}
                </div>
              </div>
            )}

          {/* 監査員・注意事項 */}
          <div className="col-span-12 grid grid-cols-12 gap-5 pt-1">
            <div className="col-span-7 rounded-md overflow-hidden border">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                この車両を担当した鑑定士
              </div>
              <div className="p-3 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2">
                  <div className="bg-slate-200 rounded-md w-16 h-16" />
                </div>
                <div className="col-span-10 text-xs text-slate-700">
                  所属拠点: - / 氏名: - / 資格: -
                </div>
              </div>
            </div>
            <div className="col-span-5 rounded-md overflow-hidden border">
              <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
                鑑定書について
              </div>
              <div className="p-3 text-[11px] text-slate-700 leading-relaxed">
                本鑑定書は、当社独自の評価基準を示すものであり、法的効力を保証するものではありません。車両状態の詳細は店舗へお問い合わせください。
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <button className="btn btn-ghost" onClick={close}>
            閉じる
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            印刷 / PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoThumb({ title, src }: { title: string; src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-600">{title}</div>
      <button className="block" onClick={() => setOpen(true)}>
        <ResolvedImg
          src={src}
          alt={title}
          className="w-full aspect-4/3 object-cover rounded-lg border"
        />
      </button>
      {open && (
        <TouchImageViewer
          src={src}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
