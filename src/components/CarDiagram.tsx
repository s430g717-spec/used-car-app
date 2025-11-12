import React, { useState, useEffect } from 'react';
import { DefectInputDialog, Defect } from '../DefectInputDialog';
import { EvaluationScoreDialog } from '../EvaluationScoreDialog';

type Hotspot = {
  id: string;
  label: string;
  // polygon points in viewBox(0-100) coordinates or SVG path 'd'
  points?: string; // polygon points: "x1,y1 x2,y2 ..."
  d?: string;      // optional path 'd' if you prefer path
  labelPos?: { x: number; y: number };
};

const HOTSPOT_PATHS: Hotspot[] = [
  { id: 'front-bumper', label: 'Fバンパー', points: '33,10 67,10 67,16 33,16', labelPos: { x: 50, y: 13 } },
  { id: 'hood', label: 'ボンネット', points: '33,17 67,17 67,30 33,30', labelPos: { x: 50, y: 23 } },
  { id: 'front-glass', label: 'Fガラス', points: '34,31 66,31 66,38 34,38', labelPos: { x: 50, y: 34.5 } },
  { id: 'roof', label: 'ルーフ', points: '30,37 70,37 70,55 30,55', labelPos: { x: 50, y: 45 } },
  { id: 'right-front-fender', label: '右Fフェンダー', points: '66,14 86,14 86,30 66,30', labelPos: { x: 76, y: 20 } },
  { id: 'right-front-door', label: '右Fドア', points: '66,31 84,31 84,45 66,45', labelPos: { x: 75, y: 38 } },
  { id: 'right-rear-door', label: '右Rドア', points: '66,46 84,46 84,60 66,60', labelPos: { x: 75, y: 53 } },
  { id: 'right-rear-fender', label: '右Rフェンダー', points: '62,62 88,62 88,78 62,78', labelPos: { x: 75, y: 70 } },
  { id: 'rear-gate', label: 'Rゲート', points: '33,66 67,66 67,78 33,78', labelPos: { x: 50, y: 72 } },
  { id: 'rear-bumper', label: 'Rバンパー', points: '33,80 67,80 67,90 33,90', labelPos: { x: 50, y: 86 } },
  { id: 'left-rear-fender', label: '左Rフェンダー', points: '12,62 38,62 38,78 12,78', labelPos: { x: 25, y: 70 } },
  { id: 'left-rear-door', label: '左Rドア', points: '16,46 34,46 34,60 16,60', labelPos: { x: 25, y: 53 } },
  { id: 'left-front-door', label: '左Fドア', points: '16,31 34,31 34,45 16,45', labelPos: { x: 25, y: 38 } },
  { id: 'left-front-fender', label: '左Fフェンダー', points: '10,14 30,14 30,30 10,30', labelPos: { x: 20, y: 20 } },
  { id: 'left-step', label: '左サイドステップ', points: '6,42 16,42 16,48 6,48', labelPos: { x: 11, y: 45 } },
  { id: 'right-step', label: '右サイドステップ', points: '84,42 94,42 94,48 84,48', labelPos: { x: 89, y: 45 } },
];

export interface PartDefect {
  partId: string;
  partName: string;
  defects: Defect[];
}

export default function CarDiagram() {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [partDefects, setPartDefects] = useState<PartDefect[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [debugShow, setDebugShow] = useState(false); // true にすると塗りが見える（調整用）

  useEffect(() => { console.log('CarDiagram mounted'); }, []);

  const handlePartClick = (id: string) => {
    console.log('part clicked', id);
    setSelectedPartId(id);
    setDialogOpen(true);
  };

  const hasDefects = (id: string) => partDefects.some(p => p.partId === id);
  const getDefectLabel = (id: string) => {
    const d = partDefects.find(p => p.partId === id)?.defects || [];
    return d.length ? d.slice(0,2).map(x => `${x.type}${x.level}`).join(' ') : '';
  };

  const handleConfirm = (defects: Defect[]) => {
    if (!selectedPartId) return;
    const partName = HOTSPOT_PATHS.find(h => h.id === selectedPartId)?.label || selectedPartId;
    const existingIndex = partDefects.findIndex(p => p.partId === selectedPartId);
    const newEntry: PartDefect = { partId: selectedPartId, partName, defects };
    if (defects.length === 0) {
      if (existingIndex !== -1) setPartDefects(partDefects.filter(p => p.partId !== selectedPartId));
    } else {
      if (existingIndex !== -1) {
        const copy = [...partDefects]; copy[existingIndex] = newEntry; setPartDefects(copy);
      } else setPartDefects([...partDefects, newEntry]);
    }
    setDialogOpen(false);
    setSelectedPartId(null);
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>車体展開図（ライン沿いホットスポット）</h3>
        <button onClick={() => setDebugShow(s => !s)} style={{ fontSize: 12 }}>DEBUG</button>
      </div>

      <div style={{ position: 'relative', background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e6e6e6' }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '130%' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
          >
            {/* 画像をsvg内部に埋める */}
            <image href="/car_diagram.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }} />

            {HOTSPOT_PATHS.map(h => {
              const isHovered = hovered === h.id;
              const hasDef = hasDefects(h.id);
              const fill = debugShow ? (hasDef ? 'rgba(254,243,199,0.7)' : 'rgba(191,219,254,0.25)') : 'transparent';
              const stroke = hasDef ? '#f59e0b' : isHovered ? '#60a5fa' : 'transparent';
              return (
                <g key={h.id}>
                  {h.points ? (
                    <polygon
                      points={h.points}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={hasDef || isHovered ? 0.6 : 0.3}
                      style={{ transition: 'all .12s', cursor: 'pointer', pointerEvents: 'visiblePainted' }}
                      onClick={() => handlePartClick(h.id)}
                      onTouchStart={() => handlePartClick(h.id)}
                      onMouseEnter={() => setHovered(h.id)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ) : h.d ? (
                    <path
                      d={h.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={hasDef || isHovered ? 0.6 : 0.3}
                      style={{ transition: 'all .12s', cursor: 'pointer', pointerEvents: 'visiblePainted' }}
                      onClick={() => handlePartClick(h.id)}
                      onTouchStart={() => handlePartClick(h.id)}
                      onMouseEnter={() => setHovered(h.id)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ) : null}

                  {/* ラベル（瑕疵がある場合は常時、ホバー時は表示） */}
                  {(hasDef || isHovered) && h.labelPos && (
                    <text x={h.labelPos.x} y={h.labelPos.y} textAnchor="middle" dominantBaseline="middle"
                      fontSize="3.5" fontWeight="700" fill={hasDef ? '#b91c1c' : '#1e40af'} pointerEvents="none">
                      {hasDef ? getDefectLabel(h.id) || h.label : h.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 2 }} />
          <span>瑕疵あり</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, background: '#bfdbfe', border: '1px solid #60a5fa', borderRadius: 2 }} />
          <span>ホバー/選択</span>
        </div>
      </div>

      {/* ダイアログ */}
      {selectedPartId && (
        <DefectInputDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          partName={HOTSPOT_PATHS.find(h => h.id === selectedPartId)?.label || selectedPartId}
          existingDefects={partDefects.find(p => p.partId === selectedPartId)?.defects || []}
          onConfirm={handleConfirm}
        />
      )}

      <EvaluationScoreDialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen} partDefects={partDefects} />
    </div>
  );
}