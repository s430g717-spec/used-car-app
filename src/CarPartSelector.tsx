import React, { useState } from 'react';
import html2canvas from 'html2canvas';
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
  const [activePart, setActivePart] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [inputMode, setInputMode] = useState<'pattern-a' | 'pattern-b'>(() => {
    const saved = localStorage.getItem('defectInputMode');
    return (saved as 'pattern-a' | 'pattern-b') || 'pattern-b';
  });

  const partDefectLabels = React.useMemo(() => {
    const labels: Record<string, string[]> = {};
    partDefects.forEach(pd => {
      labels[pd.part] = pd.defects.map(d => `${d.type}${d.level || ''}${d.note ? `(${d.note})` : ''}`);
    });
    return labels;
  }, [partDefects]);

  React.useEffect(() => {
    localStorage.setItem('partDefects', JSON.stringify(partDefects));
    
    const captureDiagram = async () => {
      const diagramElement = document.querySelector('[data-diagram="car-parts"]') as HTMLElement;
      if (diagramElement) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const canvas = await html2canvas(diagramElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          const imageData = canvas.toDataURL('image/png');
          localStorage.setItem('diagramImage', imageData);
          console.log('展開図をキャプチャしてLocalStorageに保存しました');
        } catch (error) {
          console.error('展開図キャプチャエラー:', error);
        }
      }
    };
    
    captureDiagram();
  }, [partDefects]);

  React.useEffect(() => {
    localStorage.setItem('defectInputMode', inputMode);
  }, [inputMode]);

  const openDefectDialog = (partId: string) => {
    setSelectedPart(partId);
    setIsDialogOpen(true);
  };

  const closeDefectDialog = () => {
    setIsDialogOpen(false);
  };

  const saveDefects = (defects: Defect[]) => {
    if (!selectedPart) return;
    
    // 2つまで制限 & 重複チェック（同じtype+levelは上書き）
    const uniqueDefects: Defect[] = [];
    defects.forEach(newDefect => {
      const existingIndex = uniqueDefects.findIndex(
        d => d.type === newDefect.type && d.level === newDefect.level
      );
      if (existingIndex >= 0) {
        // 上書き
        uniqueDefects[existingIndex] = newDefect;
      } else if (uniqueDefects.length < 2) {
        // 2つまで追加
        uniqueDefects.push(newDefect);
      }
    });
    
    setPartDefects(prev => {
      const filtered = prev.filter(p => p.part !== selectedPart);
      if (uniqueDefects.length > 0) {
        return [...filtered, { part: selectedPart, defects: uniqueDefects }];
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
    <div style={{ padding: '12px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '20px', 
          fontWeight: 700, 
          color: '#1e293b',
          margin: '4px 0 8px 0'
        }}>
          車両展開図
        </h2>
        
        {/* 右上のiボタン */}
        <button
          onClick={() => setShowInfoModal(true)}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px solid #64748b',
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(100,116,139,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'
          }
        >
          ⓘ
        </button>
        
        {/* 入力モード切り替えアイコン（iボタンの下） */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 42,
          display: 'flex',
          gap: 6
        }}>
          {/* タップ式アイコン */}
          <button
            onClick={() => setInputMode('pattern-a')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: inputMode === 'pattern-a' ? '3px solid #10b981' : '2px solid #e2e8f0',
              background: inputMode === 'pattern-a' 
                ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s',
              boxShadow: inputMode === 'pattern-a' 
                ? '0 4px 12px rgba(16,185,129,0.3)' 
                : '0 2px 6px rgba(0,0,0,0.1)'
            }}
            title="タップ式入力"
          >
            👆
          </button>
          
          {/* フリック式アイコン */}
          <button
            onClick={() => setInputMode('pattern-b')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: inputMode === 'pattern-b' ? '3px solid #3b82f6' : '2px solid #e2e8f0',
              background: inputMode === 'pattern-b' 
                ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s',
              boxShadow: inputMode === 'pattern-b' 
                ? '0 4px 12px rgba(59,130,246,0.3)' 
                : '0 2px 6px rgba(0,0,0,0.1)'
            }}
            title="フリック式入力"
          >
            👉
          </button>
        </div>
        
        {/* 現在の入力モード表示 */}
        <div style={{
          textAlign: 'center',
          marginTop: 2,
          fontSize: 12,
          fontWeight: 600,
          color: inputMode === 'pattern-a' ? '#10b981' : '#3b82f6'
        }}>
          {inputMode === 'pattern-a' ? '📋 タップ式' : '👉 フリック式'}
        </div>
      </div>
      
      {/* 操作説明モーダル */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '500px',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(59,130,246,0.5)'
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👆</span>
              <span>操作方法</span>
            </div>
            <div style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>
              <strong>👆 タップ式入力:</strong><br/>
              すべての瑕疵タイプとレベルをタップで選択<br/>
              A1〜A3、U、B、W、S、C、Y(割れ)、✖✖、脱アト、G<br/><br/>
              
              <strong>👉 フリック式入力:</strong><br/>
              メイン5種(A,U,B,W,✖✖)をフリックでレベル入力<br/>
              その他4種(Y1,Y2,S1,S2)はタップで即追加
            </div>
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
              <strong>💡 ヒント:</strong> 入力済み瑕疵をタップすると削除できます<br/>
              1パネルに2つまで入力可能（同じ瑕疵は上書き）
            </div>
            <div style={{ textAlign: 'center', fontSize: '13px', opacity: 0.9 }}>
              画面をタップして閉じる
            </div>
          </div>
        </div>
      )}
      
      <div 
        data-diagram="car-parts"
        style={{ 
          position: 'relative', 
          maxWidth: '550px',
          margin: '0 auto',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}car_diagram.png`}
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
                {hasDefects && (() => {
                  let offsetY = 0.5;
                  
                  if (hotspot.id === 'front-bumper') {
                    offsetY = -5;
                  } else if (hotspot.id === 'rear-gate') {
                    offsetY = 8;
                  } else if (hotspot.id === 'rear-bumper') {
                    offsetY = 6;
                  }
                  
                  return (
                    <text
                      x={hotspot.labelPos.x}
                      y={hotspot.labelPos.y + offsetY}
                      textAnchor="middle"
                      fontSize="6"
                      fill="#dc2626"
                      fontWeight="bold"
                      pointerEvents="none"
                      stroke="#fff"
                      strokeWidth="0.4"
                      paintOrder="stroke"
                    >
                      {defectLabels.join(' ')}
                    </text>
                  );
                })()}
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
        inputMode={inputMode}
      />
    </div>
  );
}
