import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  loadInventory,
  removeItem,
  type InventoryItem,
} from "../lib/inventoryStore";

type Item = {
  id: string;
  date: string; // 登録日
  carName: string;
  vinLast4: string;
  evaluation?: {
    referenceScore: number;
    overallScore: string;
    interiorScore: string;
    breakdown: { age: number; mileage: number };
    grade: string;
    timestamp: string;
    carData: {
      modelType: string;
      model: string;
      year: number;
      mileage: number;
      inspectorComments: string[];
      maintenanceRecords: string;
      carImage?: string;
      overallScore?: string;
      interiorScore?: string;
    };
  };
  partDefects?: Array<{
    partId: string;
    list: Array<{ type: string; level?: string }>;
  }>;
};

export default function InventoryList({
  onViewReport,
  onViewInvoice,
  onEdit,
  onApplyDefects,
  onViewDetail,
}: {
  onViewReport?: (item: Item) => void;
  onViewInvoice?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onApplyDefects?: (id: string) => void;
  onViewDetail?: (item: Item) => void;
}) {
  const [items, setItems] = useState<Item[]>([
    {
      id: "1",
      date: "2025-12-10",
      carName: "プリウス",
      vinLast4: "1234",
      evaluation: {
        referenceScore: 4.5,
        overallScore: "4.5",
        interiorScore: "B",
        breakdown: { age: 2, mileage: 1 },
        grade: "G",
        timestamp: new Date().toISOString(),
        carData: {
          modelType: "DAA-ZVW50",
          model: "プリウス",
          year: 2018,
          mileage: 48000,
          inspectorComments: ["内外装小", "小傷あり", "機関良好"],
          maintenanceRecords: "定期点検記録簿あり",
          overallScore: "4.5",
          interiorScore: "B",
        },
      },
      partDefects: [
        { partId: "front_bumper", list: [{ type: "A", level: "1" }] },
        { partId: "left_front_door", list: [{ type: "U", level: "2" }] },
        { partId: "roof", list: [{ type: "W" }] },
      ],
    },
    {
      id: "2",
      date: "2025-12-09",
      carName: "ミニ",
      vinLast4: "5678",
      evaluation: {
        referenceScore: 4,
        overallScore: "4",
        interiorScore: "A",
        breakdown: { age: 3, mileage: 2 },
        grade: "クーパー",
        timestamp: new Date().toISOString(),
        carData: {
          modelType: "DBA-XM12",
          model: "ミニ",
          year: 2017,
          mileage: 62000,
          inspectorComments: ["外装磨き済", "内装きれい"],
          maintenanceRecords: "記録簿あり",
          overallScore: "4",
          interiorScore: "A",
        },
      },
      partDefects: [
        {
          partId: "right_rear_door",
          list: [{ type: "B" }, { type: "Y", level: "1" }],
        },
        { partId: "rear_bumper", list: [{ type: "A", level: "2" }] },
      ],
    },
  ]);

  // merge persisted inventory
  useEffect(() => {
    const persisted: InventoryItem[] = loadInventory();
    if (persisted.length) {
      const merged = [
        ...persisted.map(
          (p) =>
            ({
              id: p.id,
              date: p.date,
              carName: p.evaluation?.carData?.model ?? "-",
              vinLast4: "----",
              evaluation: p.evaluation,
              partDefects: p.partDefects,
            } as Item)
        ),
        ...items,
      ];
      setItems(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [query, setQuery] = useState<string>("");

  const filtered = items
    .filter((it) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        it.carName.toLowerCase().includes(q) ||
        it.vinLast4.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // 登録日降順

  const issueInvoice = (item: Item) => {
    alert(`${item.carName} の請求書を作成しました（¥2,200）`);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    removeItem(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          className="input flex-1"
          placeholder="車名・VIN下4桁で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.map((it) => (
        <div
          key={it.id}
          className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="font-medium">{it.date}</div>
            <div className="text-slate-600 text-sm">
              {it.carName}（VIN下4桁: {it.vinLast4}）
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                onViewReport ? onViewReport(it) : alert("証明書を出力しました")
              }
            >
              証明書出力
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onViewDetail ? onViewDetail(it) : alert("詳細表示を開きました")
              }
            >
              詳細
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onApplyDefects
                  ? onApplyDefects(it.id)
                  : alert("現在の瑕疵をこの在庫へ反映しました")
              }
            >
              瑕疵を反映
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onEdit ? onEdit(it) : alert("編集画面を開きました")
              }
            >
              編集
            </Button>
            <Button variant="destructive" onClick={() => deleteItem(it.id)}>
              削除
            </Button>
            <Button
              variant="default"
              onClick={() =>
                onViewInvoice ? onViewInvoice(it) : issueInvoice(it)
              }
            >
              請求書作成（¥2,200）
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
