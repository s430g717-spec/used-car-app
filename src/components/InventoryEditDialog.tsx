// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { upsertItem } from "../lib/inventoryStore";

export default function InventoryEditDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any | null;
}) {
  const [modelType, setModelType] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [mileage, setMileage] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [defectsJson, setDefectsJson] = useState("[]");

  useEffect(() => {
    if (!item) return;
    const cd = item.evaluation?.carData ?? {};
    setModelType(cd.modelType ?? "");
    setModel(cd.model ?? "");
    setYear(cd.year ?? new Date().getFullYear());
    setMileage(cd.mileage ?? 0);
    setComments((cd.inspectorComments ?? []).join("\n"));
    setDefectsJson(JSON.stringify(item.partDefects ?? [], null, 2));
  }, [item]);

  if (!open || !item) return null;

  const close = () => onOpenChange(false);
  const save = () => {
    let partDefects = [] as any[];
    try {
      const parsed = JSON.parse(defectsJson);
      if (Array.isArray(parsed)) partDefects = parsed;
    } catch {}
    const updated = {
      id: item.id,
      date: item.date ?? new Date().toISOString().slice(0, 10),
      evaluation: {
        ...(item.evaluation ?? {}),
        carData: {
          ...((item.evaluation ?? {}).carData ?? {}),
          modelType,
          model,
          year,
          mileage,
          inspectorComments: comments ? comments.split(/\n+/).slice(0, 12) : [],
        },
      },
      partDefects,
    };
    upsertItem(updated);
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">在庫編集</div>
          <button className="btn btn-ghost" onClick={close}>
            閉じる
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm flex flex-col gap-1">
              型式
              <input
                className="input"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              />
            </label>
            <label className="text-sm flex flex-col gap-1">
              車種
              <input
                className="input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </label>
            <label className="text-sm flex flex-col gap-1">
              年式
              <input
                className="input"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value || "0"))}
              />
            </label>
            <label className="text-sm flex flex-col gap-1">
              走行距離
              <input
                className="input"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(parseInt(e.target.value || "0"))}
              />
            </label>
          </div>
          <label className="text-sm flex flex-col gap-1">
            検査員報告（改行区切り）
            <textarea
              className="input min-h-24"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            瑕疵JSON（partDefects 配列）
            <textarea
              className="input min-h-40 font-mono text-xs"
              value={defectsJson}
              onChange={(e) => setDefectsJson(e.target.value)}
            />
          </label>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <button className="btn btn-ghost" onClick={close}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
