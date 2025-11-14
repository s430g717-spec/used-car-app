import React, { useState } from 'react';

export interface InspectorReportData {
  content: string;
  overallRating?: string;
  interiorRating?: string;
}

export function InspectorReport() {
  const [report, setReport] = useState<InspectorReportData>(() => {
    const saved = localStorage.getItem('inspectorReport');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved report', e);
      }
    }
    return { content: '', overallRating: '', interiorRating: '' };
  });

  // 瑕疵データを取得
  const [partDefects, setPartDefects] = useState<any[]>(() => {
    const saved = localStorage.getItem('partDefects');
    return saved ? JSON.parse(saved) : [];
  });

  // partDefects の変更を監視
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('partDefects');
      if (saved) {
        setPartDefects(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 自動保存機能
  React.useEffect(() => {
    localStorage.setItem('inspectorReport', JSON.stringify(report));
  }, [report]);

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか？')) {
      const emptyReport = { content: '', overallRating: '', interiorRating: '' };
      setReport(emptyReport);
      localStorage.setItem('inspectorReport', JSON.stringify(emptyReport));
    }
  };

  const charCount = report.content.length;

  // 参考値を計算
  const calculateSuggestedRating = React.useMemo(() => {
    const allDefects: any[] = [];
    partDefects.forEach((pd: any) => {
      pd.defects.forEach((d: any) => {
        allDefects.push({ ...d, part: pd.part });
      });
    });

    // レベルなしのA（キズ）の数
    const levellessA = allDefects.filter(d => d.type === 'A' && !d.level).length;
    
    // レベル1（E1相当）の数
    const level1Count = allDefects.filter(d => d.level === '1').length;
    
    // レベル2（E2相当）の数
    const level2Count = allDefects.filter(d => d.level === '2').length;
    
    // レベル1を持つパネル数
    const level1Panels = new Set(
      allDefects.filter(d => d.level === '1').map(d => d.part)
    ).size;

    // 判定ロジック
    if (levellessA === 0 && level1Count === 0 && level2Count === 0) {
      return '6点 （瑕疵なし）';
    }
    if (levellessA <= 1 && level1Count === 0 && level2Count === 0) {
      return '6点 （レベルなしA 1つまで）';
    }
    if (level1Count <= 2 && level2Count === 0) {
      return '5点 （レベル1 2つまで）';
    }
    if (level1Panels <= 8 && level2Count <= 1) {
      return '4.5点 （レベル1 8パネルまで / レベル2 1つまで）';
    }
    
    return '4点以下 （上記基準を超過）';
  }, [partDefects]);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1e293b', textAlign: 'center' }}>
          検査員報告
        </h2>
        
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
          車両の検査結果を自由に入力してください
        </p>

        <div style={{ marginBottom: 12, padding: 12, background: '#dbeafe', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>
            💡 総合評価 参考値（減点方式）
          </div>
          <div style={{ fontSize: 15, color: '#1e3a8a', fontWeight: 700 }}>
            {calculateSuggestedRating}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              総合評価
            </label>
            <select
              value={report.overallRating || ''}
              onChange={(e) => setReport({ ...report, overallRating: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#fff',
                outline: 'none'
              }}
            >
              <option value="">-</option>
              <option value="S点">S点</option>
              <option value="6点">6点</option>
              <option value="5点">5点</option>
              <option value="4.5点">4.5点</option>
              <option value="4点">4点</option>
              <option value="3.5点">3.5点</option>
              <option value="3点">3点</option>
              <option value="R点">R点</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              内装補助評価
            </label>
            <select
              value={report.interiorRating || ''}
              onChange={(e) => setReport({ ...report, interiorRating: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '2px solid #e2e8f0',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#fff',
                outline: 'none'
              }}
            >
              <option value="">-</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>文字数</div>
          <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 700, marginTop: 4 }}>
            {charCount} 文字
          </div>
        </div>

        <div>
          <textarea
            value={report.content}
            onChange={(e) => setReport({ content: e.target.value })}
            placeholder="検査結果、コメント、特記事項などを自由に入力してください..."
            rows={15}
            style={{
              width: '100%',
              fontSize: 15,
              padding: '12px 14px',
              borderRadius: 8,
              border: '2px solid #e2e8f0',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: '1.6'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
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
              cursor: 'pointer'
            }}
          >
            クリア
          </button>
          <div
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>✓</span>
            <span>自動保存中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
