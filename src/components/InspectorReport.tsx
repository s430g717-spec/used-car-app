import React, { useState } from 'react';

export interface InspectorReportData {
  content: string;
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
    return { content: '' };
  });

  // 自動保存機能
  React.useEffect(() => {
    localStorage.setItem('inspectorReport', JSON.stringify(report));
  }, [report]);

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか？')) {
      const emptyReport = { content: '' };
      setReport(emptyReport);
      localStorage.setItem('inspectorReport', JSON.stringify(emptyReport));
    }
  };

  const charCount = report.content.length;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1e293b', textAlign: 'center' }}>
          検査員報告
        </h2>
        
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
          車両の検査結果を自由に入力してください
        </p>

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
