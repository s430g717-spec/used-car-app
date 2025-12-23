// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { loadInventory, upsertItem } from "../lib/inventoryStore";
import { Button } from "./ui/button";
import { saveImageFromDataUrl } from "../lib/idb";
import ResolvedImg from "./ResolvedImg";

const DEFAULT_DOCS = [
  { key: "registration", label: "車検証" },
  { key: "liability", label: "自賠責保険証" },
  { key: "recycle", label: "リサイクル券" },
  { key: "maintenance", label: "点検整備記録簿" },
  { key: "manual", label: "取扱説明書" },
  { key: "warranty", label: "保証書" },
];

export default function DocumentChecklist() {
  const [targetId, setTargetId] = useState<string>("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [docs, setDocs] = useState<
    Record<string, { obtained: boolean; images: string[]; note: string }>
  >({});
  const [camDocKey, setCamDocKey] = useState<string | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  useEffect(() => {
    setInventory(loadInventory());
    const initial: any = {};
    DEFAULT_DOCS.forEach(
      (d) => (initial[d.key] = { obtained: false, images: [], note: "" })
    );
    setDocs(initial);
  }, []);

  const openCam = (key: string) => setCamDocKey(key);
  const closeCam = () => setCamDocKey(null);

  const capture = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot || !camDocKey) return;
    const img = new Image();
    img.onload = async () => {
      const maxW = 1400;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", 0.85);
      let ref = out;
      try {
        const id = await saveImageFromDataUrl(out);
        ref = `idb:${id}`;
      } catch {}
      setDocs((prev) => {
        const cur = prev[camDocKey!];
        return {
          ...prev,
          [camDocKey!]: { ...cur, images: [...cur.images, ref] },
        };
      });
      closeCam();
    };
    img.src = shot;
  };

  const save = () => {
    if (!targetId) {
      alert("保存先在庫を選択してください");
      return;
    }
    const found = inventory.find((i) => i.id === targetId);
    if (!found) {
      alert("在庫が見つかりません");
      return;
    }
    const toPersist = DEFAULT_DOCS.map((d) => ({
      type: d.label,
      key: d.key,
      status: docs[d.key]?.obtained ? "取得済" : "未取得",
      images: docs[d.key]?.images ?? [],
      note: docs[d.key]?.note ?? "",
    }));
    upsertItem({ ...found, documents: toPersist });
    alert("必要書類を保存しました");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">必要書類チェック</h2>
      <p className="text-sm text-slate-600">
        スマホで撮影して在庫へ保存できます
      </p>

      <label className="form-control">
        <span className="label text-sm font-medium text-slate-700">
          保存先在庫
        </span>
        <select
          className="input min-h-11 rounded-xl"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        >
          <option value="">選択してください</option>
          {inventory.map((it) => (
            <option key={it.id} value={it.id}>
              {(it.evaluation?.carData?.model || "未設定") +
                " (" +
                it.date +
                ")"}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3">
        {DEFAULT_DOCS.map((d) => {
          const cur = docs[d.key];
          return (
            <div key={d.key} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-800">
                  {d.label}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cur?.obtained ?? false}
                    onChange={(e) =>
                      setDocs((prev) => ({
                        ...prev,
                        [d.key]: { ...prev[d.key], obtained: e.target.checked },
                      }))
                    }
                  />
                  取得済
                </label>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(cur?.images ?? []).map((src, i) => (
                  <ResolvedImg
                    key={i}
                    src={src}
                    alt={d.label}
                    className="w-full aspect-4/3 object-cover rounded-lg border"
                  />
                ))}
                <button
                  className="btn btn-outline"
                  onClick={() => openCam(d.key)}
                >
                  撮影
                </button>
              </div>
              <label className="block mt-2 text-sm">
                備考
                <textarea
                  className="input min-h-24 mt-1"
                  value={cur?.note ?? ""}
                  onChange={(e) =>
                    setDocs((prev) => ({
                      ...prev,
                      [d.key]: { ...prev[d.key], note: e.target.value },
                    }))
                  }
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          variant="default"
          onClick={save}
          className="min-h-11 rounded-xl px-4"
        >
          保存
        </Button>
      </div>

      {camDocKey && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-xl w-[92%] max-w-md p-4 space-y-3">
            <div className="text-sm font-semibold">
              撮影: {DEFAULT_DOCS.find((x) => x.key === camDocKey)?.label}
            </div>
            <Webcam
              ref={webcamRef as any}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full aspect-4/3 object-cover rounded-lg border"
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={closeCam}>
                キャンセル
              </button>
              <button className="btn btn-primary" onClick={capture}>
                撮影して追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
