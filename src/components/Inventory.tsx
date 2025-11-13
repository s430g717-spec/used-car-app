import React, { useState, useEffect } from 'react';
import { CarSpec } from './SpecInput';
import { InspectorReportData } from './InspectorReport';
import { PartDefect } from '../CarPartSelector';

interface InventoryItem {
  id: string;
  carSpec: CarSpec;
  inspectorReport: InspectorReportData;
  defects: PartDefect[];
  createdAt: string;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDefects, setFilterDefects] = useState<'all' | 'none' | 'some'>('all');

  // フィルタリングされたアイテム
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // 検索クエリでフィルター
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.carSpec.name?.toLowerCase().includes(query);
        const matchesModel = item.carSpec.model?.toLowerCase().includes(query);
        const matchesYear = item.carSpec.year?.includes(query);
        const matchesChassis = item.carSpec.chassisNumber?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesModel && !matchesYear && !matchesChassis) {
          return false;
        }
      }

      // 欠陥数でフィルター
      const defectCount = item.defects.length;
      if (filterDefects === 'none' && defectCount > 0) return false;
      if (filterDefects === 'some' && defectCount === 0) return false;

      return true;
    });
  }, [items, searchQuery, filterDefects]);

  const addCurrentToInventory = () => {
    const spec = localStorage.getItem('carSpec');
    const report = localStorage.getItem('inspectorReport');
    const defectsData = localStorage.getItem('partDefects');

    if (!spec && !report && !defectsData) {
      alert('登録するデータがありません');
      return;
    }

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      carSpec: spec ? JSON.parse(spec) : { year: '', model: '', name: '', chassisNumber: '' },
      inspectorReport: report ? JSON.parse(report) : {},
      defects: defectsData ? JSON.parse(defectsData) : [],
      createdAt: new Date().toISOString()
    };

    const updatedItems = [newItem, ...items];
    setItems(updatedItems);
    localStorage.setItem('inventory', JSON.stringify(updatedItems));
    alert('在庫に追加しました');
  };

  const generatePDF = (item: InventoryItem) => {
    // PDF生成（実装は簡易版）
    alert('PDF生成機能は開発中です。鑑定書のプレビューを表示します。');
    setSelectedItem(item);
  };

  const closePreview = () => {
    setSelectedItem(null);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#1e293b', textAlign: 'center' }}>
          在庫管理
        </h2>

        <button
          onClick={addCurrentToInventory}
          style={{
            width: '100%',
            padding: 14,
            marginBottom: 20,
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
          }}
        >
          ➕ 現在のデータを在庫に追加
        </button>

        {/* 検索・フィルターUI */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 車名、型式、年式、車体番号で検索..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              marginBottom: 12,
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFilterDefects('all')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: filterDefects === 'all' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                background: filterDefects === 'all' ? '#eff6ff' : '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: filterDefects === 'all' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              すべて
            </button>
            <button
              onClick={() => setFilterDefects('none')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: filterDefects === 'none' ? '2px solid #10b981' : '2px solid #e2e8f0',
                background: filterDefects === 'none' ? '#f0fdf4' : '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: filterDefects === 'none' ? '#059669' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              欠陥なし
            </button>
            <button
              onClick={() => setFilterDefects('some')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: filterDefects === 'some' ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                background: filterDefects === 'some' ? '#fffbeb' : '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: filterDefects === 'some' ? '#d97706' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              欠陥あり
            </button>
          </div>
        </div>

        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12, fontWeight: 600 }}>
          表示: {filteredItems.length}台 / 全{items.length}台
        </div>

        {filteredItems.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 14
          }}>
            {items.length === 0 ? '在庫データがありません' : '検索結果がありません'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  padding: 16,
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                      {item.carSpec.name || '車名未設定'} ({item.carSpec.year || '-'})
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      型式: {item.carSpec.model || '-'} | 車体番号: {item.carSpec.chassisNumber || '-'}
                    </div>
                  </div>
                  <button
                    onClick={() => generatePDF(item)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📄 鑑定書
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
                  <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 6 }}>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>瑕疵</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.defects.length}箇所</div>
                  </div>
                  <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 6 }}>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>検査項目</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>
                      {Object.values(item.inspectorReport || {}).filter(v => v).length}/12
                    </div>
                  </div>
                  <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 6 }}>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>登録日時</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 11 }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 鑑定書プレビューモーダル */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            overflow: 'auto'
          }}
          onClick={closePreview}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
              padding: '20px 24px',
              marginBottom: 20,
              borderRadius: '12px 12px 0 0',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>中古車オークション出品票</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>車両鑑定書</h2>
              </div>
              <button
                onClick={closePreview}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                ✕ 閉じる
              </button>
            </div>

            {/* 車両基本情報 - オークションシート風 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 1, 
              marginBottom: 20,
              border: '2px solid #1e40af',
              background: '#1e40af'
            }}>
              <div style={{ background: '#eff6ff', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 700, marginBottom: 4 }}>車名</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                  {selectedItem.carSpec.name || '-'}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>年式</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                  {selectedItem.carSpec.year || '-'}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>型式</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                  {selectedItem.carSpec.model || '-'}
                </div>
              </div>
              <div style={{ background: '#eff6ff', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 700, marginBottom: 4 }}>車台番号</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                  {selectedItem.carSpec.chassisNumber || '-'}
                </div>
              </div>
            </div>

            {/* 評価点数エリア */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              marginBottom: 20,
              padding: 20,
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '3px solid #f59e0b',
              borderRadius: 8
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>外装評価</div>
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: 900, 
                  color: '#b45309',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {selectedItem.defects.length === 0 ? '5.0' : selectedItem.defects.length <= 2 ? '4.5' : selectedItem.defects.length <= 5 ? '4.0' : '3.5'}
                </div>
              </div>
              <div style={{ 
                width: 2, 
                background: 'rgba(146, 64, 14, 0.3)' 
              }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>総合評価</div>
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: 900, 
                  color: '#b45309',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {selectedItem.defects.length === 0 ? 'S' : selectedItem.defects.length <= 2 ? 'A' : selectedItem.defects.length <= 5 ? 'B' : 'C'}
                </div>
              </div>
            </div>

            {/* 瑕疵一覧 - グリッド表示 */}
            <div style={{ 
              marginBottom: 20,
              border: '2px solid #dc2626',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#dc2626', 
                color: '#fff', 
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                📋 瑕疵・修復歴
              </div>
              <div style={{ background: '#fff' }}>
                {selectedItem.defects.length === 0 ? (
                  <div style={{ 
                    padding: 24, 
                    textAlign: 'center',
                    color: '#10b981',
                    fontSize: 16,
                    fontWeight: 700
                  }}>
                    ✓ 瑕疵なし（良好）
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1,
                    background: '#e5e7eb',
                    padding: 1
                  }}>
                    {selectedItem.defects.map((defect, idx) => (
                      <div key={idx} style={{ 
                        background: '#fff',
                        padding: 12
                      }}>
                        <div style={{ 
                          fontSize: 11, 
                          color: '#6b7280',
                          fontWeight: 600,
                          marginBottom: 6
                        }}>
                          {defect.part}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {defect.defects.map((d, i) => (
                            <div
                              key={i}
                              style={{
                                padding: '4px 8px',
                                background: '#fee2e2',
                                border: '1px solid #dc2626',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#991b1b',
                                textAlign: 'center'
                              }}
                            >
                              {d.type}{d.level || ''}{d.note ? ` (${d.note})` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 検査員コメント */}
            <div style={{ 
              marginBottom: 20,
              border: '2px solid #3b82f6',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: '#3b82f6', 
                color: '#fff', 
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                💬 検査員コメント
              </div>
              <div style={{ 
                background: '#fff',
                padding: 16,
                fontSize: 13, 
                lineHeight: '1.7', 
                whiteSpace: 'pre-wrap',
                minHeight: 80,
                color: '#1e293b'
              }}>
                {selectedItem.inspectorReport?.content || '特記事項なし'}
              </div>
            </div>

            <button
              onClick={() => {
                alert('PDF出力機能は開発中です。実装にはjsPDFなどのライブラリが必要です。');
              }}
              style={{
                width: '100%',
                padding: 14,
                marginTop: 24,
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
              }}
            >
              📄 PDFとしてダウンロード
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

