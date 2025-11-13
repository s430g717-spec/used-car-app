import React, { useState, lazy, Suspense } from 'react';
import CarPartSelector, { PartDefect } from './CarPartSelector';
import { SpecInput, CarSpec } from './components/SpecInput';
import { InspectorReport } from './components/InspectorReport';
import { Inventory } from './components/Inventory';
import { PDFExport } from './components/PDFExport';

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagram' | 'spec' | 'report' | 'inventory' | 'export'>('diagram');
  const touchStartX = React.useRef<number>(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'diagram', label: '🚗 展開図' },
    { id: 'spec', label: '📝 諸元' },
    { id: 'report', label: '🔍 検査報告' },
    { id: 'inventory', label: '📦 在庫管理' },
    { id: 'export', label: '📄 PDF出力' }
  ];

  // スワイプジェスチャーでタブ切り替え
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50; // 最小スワイプ距離

    if (Math.abs(diff) > threshold) {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      
      if (diff > 0 && currentIndex < tabs.length - 1) {
        // 左スワイプ → 次のタブ
        setActiveTab(tabs[currentIndex + 1].id as any);
      } else if (diff < 0 && currentIndex > 0) {
        // 右スワイプ → 前のタブ
        setActiveTab(tabs[currentIndex - 1].id as any);
      }
    }
  };

  const renderContent = () => {
    // LocalStorageからデータ取得
    const carSpec: CarSpec = JSON.parse(localStorage.getItem('carSpec') || '{}');
    const partDefects: PartDefect[] = JSON.parse(localStorage.getItem('partDefects') || '[]');
    const inspectorReport = localStorage.getItem('inspectorReport') || '';

    switch(activeTab) {
      case 'diagram':
        return <CarPartSelector />;
      case 'spec':
        return <SpecInput />;
      case 'report':
        return <InspectorReport />;
      case 'inventory':
        return <Inventory />;
      case 'export':
        return (
          <PDFExport
            carSpec={carSpec}
            partDefects={partDefects}
            inspectorReport={inspectorReport}
            onExport={() => alert('PDFを保存しました')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* タブナビゲーション */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        borderBottom: '2px solid #e2e8f0',
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          maxWidth: 1000,
          margin: '0 auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '14px 8px',
                border: 'none',
                background: activeTab === tab.id ? '#fff' : '#f8fafc',
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div 
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          paddingTop: 16,
          touchAction: 'pan-y' // 縦スクロールは許可、横スワイプを検知
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
