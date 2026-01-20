// @ts-nocheck
/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Info } from "lucide-react";
import { upsertItem, loadInventory } from "../lib/inventoryStore";
import { calculateFinalScore, QUICK_REFERENCE } from "../utils/evaluationLogic";

export default function EvaluationInput() {
  const [overallRating, setOverallRating] = useState<string>("");
  const [interiorRating, setInteriorRating] = useState<string>("A");
  const [inspectorNote, setInspectorNote] = useState<string>("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [targetId, setTargetId] = useState<string>("__new__");
  const [mileage, setMileage] = useState<string>("");

  useEffect(() => {
    setInventory(loadInventory());
  }, []);

  const finalScore = calculateFinalScore({
    mileageKm: Number(mileage) || 0,
    interiorRank: interiorRating as any,
    defects: [],
  });

  return (
    <div className="p-4">
      <div className="card p-4 space-y-4">
        <h2 className="text-lg font-semibold">評価入力</h2>

        {/* 走行距離と内外装ランク */}
        <div className="grid md:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label text-sm font-medium text-slate-700">
              走行距離 (km)
            </span>
            <input
              type="number"
              min={0}
              className="input"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="例: 50000"
              inputMode="numeric"
            />
          </label>

          <label className="form-control">
            <span className="label text-sm font-medium text-slate-700">
              内外装ランク
            </span>
            <select
              className="input"
              value={interiorRating}
              onChange={(e) => setInteriorRating(e.target.value)}
            >
              {["A", "B", "C", "D", "E"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="btn btn-ghost text-xs w-fit" title={QUICK_REFERENCE}>
          早見表 (距離上限)
        </button>

        {/* 評価点算出（参考値） */}
        <div className="section-card p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-800">
            評価点算出（参考値）
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
              <div className="text-xs">走行距離制限</div>
              <div className="text-lg font-bold">
                {finalScore.caps.distanceLabel} 点
              </div>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100">
              <div className="text-xs">内外装点</div>
              <div className="text-lg font-bold">
                {finalScore.caps.baseFromInterior.toFixed(1)} 点
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div className="text-sm opacity-80">総合評価点 (参考)</div>
            <div className="text-3xl font-bold">{finalScore.label}</div>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            {finalScore.reasons.map((r, i) => (
              <div key={i}>・{r}</div>
            ))}
          </div>
        </div>

        {/* 大きなプレビュー表示 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="panel-indigo p-4 text-center">
            <div className="text-xs text-indigo-700">総合評価</div>
            <div className="text-3xl font-bold text-indigo-800">
              {overallRating || "-"}
            </div>
          </div>
          <div className="panel-blue p-4 text-center">
            <div className="text-xs text-sky-700">内装補助評価</div>
            <div className="text-3xl font-bold text-sky-800">
              {interiorRating || "-"}
            </div>
          </div>
        </div>
        {/* 入力コントロール */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm flex flex-col gap-1">
            <span className="flex items-center gap-1">
              総合評価
              <span
                title="S: 新車相当 / 6: ほぼ新車 / 5: 極上 / 4.5: 非常に良好 / 4: 良好 / 3.5-3: 並 / R: 修復歴あり"
                className="inline-flex"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
              </span>
            </span>
            <select
              className="input min-h-11 rounded-xl"
              value={overallRating}
              onChange={(e) => setOverallRating(e.target.value)}
            >
              {["S", "6", "5", "4.5", "4", "3.5", "3", "R"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex flex-col gap-1">
            <span className="flex items-center gap-1">
              内装補助評価
              <span
                title="A: 非常に綺麗 / B: 良好 / C: 並 / D: 使用感あり / E: 要リフレッシュ"
                className="inline-flex"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
              </span>
            </span>
            <select
              className="input min-h-11 rounded-xl"
              value={interiorRating}
              onChange={(e) => setInteriorRating(e.target.value)}
            >
              {["A", "B", "C", "D", "E"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm flex flex-col gap-1">
          検査員報告（フリーワード）
          <textarea
            className="input min-h-24"
            placeholder="特記事項や補足を記入"
            value={inspectorNote}
            onChange={(e) => setInspectorNote(e.target.value)}
          />
        </label>

        {/* 保存先を下部へ移動 */}
        <label className="text-sm flex flex-col gap-1">
          保存先在庫
          <select
            className="input min-h-11 rounded-xl"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="__new__">新規作成</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.evaluation?.carData?.model || "未設定") +
                  " (" +
                  item.date +
                  ")"}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm">
            キャンセル
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              const now = new Date().toISOString().slice(0, 10);
              const comments = inspectorNote
                ? inspectorNote.split(/\n+/).slice(0, 12)
                : [];

              if (targetId !== "__new__") {
                const existing = inventory.find((i) => i.id === targetId);
                if (existing) {
                  const nextEvaluation = {
                    ...existing.evaluation,
                    referenceScore: 0,
                    overallScore: overallRating,
                    interiorScore: interiorRating,
                    breakdown: { age: 0, mileage: 0 },
                    grade: existing.evaluation?.grade ?? "",
                    timestamp: new Date().toISOString(),
                    carData: {
                      ...(existing.evaluation?.carData || {}),
                      overallScore: overallRating,
                      interiorScore: interiorRating,
                      inspectorComments: comments,
                    },
                  };
                  upsertItem({ ...existing, evaluation: nextEvaluation });
                  alert("評価を既存在庫に保存しました");
                  return;
                }
              }

              const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
              const evaluation = {
                referenceScore: 0,
                overallScore: overallRating,
                interiorScore: interiorRating,
                breakdown: { age: 0, mileage: 0 },
                grade: "",
                timestamp: new Date().toISOString(),
                carData: {
                  modelType: "",
                  model: "",
                  year: new Date().getFullYear(),
                  mileage: 0,
                  inspectorComments: comments,
                  maintenanceRecords: "",
                  overallScore: overallRating,
                  interiorScore: interiorRating,
                },
              };
              upsertItem({ id, date: now, evaluation, partDefects: [] });
              alert("評価を新規在庫として保存しました");
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
