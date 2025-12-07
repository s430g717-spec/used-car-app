import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calculator, AlertCircle } from "lucide-react";
import { DefectInputDialog, Defect } from "./DefectInputDialog";
import { EvaluationScoreDialog } from "./EvaluationScoreDialog";
// import carDiagram from 'figma:asset/894aee2d921dc83a71b03e37d1d9ad84db115cae.png';

const carDiagram = "/car_diagram_v3.png";

interface CarPart {
  id: string;
  name: string;
  label: string;
  area: { x: number; y: number; width: number; height: number };
  labelPosition: { x: number; y: number };
}

// Restore the parent div and adjust carParts y coordinates by -55
const carParts: CarPart[] = [
  // 1. Fバンパー（最上部）
  {
    id: "front-bumper",
    name: "Fバンパー",
    label: "FB",
    area: { x: 33, y: 10, width: 32, height: 6 }, // y: 10 - 55 = -45
    labelPosition: { x: 50, y: -47 }, // labelPosition.y: 8 - 55 = -47
  },

  // 2. ボンネット（中央上部）
  {
    id: "hood",
    name: "ボンネット",
    label: "HD",
    area: { x: 33, y: 17, width: 32, height: 13 }, // y: 17 - 55 = -38
    labelPosition: { x: 50, y: -30 }, // labelPosition.y: 25 - 55 = -30
  },

  // 3. Fガラス（フロントガラス）
  {
    id: "front-glass",
    name: "Fガラス",
    label: "FG",
    area: { x: 34, y: -28, width: 31, height: 7 }, // y: 27 - 55 = -28
    labelPosition: { x: 50, y: -25 }, // labelPosition.y: 30 - 55 = -25
  },

  // 4. ルーフ（屋根）
  {
    id: "roof",
    name: "ルーフ",
    label: "RF",
    area: { x: 31, y: -17, width: 36, height: 29 }, // y: 38 - 55 = -17
    labelPosition: { x: 50, y: -10 }, // labelPosition.y: 45 - 55 = -10
  },

  // 5. 右Fフェンダー（右上タイヤ周辺）
  {
    id: "right-front-fender",
    name: "右Fフェンダー",
    label: "RFF",
    area: { x: 67, y: -46, width: 20, height: 21 }, // y: 9 - 55 = -46
    labelPosition: { x: 80, y: -41 }, // labelPosition.y: 14 - 55 = -41
  },

  // 6. 右Fドア
  {
    id: "right-front-door",
    name: "右Fドア",
    label: "RFD",
    area: { x: 67, y: -33, width: 17, height: 12 }, // y: 22 - 55 = -33
    labelPosition: { x: 76, y: -38 }, // labelPosition.y: 17 - 55 = -38
  },

  // 7. 右ステップ（サイドシル）- 右端に配置
  {
    id: "right-step",
    name: "右ステップ",
    label: "",
    area: { x: 86, y: -28, width: 7, height: 24 }, // y: 27 - 55 = -28
    labelPosition: { x: 98, y: -38 }, // labelPosition.y: 17 - 55 = -38
  },

  // 8. 右Rドア
  {
    id: "right-rear-door",
    name: "右Rドア",
    label: "RRD",
    area: { x: 67, y: -23, width: 17, height: 12 }, // y: 32 - 55 = -23
    labelPosition: { x: 76, y: -28 }, // labelPosition.y: 27 - 55 = -28
  },

  // 9. 右Rフェンダー（右下タイヤ周辺）
  {
    id: "right-rear-fender",
    name: "右Rフェンダー",
    label: "RRF",
    area: { x: 66, y: -6, width: 24, height: 16 }, // y: 49 - 55 = -6
    labelPosition: { x: 74, y: -14 }, // labelPosition.y: 43 - 55 = -14
  },

  // 10. Rゲート（リアゲート）
  {
    id: "rear-gate",
    name: "Rゲート",
    label: "RG",
    area: { x: 31, y: 1, width: 36, height: 15 }, // y: 56 - 55 = 1
    labelPosition: { x: 50, y: -19 }, // labelPosition.y: 41 - 55 = -19
  },

  // 11. Rバンパー（最下部）
  {
    id: "rear-bumper",
    name: "Rバンパー",
    label: "RB",
    area: { x: 31, y: 16, width: 35, height: 8 }, // y: 71 - 55 = 16
    labelPosition: { x: 50, y: 5 }, // labelPosition.y: 55 - 55 = 5
  },

  // 12. 左Rフェンダー（左下タイヤ周辺）
  {
    id: "left-rear-fender",
    name: "左Rフェンダー",
    label: "LRF",
    area: { x: 7, y: -6, width: 24, height: 16 }, // y: 49 - 55 = -6
    labelPosition: { x: 20, y: -14 }, // labelPosition.y: 43 - 55 = -14
  },

  // 13. 左Rドア
  {
    id: "left-rear-door",
    name: "左Rドア",
    label: "LRD",
    area: { x: 13, y: -23, width: 17, height: 12 }, // y: 32 - 55 = -23
    labelPosition: { x: 20, y: -28 }, // labelPosition.y: 27 - 55 = -28
  },

  // 14. 左ステップ（サイドシル）- 左端に配置
  {
    id: "left-step",
    name: "左ステップ",
    label: "",
    area: { x: 6, y: -28, width: 7, height: 24 }, // y: 27 - 55 = -28
    labelPosition: { x: 2, y: -38 }, // labelPosition.y: 17 - 55 = -38
  },

  // 15. 左Fドア
  {
    id: "left-front-door",
    name: "左Fドア",
    label: "LFD",
    area: { x: 13, y: -33, width: 17, height: 12 }, // y: 22 - 55 = -33
    labelPosition: { x: 20, y: -38 }, // labelPosition.y: 17 - 55 = -38
  },

  // 16. 左Fフェンダー（左上タイヤ周辺）
  {
    id: "left-front-fender",
    name: "左Fフェンダー",
    label: "LFF",
    area: { x: 11, y: -46, width: 20, height: 21 }, // y: 9 - 55 = -46
    labelPosition: { x: 20, y: -41 }, // labelPosition.y: 14 - 55 = -41
  },
].map((part) => ({
  ...part,
  area: {
    ...part.area,
    y: part.area.y - 50, // Adjust y-coordinate
  },
  labelPosition: {
    ...part.labelPosition,
    y: part.labelPosition.y - 50, // Adjust labelPosition y-coordinate
  },
}));

