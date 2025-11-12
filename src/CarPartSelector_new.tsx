import React, { useState } from 'react';
import { DefectInputDialog } from './DefectInputDialog';

export interface Defect {
  type: string;
  level?: string;
  note?: string;
}

export interface PartDefect {
  part: string;
  defects: Defect[];
}

interface Hotspot {
  id: string;
  label: string;
  d: string;
  labelPos: { x: number; y: number };
}

const HOTSPOTS: Hotspot[] = [
  { id: 'front-bumper', label: 'Fバンパー', d: 'M33 7L67 7L67 16L33 16Z', labelPos: { x: 50, y: 11 } },
  { id: 'hood', label: 'ボンネット', d: 'M33 17L67 17L67 30L33 30Z', labelPos: { x: 50, y: 23 } },
  { id: 'front-glass', label: 'Fガラス', d: 'M34 27L66 27L66 38L34 38Z', labelPos: { x: 50, y: 32 } },
  { id: 'roof', label: 'ルーフ', d: 'M36 37L64 37L64 60L36 60Z', labelPos: { x: 50, y: 48 } },
  { id: 'right-front-fender', label: '右Fフェンダー', d: 'M66 14L86 14L86 36L66 36Z', labelPos: { x: 76, y: 25 } },
  { id: 'right-front-door', label: '右Fドア', d: 'M66 37L84 37L84 49L66 49Z', labelPos: { x: 75, y: 43 } },
  { id: 'right-rear-door', label: '右Rドア', d: 'M66 50L84 50L84 62L66 62Z', labelPos: { x: 75, y: 56 } },
  { id: 'right-rear-fender', label: '右Rフェンダー', d: 'M62 62L88 62L88 78L62 78Z', labelPos: { x: 75, y: 70 } },
  { id: 'rear-gate', label: 'Rゲート', d: 'M33 70L67 70L67 85L33 85Z', labelPos: { x: 50, y: 78 } },
  { id: 'rear-bumper', label: 'Rバンパー', d: 'M33 88L67 88L67 96L33 96Z', labelPos: { x: 50, y: 92 } },
  { id: 'left-rear-fender', label: '左Rフェンダー', d: 'M12 62L38 62L38 78L12 78Z', labelPos: { x: 25, y: 70 } },
  { id: 'left-rear-door', label: '左Rドア', d: 'M16 50L34 50L34 62L16 62Z', labelPos: { x: 25, y: 56 } },
  { id: 'left-front-door', label: '左Fドア', d: 'M16 37L34 37L34 49L16 49Z', labelPos: { x: 25, y: 43 } },
  { id: 'left-front-fender', label: '左Fフェンダー', d: 'M10 14L30 14L30 36L10 36Z', labelPos: { x: 20, y: 25 } },
  { id: 'left-step', label: '左サイドステップ', d: 'M6 32L16 32L16 68L6 68Z', labelPos: { x: 11, y: 50 } },
  { id: 'right-step', label: '右サイドステップ', d: 'M84 32L94 32L94 68L84 68Z', labelPos: { x: 89, y: 50 } },
];

export default function CarPartSelector() {
  const [partDefects, setPartDefects] = useState<PartDefect[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('partDefects');
    if (saved) {
      setPartDefects(JSON.parse(saved));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('partDefects', JSON.stringify(partDefects));
  }, [partDefects]);

  const openDefectDialog = (partId: string) => {
    setSelectedPart(partId);
    setIsDialogOpen(true);
  };

  const closeDefectDialog = () => {
    setIsDialogOpen(false);
  };

  const saveDefects = (defects: Defect[]) => {
    if (!selectedPart) return;
    setPartDefects(prev => {
      const filtered = prev.filter(p => p.part !== selectedPart);
      if (defects.length > 0) {
        return [...filtered, { part: selectedPart, defects }];
      }
      return filtered;
    });
    closeDefectDialog();
  };

  const getDefectCount = (partId: string) => {
    const found = partDefects.find(p => p.part === partId);
    return found ? found.defects.length : 0;
  };

  const selectedPartLabel = HOTSPOTS.find(h => h.id === selectedPart)?.label;
  const currentDefects = partDefects.find(p => p.part === selectedPart)?.defects || [];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>車両展開図</h2>
      
      <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: '500px', border: '1px solid #ccc', display: 'block', margin: '0 auto' }}>
        {HOTSPOTS.map(hotspot => {
          const defectCount = getDefectCount(hotspot.id);
          return (
            <g key={hotspot.id}>
              <path
                d={hotspot.d}
                fill={defectCount > 0 ? '#ffeb3b' : '#e0e0e0'}
                stroke="#333"
                strokeWidth="0.3"
                style={{ cursor: 'pointer' }}
                onClick={() => openDefectDialog(hotspot.id)}
              />
              <text
                x={hotspot.labelPos.x}
                y={hotspot.labelPos.y}
                textAnchor="middle"
                fontSize="2.5"
                fill="#333"
                pointerEvents="none"
              >
                {hotspot.label}
              </text>
              {defectCount > 0 && (
                <text
                  x={hotspot.labelPos.x}
                  y={hotspot.labelPos.y + 3}
                  textAnchor="middle"
                  fontSize="2"
                  fill="#d32f2f"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  ●{defectCount}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <DefectInputDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        partName={selectedPartLabel || ''}
        existingDefects={currentDefects}
        onConfirm={saveDefects}
      />
    </div>
  );
}
