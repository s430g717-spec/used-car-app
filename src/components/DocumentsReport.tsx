// @ts-nocheck
/** @jsxImportSource react */
import ResolvedImg from "./ResolvedImg";

export default function DocumentsReport({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any | null;
}) {
  if (!open || !item) return null;
  const car = item.evaluation?.carData ?? {};
  const docs = Array.isArray(item.documents) ? item.documents : [];
  const close = () => onOpenChange(false);
  const printNow = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-transparent">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[920px] overflow-hidden print:shadow-none print:rounded-none">
        <style>{`
          @page { size: A4; margin: 12mm; }
          @media print {
            .report-container { width: 210mm; max-width: 210mm; }
            .doc-page { break-inside: avoid; page-break-inside: avoid; margin-bottom: 10mm; }
            .doc-img { max-height: 65mm; object-fit: cover; }
          }
        `}</style>
        <div className="px-6 py-4 border-b flex items-center justify-between print:hidden">
          <div className="font-semibold text-slate-900">
            書類チェックレポート
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={close}>
              閉じる
            </button>
            <button className="btn btn-primary" onClick={printNow}>
              印刷 / PDF
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4 report-container">
          {/* ヘッダー情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-slate-600">車両</div>
              <div className="text-sm font-medium text-slate-900">
                {(car.model ?? "-") + " / " + (car.modelType ?? "-")}
              </div>
              <div className="text-sm text-slate-800">
                {(car.year ?? "-") + " / " + (car.mileage ?? "-") + " km"}
              </div>
              <div className="text-xs text-slate-600">
                VIN: {car.vin ?? "-"}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-slate-600">出力日</div>
              <div className="text-sm text-slate-900">
                {new Date().toLocaleString()}
              </div>
              <div className="text-xs text-slate-600">在庫ID: {item.id}</div>
            </div>
          </div>

          {/* 書類一覧 */}
          <div className="rounded-md border">
            <div className="section-title bg-slate-900 text-white text-xs px-3 py-1.5">
              必要書類一覧
            </div>
            <div className="p-3 grid grid-cols-1 gap-3">
              {docs.length === 0 && (
                <div className="text-slate-500 text-sm">
                  登録された書類はありません。
                </div>
              )}
              {docs.map((d: any, i: number) => (
                <div key={i} className="rounded-lg border p-3 doc-page">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-800">
                      {d.type || d.key || "書類"}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                      {d.status || "未設定"}
                    </div>
                  </div>
                  {d.note && (
                    <div className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">
                      {d.note}
                    </div>
                  )}
                  {Array.isArray(d.images) && d.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {d.images.slice(0, 8).map((src: string, idx: number) => (
                        <ResolvedImg
                          key={idx}
                          src={src}
                          alt={d.type || "doc"}
                          className="w-full aspect-4/3 object-cover rounded-md border doc-img"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