export interface PartDefect {
  partId: string;
  partName: string;
  defects: Defect[];
}

export function CarPartSelector() {
  const [selectedPart, setSelectedPart] = useState<CarPart | null>(null);
  const [partDefects, setPartDefects] = useState<PartDefect[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Ensure handlePartClick is defined and functional
  const handlePartClick = (part: CarPart) => {
    console.log(`部位クリックイベント発火: ${part.name}`); // ★これを追加★
    setSelectedPart(part);
    setDialogOpen(true);
  };

  const handleDefectsConfirm = (defects: Defect[]) => {
    if (!selectedPart) return;

    const updatedDefects = partDefects.map((pd) =>
      pd.partId === selectedPart.id ? { ...pd, defects } : pd
    );

    setPartDefects(updatedDefects);
    setDialogOpen(false);
  };

  const getPartDefects = (partId: string): Defect[] => {
    return partDefects.find((pd) => pd.partId === partId)?.defects || [];
  };

  const hasDefects = (partId: string): boolean => {
    return getPartDefects(partId).length > 0;
  };

  const getDefectLabel = (partId: string): string => {
    const defects = getPartDefects(partId);
    if (defects.length === 0) return "";
    return defects
      .slice(0, 2)
      .map((d) => `${d.type}${d.level}`)
      .join(" ");
  };

  const totalDefects = partDefects.reduce(
    (sum, pd) => sum + pd.defects.length,
    0
  );

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>車体展開図（USS形式）</CardTitle>
          <CardDescription>
            部位をタップして瑕疵を入力してください（全16箇所）
          </CardDescription>
          {totalDefects > 0 && (
            <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                {totalDefects} 件の瑕疵が記録されています（{partDefects.length}
                /16箇所）
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 車体展開図 */}
          <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg p-4 border-2 border-slate-300">
            {/* 車の画像 */}
            <div className="relative w-full aspect-[1/1.3]">
              <img
                src={carDiagram}
                alt="車体展開図"
                className="w-full h-full object-contain"
                style={{ opacity: 0.5 }} // Set opacity
              />

              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 100 }} // Set zIndex
              >
                {carParts.map((part) => (
                  <rect
                    key={part.id}
                    x={part.area.x}
                    y={part.area.y}
                    width={part.area.width}
                    height={part.area.height}
                    fill="rgba(255, 0, 0, 1.0)" // Set fill color
                    opacity={1} // Set opacity
                    style={{ pointerEvents: "all" }}
                    onClick={() => handlePartClick(part)}
                  />
                ))}
              </svg>
            </div>

            {/* 凡例 */}
            <div className="mt-4 pt-3 border-t text-xs text-slate-600 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
                <span>瑕疵あり</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                <span>選択中</span>
              </div>
            </div>
          </div>

          {/* 瑕疵一覧 */}
          {partDefects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm text-slate-700">登録済み瑕疵</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {partDefects.map((pd) => (
                  <div
                    key={pd.partId}
                    className="p-3 bg-white rounded-lg border hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => {
                      const part = carParts.find((p) => p.id === pd.partId);
                      if (part) handlePartClick(part);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">{pd.partName}</div>
                        <div className="flex gap-1 mt-1">
                          {pd.defects.map((defect, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {defect.type}
                              {defect.level}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className="bg-orange-500">
                        {pd.defects.length}件
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 評価点算出ボタン */}
          <Button
            onClick={() => setScoreDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" />
            評価点を算出
          </Button>
        </CardContent>
      </Card>

      {/* 瑕疵入力ダイアログ */}
      {dialogOpen && selectedPart && (
        <DefectInputDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          carPartName={selectedPart?.name}
          existingDefects={getPartDefects(selectedPart?.id)}
          onConfirm={(defects) => {
            // 必要なロジック
          }}
          onDefectSubmit={(partName, defects) => {
            // 必要なロジック
          }} // 修正: onDefectSubmit を追加
        />
      )}

      {/* 評価点表示ダイアログ */}
      <EvaluationScoreDialog
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        carPartName={selectedPart?.name}
        onScoreSelect={(score) => {
          // 必要なロジック
        }}
        partDefects={partDefects} // 修正: partDefects を追加
      />
    </div>
  );
}
