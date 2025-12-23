// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { loadInventory, upsertItem } from "../lib/inventoryStore";
import {
  deleteImage,
  listImageRecords,
  saveImageFromDataUrl,
} from "../lib/idb";

export default function ImageStorageToolsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [records, setRecords] = useState<
    Array<{ id: number; dataUrl: string }>
  >([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInventory(loadInventory());
    listImageRecords()
      .then(setRecords)
      .catch(() => setRecords([]));
  }, [open]);

  const referencedIds = useMemo(() => {
    const ids = new Set<string>();
    inventory.forEach((item) => {
      const carImg = item.evaluation?.carData?.carImage;
      if (typeof carImg === "string" && carImg.startsWith("idb:")) {
        ids.add(carImg.slice(4));
      }
      const pds = (item.partDefects || []) as Array<{ photos?: string[] }>;
      pds.forEach((pd) => {
        (pd.photos || []).forEach((p) => {
          if (typeof p === "string" && p.startsWith("idb:")) {
            ids.add(p.slice(4));
          }
        });
      });
      const docs = (item.documents || []) as Array<{ images?: string[] }>;
      docs.forEach((d) => {
        (d.images || []).forEach((p) => {
          if (typeof p === "string" && p.startsWith("idb:")) {
            ids.add(p.slice(4));
          }
        });
      });
    });
    return ids;
  }, [inventory]);

  const unreferenced = useMemo(() => {
    const ref = referencedIds;
    return records.filter((r) => !ref.has(String(r.id)));
  }, [records, referencedIds]);

  const migrateBase64ToIDB = async () => {
    setBusy(true);
    try {
      const updated: any[] = [];
      for (const item of inventory) {
        let changed = false;
        const next = { ...item };
        const carImg = next.evaluation?.carData?.carImage;
        if (typeof carImg === "string" && carImg.startsWith("data:")) {
          try {
            const id = await saveImageFromDataUrl(carImg);
            next.evaluation = {
              ...(next.evaluation || {}),
              carData: {
                ...(next.evaluation?.carData || {}),
                carImage: `idb:${id}`,
              },
            };
            changed = true;
          } catch {}
        }
        const pds = (next.partDefects || []) as Array<{ photos?: string[] }>;
        const pdsNew = pds.map((pd) => {
          const photos = (pd.photos || []).map((p) => {
            if (typeof p === "string" && p.startsWith("data:")) {
              return null as any;
            }
            return p;
          });
          return { ...pd, photos };
        });
        // save photos one-by-one (avoid memory pressure)
        for (let i = 0; i < pds.length; i++) {
          const pd = pds[i];
          if (!Array.isArray(pd.photos)) continue;
          for (let j = 0; j < pd.photos.length; j++) {
            const p = pd.photos[j];
            if (typeof p === "string" && p.startsWith("data:")) {
              try {
                const id = await saveImageFromDataUrl(p);
                pdsNew[i].photos![j] = `idb:${id}`;
                changed = true;
              } catch {}
            }
          }
        }
        next.partDefects = pdsNew;
        const docs = (next.documents || []) as Array<{ images?: string[] }>;
        const docsNew = docs.map((d) => ({ ...d }));
        for (let i = 0; i < docsNew.length; i++) {
          const imgs = docsNew[i].images || [];
          for (let j = 0; j < imgs.length; j++) {
            const p = imgs[j];
            if (typeof p === "string" && p.startsWith("data:")) {
              try {
                const id = await saveImageFromDataUrl(p);
                imgs[j] = `idb:${id}`;
                changed = true;
              } catch {}
            }
          }
          docsNew[i].images = imgs;
        }
        next.documents = docsNew;
        if (changed) {
          upsertItem(next);
          updated.push(next.id);
        }
      }
      alert(`移行完了: 更新 ${updated.length} 件`);
      setInventory(loadInventory());
      setRecords(await listImageRecords());
    } finally {
      setBusy(false);
    }
  };

  const deleteUnreferenced = async () => {
    if (!confirm(`未参照 ${unreferenced.length} 件を削除しますか？`)) return;
    setBusy(true);
    try {
      for (const r of unreferenced) {
        try {
          await deleteImage(r.id);
        } catch {}
      }
      alert(`削除完了: ${unreferenced.length} 件`);
      setRecords(await listImageRecords());
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">画像ストレージ管理</div>
          <button className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            閉じる
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-md border p-4">
            <div className="text-sm text-slate-700">IndexedDB状況</div>
            <div className="mt-2 text-sm text-slate-600">
              総保存枚数: {records.length}
            </div>
            <div className="text-sm text-slate-600">
              参照中枚数: {referencedIds.size}
            </div>
            <div className="text-sm text-slate-600">
              未参照枚数: {unreferenced.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={migrateBase64ToIDB}
            >
              Base64 → IndexedDBへ移行
            </button>
            <button
              className="btn btn-outline"
              disabled={busy || unreferenced.length === 0}
              onClick={deleteUnreferenced}
            >
              未参照画像を削除
            </button>
          </div>
          <div className="text-xs text-slate-500">
            ※ 操作は端末ローカルのIndexedDBに対して実行されます。
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
