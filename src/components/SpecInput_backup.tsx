import React, { useState } from 'react';

export interface CarSpec {
  year: string;
  model: string;
  name: string;
  chassisNumber: string;
}

export function SpecInput() {
  const [spec, setSpec] = useState<CarSpec>({
    year: '',
    model: '',
    name: '',
    chassisNumber: ''
  });

  const handleInput = (key: keyof CarSpec, value: string) => {
    setSpec({ ...spec, [key]: value });
  };

  const handleSave = () => {
    // LocalStorageに保存
    localStorage.setItem('carSpec', JSON.stringify(spec));
    alert('諸元を保存しました');
  };

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか？')) {
      setSpec({
        year: '',
        model: '',
        name: '',
        chassisNumber: ''
      });
    }
  };

  // ページ読み込み時にLocalStorageから復元
  React.useEffect(() => {
    const saved = localStorage.getItem('carSpec');
    if (saved) {
      try {
        setSpec(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved spec', e);
      }
    }
  }, []);

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          color: '#1e293b',
          textAlign: 'center'
        }}>
          車両諸元入力
        </h2>
        
        <p style={{
          fontSize: 13,
          color: '#64748b',
          textAlign: 'center',
          marginBottom: 24
        }}>
          車両の基本情報を入力してください
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 年式 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              年式
            </label>
            <input
              type="text"
              value={spec.year}
              onChange={(e) => handleInput('year', e.target.value)}
              placeholder="例: 2021"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 型式 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              型式
            </label>
            <input
              type="text"
              value={spec.model}
              onChange={(e) => handleInput('model', e.target.value)}
              placeholder="例: DBA-ABC123"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 車名 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              車名
            </label>
            <input
              type="text"
              value={spec.name}
              onChange={(e) => handleInput('name', e.target.value)}
              placeholder="例: カローラ"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 車体番号 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6
            }}>
              車体番号
            </label>
            <input
              type="text"
              value={spec.chassisNumber}
              onChange={(e) => handleInput('chassisNumber', e.target.value)}
              placeholder="例: ABC-1234567"
              style={{
                width: '100%',
                fontSize: 16,
                padding: '12px 14px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {/* ボタン */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 24
        }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 8,
              border: '2px solid #e2e8f0',
              background: '#fff',
              fontSize: 16,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            クリア
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            保存
          </button>
        </div>

        {/* 入力状況 */}
        <div style={{
          marginTop: 20,
          padding: 12,
          background: '#f8fafc',
          borderRadius: 8,
          fontSize: 12,
          color: '#64748b'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>入力状況</div>
          <div>
            {[spec.year, spec.model, spec.name, spec.chassisNumber].filter(v => v).length}/4 項目入力済み
          </div>
        </div>
      </div>
    </div>
  );
}
