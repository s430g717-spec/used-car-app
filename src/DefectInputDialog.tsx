import React, { useEffect, useRef, useState } from 'react';

export interface Defect {
  type: string;
  level?: string;
  note?: string;
}

export interface CarSpec {
  year: string;
  model: string;
  name: string;
  mileage: string;
  [key: string]: string;
}

// パターンA: すべての瑕疵タイプ（レベル付き）
const ALL_DEFECT_TYPES_WITH_LEVEL = [
  { code: 'A', label: 'キズ', levels: ['1', '2', '3'] },
  { code: 'U', label: '凹み', levels: ['1', '2', '3'] },
  { code: 'B', label: 'キズ凹', levels: ['1', '2', '3'] },
  { code: 'W', label: '補修', levels: ['1', '2', '3'] },
  { code: 'S', label: 'サビ', levels: ['1', '2', '3'] },
  { code: 'C', label: '腐食', levels: ['1', '2', '3'] },
  { code: 'Y', label: 'Y', levels: ['1', '2', '3'] },
];

const DEFECT_TYPES_NO_LEVEL = [
  { code: '✖✖', label: '交換' },
  { code: '脱アト', label: '脱アト' },
  { code: 'G', label: '飛び石' },
];

// パターンB: メイン5種 + その他4種
const USS_DEFECT_TYPES = [
  { code: 'A', label: 'キズ' },
  { code: 'U', label: '凹み' },
  { code: 'B', label: 'キズ凹' },
  { code: 'W', label: '補修' },
  { code: '✖✖', label: '交換' },
];

const OTHER_DEFECT_TYPES = [
  { code: 'Y1', label: 'Y1' },
  { code: 'Y2', label: 'Y2' },
  { code: 'S1', label: 'S1' },
  { code: 'S2', label: 'S2' },
];

const LEVEL_LABELS = {
  'A': ['A', 'A1', 'A2', 'A3'],
  'U': ['U', 'U1', 'U2', 'U3'],
  'B': ['B', 'B1', 'B2', 'B3'],
  'W': ['W', 'W1', 'W2', 'W3'],
  '✖✖': ['✖✖'],
};

export function DefectInputDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  existingDefects: Defect[];
  onConfirm: (defects: Defect[]) => void;
  inputMode: 'pattern-a' | 'pattern-b'; // 入力パターン
}) {
  const { open, onOpenChange, partName, existingDefects, onConfirm, inputMode } = props;
  const [selectingType, setSelectingType] = useState(true);
  const [type, setType] = useState('A');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // フリック用
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    setSelectingType(true);
    setSelectedLevel(null);
  }, [existingDefects, open]);

  if (!open) return null;

  // 追加時に即onConfirmして閉じる
  const quickAdd = (defect: Defect) => {
    onConfirm([defect]);
    onOpenChange(false);
  };

  // 削除（既存の瑕疵をタップ）
  const handleDeleteDefect = (index: number) => {
    const newDefects = existingDefects.filter((_, i) => i !== index);
    onConfirm(newDefects);
  };

  // パターンA: タップ式
  if (inputMode === 'pattern-a') {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}
        onClick={() => onOpenChange(false)}
      >
        <div
          style={{ 
            width: 380, 
            maxHeight: '90vh',
            overflow: 'auto',
            background: '#fff', 
            borderRadius: 12, 
            padding: 20 
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {partName}
          </div>

          {/* 既存の瑕疵表示（タップで削除） */}
          {existingDefects.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                入力済み瑕疵（タップで削除）
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {existingDefects.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handleDeleteDefect(i)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '2px solid #ef4444',
                      background: '#fee2e2',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    {d.type}{d.level || ''} ✕
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectingType ? (
            <>
              {/* レベル付き瑕疵 */}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
                瑕疵タイプ
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {ALL_DEFECT_TYPES_WITH_LEVEL.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => { setType(opt.code); setSelectingType(false); }}
                    style={{
                      padding: '14px',
                      borderRadius: 8,
                      border: '2px solid #2563eb',
                      background: '#dbeafe',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {opt.code} ({opt.label})
                  </button>
                ))}
              </div>

              {/* レベルなし瑕疵 */}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                その他
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEFECT_TYPES_NO_LEVEL.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => quickAdd({ type: opt.code })}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '2px solid #94a3b8',
                      background: '#f1f5f9',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.code}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // レベル選択
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
                {type} のレベルを選択
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {['1', '2', '3'].map(lv => (
                  <button
                    key={lv}
                    onClick={() => quickAdd({ type, level: lv })}
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      border: '2px solid #10b981',
                      background: '#d1fae5',
                      fontWeight: 700,
                      fontSize: 20,
                      cursor: 'pointer'
                    }}
                  >
                    {type}{lv}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectingType(true)} 
                style={{ 
                  width: '100%', 
                  padding: 10, 
                  borderRadius: 8, 
                  border: '1px solid #cbd5e1', 
                  background: '#f8fafc',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← 戻る
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // パターンB: フリック式
  const handleTypeSelect = (code: string) => {
    setType(code);
    setSelectingType(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // ✖✖はどの方向でも「脱アト」
    if (type === '✖✖') {
      if (absX > 30 || absY > 30) {
        quickAdd({ type: '✖✖', note: '脱アト' });
      } else {
        quickAdd({ type: '✖✖' });
      }
      startX.current = null;
      startY.current = null;
      return;
    }

    // メイン瑕疵のフリック入力
    if (LEVEL_LABELS[type]) {
      let levelIdx = 0;
      if (absY > absX && dy < -30) levelIdx = 1; // 上
      else if (absX > absY && dx < -30) levelIdx = 2; // 左
      else if (absX > absY && dx > 30) levelIdx = 2; // 右
      else if (absY > absX && dy > 30) levelIdx = 3; // 下

      const label = LEVEL_LABELS[type][levelIdx] || type;
      quickAdd({ type, level: label.replace(type, '') });
    }
    startX.current = null;
    startY.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ 
          width: 360, 
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff', 
          borderRadius: 12, 
          padding: 20 
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
          {partName}
        </div>

        {/* 既存の瑕疵表示（タップで削除） */}
        {existingDefects.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
              入力済み瑕疵（タップで削除）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {existingDefects.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleDeleteDefect(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '2px solid #ef4444',
                    background: '#fee2e2',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  {d.type}{d.level || ''}{d.note ? `(${d.note})` : ''} ✕
                </button>
              ))}
            </div>
          </div>
        )}

        {selectingType ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
              メイン瑕疵（フリックでレベル入力）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {USS_DEFECT_TYPES.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => { setType(opt.code); setSelectingType(false); }}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    border: '2px solid #2563eb',
                    background: '#dbeafe',
                    fontWeight: 700,
                    fontSize: 18,
                    cursor: 'pointer'
                  }}
                >
                  {opt.code}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
              その他瑕疵（タップで即追加）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {OTHER_DEFECT_TYPES.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => quickAdd({ type: opt.code })}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1.5px solid #94a3b8',
                    background: '#f1f5f9',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >
                  {opt.code}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, textAlign: 'center', color: '#64748b' }}>
              上下左右にフリックしてレベル入力
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 48,
                fontWeight: 700,
                userSelect: 'none',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: 16,
                padding: '40px 0',
                margin: '16px 0',
                touchAction: 'none',
                border: '3px solid #2563eb'
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => quickAdd({ type })}
            >
              {type}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
              タップ: {type} のみ追加<br/>
              フリック: レベル付きで追加
            </div>
            <button 
              onClick={() => setSelectingType(true)} 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #cbd5e1', 
                background: '#f8fafc',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← 戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// QRコード画像アップロード＆デコード
