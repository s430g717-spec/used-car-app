// @ts-nocheck
/** @jsxImportSource react */
import { useMemo } from "react";
import { parts as diagramParts } from "../lib/parts";
import ResolvedImg from "./ResolvedImg";

export default function AppraisalReport({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any | null;
}) {
  if (!open || !item) return null;
  const close = () => onOpenChange(false);
  const printNow = () => window.print();
  const car = item.evaluation?.carData ?? {};
  const defects = (item.partDefects ?? []) as Array<{
    partId: string;
    list: Array<{ type: string; level?: string }>;
    photos?: string[];
  }>;

  const grouped = useMemo(() => {
    const byPart: Record<
      string,
      { title: string; items: string[]; photos: string[] }
    > = {};
    defects.forEach((pd) => {
      const part = diagramParts.find((p) => p.id === pd.partId);
      const title = part?.name ?? pd.partId;
      const items = (pd.list || []).map((d) =>
        d.level ? `${d.type}${d.level}` : d.type
      );
      const photos = Array.isArray(pd.photos) ? pd.photos : [];
      byPart[pd.partId] = {
        title,
        items,
        photos,
      };
    });
    return byPart;
  }, [defects]);

  const totalRating = item.evaluation?.totalRating ?? "-";
  const interiorRating = item.evaluation?.interiorRating ?? "-";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-transparent">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[1000px] overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
        <style>{`
          @page { size: A4; margin: 12mm; }
          @media print {
            .appraisal-container { width: 210mm; max-width: 210mm; }
            .print-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 8mm; }
            .defect-photo { max-height: 50mm; object-fit: cover; }
            .no-print { display: none; }
          }
        `}</style>
        <div className="px-6 py-4 border-b flex items-center justify-between no-print">
          <div className="font-semibold text-slate-900">車両鑑定書</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={close}>
              閉じる
            </button>
            <button className="btn btn-primary" onClick={printNow}>
              印刷 / PDF
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5 appraisal-container">
          {/* ヘッダー */}
          <div className="print-section bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl p-6 shadow-lg print:rounded-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{car.model ?? "車両"}</div>
                <div className="text-lg mt-1 opacity-90">
                  {car.modelType ?? "-"} / {car.year ?? "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">鑑定日</div>
                <div className="text-base font-medium">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-xs mt-1 opacity-70">ID: {item.id}</div>
              </div>
            </div>
          </div>

          {/* 評価点と基本情報 */}
          <div className="print-section grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-600 mb-3">
                車両基本情報
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">車名:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {car.model ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">型式:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {car.modelType ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">年式:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {car.year ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">走行距離:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {car.mileage ?? "-"} km
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">車台番号:</span>
                  <span className="ml-2 font-medium text-slate-800 text-xs">
                    {car.vin ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">グレード:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {item.evaluation?.grade ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">カラーNo:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {(car as any).colorNo ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">保存先:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {item.evaluation?.saveTarget ?? "-"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-5 shadow-lg text-center">
                <div className="text-sm font-medium opacity-90">総合評価点</div>
                <div className="text-5xl font-bold mt-2">{totalRating}</div>
                <div className="text-xs mt-2 opacity-80">Total Rating</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg text-center">
                <div className="text-sm font-medium opacity-90">内装評価点</div>
                <div className="text-5xl font-bold mt-2">{interiorRating}</div>
                <div className="text-xs mt-2 opacity-80">Interior Rating</div>
              </div>
            </div>
          </div>

          {/* 装備 */}
          {Array.isArray((car as any).equipment) &&
            (car as any).equipment.length > 0 && (
              <div className="print-section bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-600 mb-3">
                  装備・オプション
                </div>
                <div className="flex flex-wrap gap-2">
                  {(car as any).equipment.map((eq: string) => (
                    <span
                      key={eq}
                      className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* 瑕疵詳細 */}
          <div className="print-section">
            <div className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b-2 border-emerald-600">
              瑕疵詳細 / Defect Details
            </div>
            {Object.keys(grouped).length === 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                瑕疵登録がありません。
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(grouped).map(([pid, info]) => (
                <div
                  key={pid}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-base font-bold text-slate-800">
                      {info.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {info.items.map((t, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-md text-sm font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {info.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {info.photos.slice(0, 8).map((src, idx) => (
                        <ResolvedImg
                          key={idx}
                          src={src}
                          alt={info.title}
                          className="w-full aspect-4/3 object-cover rounded-lg border-2 border-slate-200 defect-photo"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* フッター */}
          <div className="print-section text-center text-xs text-slate-500 pt-4 border-t">
            <div>
              本鑑定書は現状を記録したものであり、将来の性能を保証するものではありません。
            </div>
            <div className="mt-1">
              発行日: {new Date().toLocaleString()} | システム:
              中古車評価点自動算出システム
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
