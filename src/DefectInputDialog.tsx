import React, { useRef } from 'react';

export interface Defect {
  type: string;
  level?: string;
  note?: string;
}

const DEFECT_TYPES = [
  { code: 'A', label: 'キズ' },
  { code: 'U', label: '凹み' },
  { code: 'B', label: 'キズ凹' },
  { code: 'W', label: '補修' },
  { code: '✖✖', label: '交換' }
];

export function DefectInputDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  existingDefects: Defect[];
  onConfirm: (defects: Defect[]) => void;
}) {
  const { open, onOpenChange, partName, existingDefects, onConfirm } = props;
  const [activeType, setActiveType] = React.useState<string | null>(null);
  const touchStartPos = useRef<{ x: number; y: number; code: string } | null>(null);

  if (!open) return null;

  const quickAdd = (defect: Defect) => {
    // 同じタイプ+レベルの組み合わせがあれば上書き（削除してから追加）
    const filteredDefects = existingDefects.filter(d => 
      !(d.type === defect.type && (d.level || '') === (defect.level || ''))
    );

    // 上書き後に2つを超える場合はエラー
    if (filteredDefects.length >= 2) {
      alert('1つの部位には2つまでしか登録できません');
      return;
    }

    // 新しい瑕疵を追加
    onConfirm([...filteredDefects, defect]);
    
    // 2つになったら自動的に閉じる
    if (filteredDefects.length === 1) {
      onOpenChange(false);
    }
  };

  const removeDefect = (index: number) => {
    const updatedDefects = existingDefects.filter((_, i) => i !== index);
    onConfirm(updatedDefects);
  };

  const handleTouchStart = (e: React.TouchEvent, code: string) => {
    e.preventDefault();
    setActiveType(code);
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      code
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartPos.current.x;
    const deltaY = endY - touchStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const code = touchStartPos.current.code;
    
    // Gは常にレベルなし
    if (code === 'G') {
      quickAdd({ type: code });
      touchStartPos.current = null;
      setActiveType(null);
      return;
    }
    
    // ヒビのレベル選択（上=割れ、下=リペア）
    if (code === 'ヒビ') {
      if (distance < 40) {
        quickAdd({ type: code });
      } else {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        let level = '';
        
        if (angle >= -120 && angle < -60) {
          level = '割れ';
        } else if (angle >= 60 && angle < 120) {
          level = 'リペア';
        } else {
          quickAdd({ type: code });
          touchStartPos.current = null;
          setActiveType(null);
          return;
        }
        
        quickAdd({ type: code, level });
      }
      touchStartPos.current = null;
      setActiveType(null);
      return;
    }
    
    // 通常の瑕疵（レベル1-3）
    if (distance < 40) {
      quickAdd({ type: code });
    } else {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      let level = '';
      
      if (angle >= -60 && angle < 60) {
        level = '2';
      } else if (angle >= 60 && angle < 120) {
        level = '3';
      } else if (angle >= -120 && angle < -60) {
        level = '1';
      } else {
        level = '2';
      }
      
      quickAdd({ type: code, level });
    }

    touchStartPos.current = null;
    setActiveType(null);
  };

  const handleClick = (code: string) => {
    quickAdd({ type: code });
  };

  // Fガラス専用の瑕疵タイプ
  const isGlass = partName === 'Fガラス';
  
  const defectTypes = isGlass ? [
    { code: 'G', label: '飛石', hasLevel: false },
    { code: 'ヒビ', label: 'ヒビ', hasLevel: true, levels: ['割れ', 'リペア'] }
  ] : [
    { code: 'A', label: 'キズ', hasLevel: true },
    { code: 'U', label: '凹み', hasLevel: true },
    { code: 'B', label: 'キズ凹', hasLevel: true },
    { code: 'W', label: '補修', hasLevel: true },
    { code: '✖✖', label: '交換', hasLevel: true }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          pointerEvents: 'all'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            color: '#1e293b'
          }}>
            {partName}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '2px solid #e2e8f0',
              background: '#fff',
              fontSize: 14,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            ✕ 閉じる
          </button>
        </div>

        <p style={{
          fontSize: 13,
          color: '#64748b',
          textAlign: 'center',
          marginBottom: 20
        }}>
          瑕疵を選択してください（2つまで）
        </p>

        {existingDefects.length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: '#fef3c7',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
              登録済み: {existingDefects.length}/2 （タップで削除）
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {existingDefects.map((d, i) => (
                <button
                  key={i}
                  onClick={() => removeDefect(i)}
                  style={{
                    padding: '6px 12px',
                    background: '#fff',
                    border: '2px solid #fbbf24',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#92400e',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.color = '#991b1b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#fbbf24';
                    e.currentTarget.style.color = '#92400e';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.color = '#991b1b';
                  }}
                >
                  {d.type}{d.level || ''} ✕
                </button>
              ))}
            </div>
          </div>
        )}

        {/* その他の瑕疵（クイック入力） */}
        {!isGlass && (
          <div style={{
            background: '#fef3c7',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            border: '2px solid #fbbf24'
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#92400e',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              ⚡ その他の瑕疵
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6
            }}>
              {['Y1', 'Y2', 'C1', 'C2'].map(quick => {
                const type = quick[0];
                const level = quick.slice(1);
                return (
                  <button
                    key={quick}
                    onClick={() => quickAdd({ type, level })}
                    style={{
                      padding: '8px 4px',
                      background: '#fff',
                      border: '2px solid #f59e0b',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#92400e',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                      e.currentTarget.style.background = '#fef3c7';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    {quick}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* メイン瑕疵（フリック入力説明を常に表示） */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          border: '2px solid #3b82f6'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 6, textAlign: 'center' }}>
            📱 フリック入力
          </div>
          <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5, textAlign: 'center' }}>
            タップ=レベルなし<br/>
            ↑フリック=レベル1 / →フリック=レベル2 / ↓フリック=レベル3
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20
        }}>
          {defectTypes.map(type => (
            <div key={type.code} style={{ position: 'relative' }}>
              <button
                onTouchStart={(e) => handleTouchStart(e, type.code)}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleClick(type.code)}
                style={{
                  width: '100%',
                  padding: '24px 12px',
                  borderRadius: 12,
                  border: activeType === type.code ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                  background: activeType === type.code 
                    ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                    : existingDefects.some(d => d.type === type.code) 
                    ? '#fef3c7' 
                    : '#fff',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  touchAction: 'none',
                  userSelect: 'none',
                  boxShadow: activeType === type.code ? '0 4px 12px rgba(59,130,246,0.3)' : 'none'
                }}
              >
                <div>{type.code}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 4 }}>
                  {type.label}
                </div>
              </button>
              
              {activeType === type.code && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {type.code === 'ヒビ' ? (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: -28,
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#3b82f6',
                        textShadow: '0 0 4px #fff, 0 0 8px #fff'
                      }}>↑割れ</div>
                      <div style={{
                        position: 'absolute',
                        bottom: -28,
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#3b82f6',
                        textShadow: '0 0 4px #fff, 0 0 8px #fff'
                      }}>↓リペア</div>
                    </>
                  ) : type.code !== 'G' && (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: -28,
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#3b82f6',
                        textShadow: '0 0 4px #fff, 0 0 8px #fff'
                      }}>↑1</div>
                      <div style={{
                        position: 'absolute',
                        right: -28,
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#3b82f6',
                        textShadow: '0 0 4px #fff, 0 0 8px #fff'
                      }}>→2</div>
                      <div style={{
                        position: 'absolute',
                        bottom: -28,
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#3b82f6',
                        textShadow: '0 0 4px #fff, 0 0 8px #fff'
                      }}>↓3</div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => onOpenChange(false)}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 8,
            border: 'none',
            background: '#e2e8f0',
            fontSize: 16,
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