export function SpecInputSheet(props: {
  value: CarSpec;
  onChange: (v: CarSpec) => void;
}) {
  const { value, onChange } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QRコード画像アップロード＆デコード
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      // jsQR等でQRデコード
      // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // const qr = jsQR(imageData.data, canvas.width, canvas.height);
      // if (qr) {
      //   const parsed = parseShakenQR(qr.data); // 独自パース関数
      //   onChange({ ...value, ...parsed });
      // }
      // 仮：デモ用
      onChange({
        ...value,
        year: "2021",
        model: "DBA-ABC123",
        name: "カローラ",
        mileage: "12345"
      });
    };
  };

  // 入力変更
  const handleInput = (key: keyof CarSpec, v: string) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div style={{
      padding: 12,
      background: "#f8fafc",
      borderRadius: 8,
      maxWidth: 400,
      width: "100%",
      boxSizing: "border-box"
    }}>
      <h4 style={{ fontSize: 18, margin: "8px 0" }}>諸元入力</h4>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 15 }}>年式</label>
        <input
          value={value.year || ""}
          onChange={e => handleInput("year", e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: "10px 8px",
            marginTop: 2,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 15 }}>型式</label>
        <input
          value={value.model || ""}
          onChange={e => handleInput("model", e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: "10px 8px",
            marginTop: 2,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 15 }}>車名</label>
        <input
          value={value.name || ""}
          onChange={e => handleInput("name", e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: "10px 8px",
            marginTop: 2,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 15 }}>走行距離</label>
        <input
          value={value.mileage || ""}
          onChange={e => handleInput("mileage", e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: "10px 8px",
            marginTop: 2,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
        />
      </div>
      <div style={{ margin: "12px 0" }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleQRUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            fontSize: 16,
            padding: "12px 0",
            borderRadius: 6,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >車検証QRコード読取</button>
      </div>
    </div>
  );
}

// QRデータのパース関数例（実際はQR仕様に合わせて実装）
// function parseShakenQR(data: string): Partial<CarSpec> {
//   // QRデータを分解して各項目に割り当て
//   return { year: "...", model: "...", name: "...", mileage: "..." };
// }

export default function App() {
  const [tab, setTab] = useState<'diagram' | 'spec'>('diagram');
  const [spec, setSpec] = useState<CarSpec>({
    year: '',
    model: '',
    name: '',
    mileage: ''
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('diagram')}>展開図</button>
        <button onClick={() => setTab('spec')}>諸元入力</button>
      </div>
      {tab === 'diagram' && (
        <div>
          <p>ここに展開図UI</p>
        </div>
      )}
      {tab === 'spec' && (
        <SpecInputSheet value={spec} onChange={setSpec} />
      )}
    </div>
  );
}

const tabBtn = {
  flex: 1,
  padding: "10px 0",
  border: "none",
  background: "#f1f5f9",
  fontWeight: 600,
  fontSize: 16,
  borderRadius: 24,
  margin: "0 8px",
  cursor: "pointer"
};
const activeTab = {
  ...tabBtn,
  background: "#fff",
  border: "2px solid #2563eb",
  color: "#2563eb"
};