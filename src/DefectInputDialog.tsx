import React, { useEffect, useRef, useState } from 'react';
// jsQRなどのQRデコードライブラリを使う場合はimport

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

// USS_DEFECT_TYPESの変更: Sを削除、YのレベルにS1,S2を統合
const USS_DEFECT_TYPES = [
  { code: 'A', label: 'キズ' },
  { code: 'U', label: '凹み' },
  { code: 'W', label: '補修' },
  { code: '✖✖', label: '交換' },
  { code: 'B', label: 'キズ凹' },
  { code: 'C', label: '腐食' },
  { code: 'Y', label: 'その他' }, // 「割れ」→「その他」に変更
  { code: 'G', label: '飛び石' },
  { code: '✖', label: 'ヒビ' },
];

const LEVEL_LABELS = {
  'A': ['A', 'A1', 'A2', 'A3'],
  'U': ['U', 'U1', 'U2', 'U3'],
  'B': ['B', 'B1', 'B2', 'B3'],
  'C': ['C', 'C1', 'C2', 'C3'],
  'Y': ['Y', 'Y1', 'Y2', 'Y3', 'S1', 'S2'], // S1,S2を追加
  'G': ['G'],
  '✖': ['✖'],
};

const HOTSPOTS = [
  {
    name: 'Fドア',
    d: 'M10,20 L50,20 L50,60 L10,60 Z', // ←Figma等から取得したパス
    labelPos: { x: 30, y: 40 }
  },
  // ...他の部位
];

export function DefectInputDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  existingDefects: Defect[];
  onConfirm: (defects: Defect[]) => void;
}) {
  const { open, onOpenChange, partName, existingDefects, onConfirm } = props;
  const [selectingType, setSelectingType] = useState(true);
  const [type, setType] = useState('A');

  // フリック用
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    setSelectingType(true);
  }, [existingDefects, open]);

  if (!open) return null;

  // 追加時に即onConfirmして閉じる
  const quickAdd = (defect: Defect) => {
    onConfirm([defect]);
    onOpenChange(false);
  };

  // タイプ選択→フリック待ちUIへ
  const handleTypeSelect = (code: string) => {
    setType(code);
    setSelectingType(false);
  };

  // タイプボタンのダブルタップで即追加
  const handleTypeTap = (code: string) => {
    quickAdd({ type: code });
  };

  // フリックでレベル/調整痕
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

    if (type === '✖✖') {
      if (absY > absX && dy < -30) {
        quickAdd({ type: '✖✖', note: '調整痕' });
      }
      startX.current = null;
      startY.current = null;
      return;
    }

    if (LEVEL_LABELS[type]) {
      let levelIdx = 0;
      if (absY > absX && dy < -30) levelIdx = 1; // 上
      else if (absX > absY && dx < -30) levelIdx = 2; // 左
      else if (absX > absY && dx > 30) levelIdx = 2; // 右
      else if (absY > absX && dy > 30) levelIdx = 3; // 下

      // Uのタップ（levelIdx===0）はEにする
      if (type === 'U' && levelIdx === 0) {
        quickAdd({ type: 'E' });
      } else {
        const label = LEVEL_LABELS[type][levelIdx] || type;
        quickAdd({ type, level: label.replace(type, '') });
      }
    }
    startX.current = null;
    startY.current = null;
  };

  // Fガラスなら専用選択肢
  const defectTypes = partName === 'Fガラス'
    ? [
        { code: 'G', label: '飛び石A' },
        { code: '✖', label: 'ヒビ' },
        { code: 'Y', label: '割れ' },
      ]
    : USS_DEFECT_TYPES;

  // シンプルなUI
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ width: 320, background: '#fff', borderRadius: 8, padding: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{partName}</div>
        {selectingType ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {defectTypes.map(opt => (
              <button
                key={opt.code}
                onClick={() => { setType(opt.code); setSelectingType(false); }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #2563eb',
                  background: '#e0e7ff',
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: 'pointer'
                }}
              >
                {opt.code}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 32,
                fontWeight: 700,
                userSelect: 'none',
                background: '#f1f5f9',
                borderRadius: 12,
                padding: '18px 0',
                margin: '12px 0',
                touchAction: 'pan-x pan-y'
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                if (type === 'U') quickAdd({ type: 'E' });
                else quickAdd({ type });
              }}
            >
              {type}
            </div>
            <button onClick={() => setSelectingType(true)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', background: '#f8fafc' }}>戻る</button>
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
      {/* 他の項目も追加可 */}
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
            border: "none"
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
        // 展開図や瑕疵入力UI
        <div>
          {/* ここに展開図コンポーネントやDefectInputDialogを配置 */}
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