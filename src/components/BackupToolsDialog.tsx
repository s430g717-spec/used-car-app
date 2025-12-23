// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import {
  loadInventory,
  saveInventory,
  upsertItem,
} from "../lib/inventoryStore";
import { listImageRecords, saveImageFromDataUrl } from "../lib/idb";

interface BackupPayload {
  version: string;
  exportedAt: string;
  inventory: any[];
  idbImages: Array<{ id: number; dataUrl: string }>;
}

export default function BackupToolsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [clearBeforeRestore, setClearBeforeRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  const exportAll = async () => {
    setBusy(true);
    try {
      const payload: BackupPayload = {
        version: "ucev-backup-v1",
        exportedAt: new Date().toISOString(),
        inventory: loadInventory(),
        idbImages: await listImageRecords(),
      };
      const data = JSON.stringify(payload, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ucev-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const openFile = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      if (!payload || !Array.isArray(payload.inventory)) {
        alert("不正なバックアップファイルです");
        return;
      }
      const imageMap = new Map<number, number>(); // oldId -> newId
      if (Array.isArray(payload.idbImages)) {
        for (const rec of payload.idbImages) {
          try {
            const newId = Number(await saveImageFromDataUrl(rec.dataUrl));
            imageMap.set(Number(rec.id), newId);
          } catch {}
        }
      }
      // remap idb references in inventory
      const remapIdbRef = (val: any): any => {
        if (typeof val === "string" && val.startsWith("idb:")) {
          const oldId = Number(val.slice(4));
          const newId = imageMap.get(oldId);
          return newId ? `idb:${newId}` : val;
        }
        return val;
      };
      const newItems = (payload.inventory || []).map((item) => {
        const next = JSON.parse(JSON.stringify(item));
        const carImg = next?.evaluation?.carData?.carImage;
        next.evaluation = next.evaluation || {};
        next.evaluation.carData = next.evaluation.carData || {};
        next.evaluation.carData.carImage = remapIdbRef(carImg);
        const pds = (next.partDefects || []).map((pd: any) => ({
          ...pd,
          photos: Array.isArray(pd.photos)
            ? pd.photos.map(remapIdbRef)
            : pd.photos,
        }));
        next.partDefects = pds;
        const docs = (next.documents || []).map((d: any) => ({
          ...d,
          images: Array.isArray(d.images)
            ? d.images.map(remapIdbRef)
            : d.images,
        }));
        next.documents = docs;
        return next;
      });
      if (clearBeforeRestore) saveInventory([]);
      newItems.forEach((it) => upsertItem(it));
      alert(`復元完了: ${newItems.length} 件`);
      onOpenChange(false);
    } catch (err) {
      alert("復元に失敗しました");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">
            バックアップ / 復元
          </div>
          <button className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            閉じる
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={exportAll}
            >
              バックアップ作成（JSONダウンロード）
            </button>
            <button
              className="btn btn-outline"
              disabled={busy}
              onClick={openFile}
            >
              バックアップから復元
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={clearBeforeRestore}
              onChange={(e) => setClearBeforeRestore(e.target.checked)}
            />
            復元前に既存在庫を削除する
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="text-xs text-slate-500">
            ※ 端末ローカルに保存されるデータ（在庫と画像）をまとめてバックアップ
            / 復元します。
          </div>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end">
          <button className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
