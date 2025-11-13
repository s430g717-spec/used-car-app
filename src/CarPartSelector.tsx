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
  { id: 'front-bumper', label: 'Fバンパー', d: 'M33 0L67 0L67 9L33 9Z', labelPos: { x: 50, y: 4 } },
  { id: 'hood', label: 'ボンネット', d: 'M33 9L67 9L67 27L33 27Z', labelPos: { x: 50, y: 18 } },
  { id: 'front-glass', label: 'Fガラス', d: 'M34 24L66 24L66 35L34 35Z', labelPos: { x: 50, y: 29 } },
  { id: 'roof', label: 'ルーフ', d: 'M36 34L64 34L64 68L36 68Z', labelPos: { x: 50, y: 51 } },
  { id: 'right-front-fender', label: '右Fフェンダー', d: 'M66 5L86 5L86 30L66 30Z', labelPos: { x: 76, y: 17 } },
  { id: 'right-front-door', label: '右Fドア', d: 'M66 32L84 32L84 46L66 46Z', labelPos: { x: 75, y: 39 } },
  { id: 'right-rear-door', label: '右Rドア', d: 'M66 47L84 47L84 62L66 62Z', labelPos: { x: 75, y: 54 } },
  { id: 'right-rear-fender', label: '右Rフェンダー', d: 'M66 62L88 62L88 80L66 80Z', labelPos: { x: 77, y: 71 } },
  { id: 'rear-gate', label: 'Rゲート', d: 'M33 70L67 70L67 88L33 88Z', labelPos: { x: 50, y: 79 } },
  { id: 'rear-bumper', label: 'Rバンパー', d: 'M33 91L67 91L67 99L33 99Z', labelPos: { x: 50, y: 95 } },
  { id: 'left-rear-fender', label: '左Rフェンダー', d: 'M12 62L34 62L34 80L12 80Z', labelPos: { x: 23, y: 71 } },
  { id: 'left-rear-door', label: '左Rドア', d: 'M14 47L34 47L34 62L14 62Z', labelPos: { x: 24, y: 54 } },
  { id: 'left-front-door', label: '左Fドア', d: 'M14 32L34 32L34 46L14 46Z', labelPos: { x: 24, y: 39 } },
  { id: 'left-front-fender', label: '左Fフェンダー', d: 'M10 5L30 5L30 30L10 30Z', labelPos: { x: 20, y: 17 } },
  { id: 'left-step', label: '左サイドステップ', d: 'M4 28L14 28L14 68L4 68Z', labelPos: { x: 9, y: 48 } },
  { id: 'right-step', label: '右サイドステップ', d: 'M84 28L94 28L94 68L84 68Z', labelPos: { x: 89, y: 48 } },
];

export default function CarPartSelector() {
  const [partDefects, setPartDefects] = useState<PartDefect[]>(() => {
    const saved = localStorage.getItem('partDefects');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activePart, setActivePart] = useState<string | null>(null); // タップ中の部位を追跡

  const partDefectLabels = React.useMemo(() => {
    const labels: Record<string, string[]> = {};
    partDefects.forEach(pd => {
      labels[pd.part] = pd.defects.map(d => `${d.type}${d.level || ''}`);
    });
    return labels;
  }, [partDefects]);

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

  const selectedPartLabel = React.useMemo(
    () => HOTSPOTS.find(h => h.id === selectedPart)?.label,
    [selectedPart]
  );
  
  const currentDefects = React.useMemo(
    () => partDefects.find(p => p.part === selectedPart)?.defects || [],
    [partDefects, selectedPart]
  );

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>車両展開図</h2>
      
      <div 
        data-diagram="car-parts"
        style={{ 
          position: 'relative', 
          maxWidth: '500px', 
          margin: '0 auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
      >
        <img 
          src="/car_diagram.png" 
          alt="車両展開図" 
          loading="lazy"
          draggable={false}
          style={{ 
            width: '100%', 
            display: 'block',
            border: '1px solid #ccc',
            borderRadius: '8px',
            pointerEvents: 'none'
          }} 
        />
        
        <svg 
          viewBox="0 0 100 100" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {HOTSPOTS.map(hotspot => {
            const defectLabels = partDefectLabels[hotspot.id] || [];
            const hasDefects = defectLabels.length > 0;
            return (
              <g key={hotspot.id}>
                <path
                  d={hotspot.d}
                  fill={activePart === hotspot.id ? "rgba(59, 130, 246, 0.3)" : "transparent"}
                  stroke={activePart === hotspot.id ? "#3b82f6" : "transparent"}
                  strokeWidth="0.5"
                  style={{ 
                    cursor: 'pointer', 
                    pointerEvents: 'all',
                    touchAction: 'manipulation',
                    transition: 'fill 0.15s, stroke 0.15s'
                  }}
                  onTouchStart={() => setActivePart(hotspot.id)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setActivePart(null);
                    openDefectDialog(hotspot.id);
                  }}
                  onTouchCancel={() => setActivePart(null)}
                  onClick={() => openDefectDialog(hotspot.id)}
                />
                {hasDefects && (
                  <text
                    x={hotspot.labelPos.x}
                    y={hotspot.labelPos.y + 0.5}
                    textAnchor="middle"
                    fontSize="4.5"
                    fill="#dc2626"
                    fontWeight="bold"
                    pointerEvents="none"
                    stroke="#fff"
                    strokeWidth="0.3"
                    paintOrder="stroke"
                  >
                    {defectLabels.join(' ')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

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
