import React from "react";
import { EvaluationScore } from "../App"; // App.tsxの型定義をインポートすると仮定

// 必要なpropsを定義
interface InvoiceReportProfessionalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null; // EvaluationScore型を想定
}

// 名前付きエクスポートを使用
export function InvoiceReportProfessional({
  open,
  onOpenChange,
  evaluation,
}: InvoiceReportProfessionalProps) {
  if (!open || !evaluation) return null;

  const fee = 2200;
  const close = () => onOpenChange(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print-root">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden print-area">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">請求書</div>
          <button className="btn btn-ghost" onClick={close}>
            閉じる
          </button>
        </div>
        <div className="p-6 space-y-4 report-block">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">車名</div>
              <div className="font-medium">
                {evaluation.carData?.model ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">年式</div>
              <div className="font-medium">
                {evaluation.carData?.year ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">型式</div>
              <div className="font-medium">
                {evaluation.carData?.modelType ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">走行距離</div>
              <div className="font-medium">
                {evaluation.carData?.mileage ?? "-"}
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4 report-block">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">鑑定書作成費</div>
              <div className="text-lg font-bold">¥{fee.toLocaleString()}</div>
            </div>
          </div>
        </div>
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
