import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CarSpec } from './SpecInput';
import { InspectorReportData } from './InspectorReport';
import { PartDefect } from '../CarPartSelector';

interface InventoryItem {
  id: string;
  storeId: string;
  createdBy: string;
  createdAt: string;
  carSpec: CarSpec;
  inspectorReport: InspectorReportData;
  defects: PartDefect[];
  certificationStatus: 'NONE' | 'REQUESTED' | 'CERTIFIED';
  certifiedBy: string | null;
}

const USS_DEFECT_TYPES = [
  { code: 'A', label: 'キズ' },
  { code: 'U', label: '凹み' },
  { code: 'W', label: '補修' },
  { code: 'S', label: 'サビ' },
  { code: '✖✖', label: '交換' },
  { code: 'B', label: 'キズ凹' },
  { code: 'C', label: '腐食' },
  { code: 'Y', label: '割れ' },
  { code: 'G', label: '飛び石' },
  { code: '✖', label: 'ヒビ' },
];

const LEVEL_LABELS = {
  'A': ['A', 'A1', 'A2', 'A3'],
  'U': ['U', 'U1', 'U2', 'U3'],
  'B': ['B', 'B1', 'B2', 'B3'],
  'C': ['C', 'C1', 'C2', 'C3'],
  'S': ['S', 'S1', 'S2', 'S3'],
  'Y': ['Y', 'Y1', 'Y2', 'Y3'],
  'G': ['G'],
  '✖': ['✖'],
};

export function Inventory() {
  const { currentUser, userData } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDefects, setFilterDefects] = useState<'all' | 'none' | 'some'>('all');
  const [loading, setLoading] = useState(true);

  // Firestoreからデータを取得（useEffectの外に移動）
  const fetchItems = async () => {
    if (!userData?.storeId) {
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(db, 'appraisals'),
        where('storeId', '==', userData.storeId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setItems(fetchedItems);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [userData?.storeId]);

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

  // Firestoreに保存
  const addCurrentToInventory = async () => {
    // デバッグalertを削除
    
    if (!currentUser) {
      alert('ログインしていません。ページを再読み込みしてください。');
      return;
    }
    
    if (!userData) {
      alert('ユーザー情報を読み込み中です。数秒待ってから再度お試しください。');
      return;
    }
    
    if (!userData.storeId) {
      alert(`店舗IDが設定されていません。管理者に連絡してください。`);
      return;
    }

    const spec = localStorage.getItem('carSpec');
    const report = localStorage.getItem('inspectorReport');
    const defectsData = localStorage.getItem('partDefects');

    console.log('LocalStorage carSpec:', spec);
    console.log('LocalStorage inspectorReport:', report);
    console.log('LocalStorage partDefects:', defectsData);

    if (!spec && !report && !defectsData) {
      alert('登録するデータがありません');
      return;
    }

    try {
      const newItem = {
        storeId: userData.storeId,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        carSpec: spec ? JSON.parse(spec) : { year: '', model: '', name: '', chassisNumber: '', mileage: '' },
        inspectorReport: report ? JSON.parse(report) : {},
        defects: defectsData ? JSON.parse(defectsData) : [],
        certificationStatus: 'NONE' as const,
        certifiedBy: null
      };

      console.log('保存するデータ:', newItem);

      await addDoc(collection(db, 'appraisals'), newItem);
      
      console.log('Firestore保存成功');
      
      // LocalStorageをクリア
      localStorage.removeItem('carSpec');
      localStorage.removeItem('inspectorReport');
      localStorage.removeItem('partDefects');
      localStorage.removeItem('diagramImage');
      
      // リストを再取得
      await fetchItems();
      
      window.dispatchEvent(new Event('storage'));
      alert('Firestoreに保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました: ${error}`);
    }
  };

  const generatePDF = async (item: InventoryItem) => {
    try {
      const { generateInspectionPDF } = await import('../utils/pdfGenerator');
      const diagramImage = localStorage.getItem('diagramImage');
      await generateInspectionPDF(item.carSpec, item.defects, item.inspectorReport, diagramImage);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  const editItem = (item: InventoryItem) => {
    if (confirm('この車両データを編集モードに読み込みますか？')) {
      localStorage.setItem('carSpec', JSON.stringify(item.carSpec));
      localStorage.setItem('inspectorReport', JSON.stringify(item.inspectorReport));
      localStorage.setItem('partDefects', JSON.stringify(item.defects));
      window.dispatchEvent(new Event('storage'));
      alert('データを読み込みました。各入力画面で編集してください。');
    }
  };

  const deleteItem = async (item: InventoryItem) => {
    // 変更前: 末尾${item.carSpec.chassisNumber?.slice(-4) || '-'}
    // 変更後: ${item.carSpec.chassisNumber?.slice(-4) || '-'}
    if (confirm(`${item.carSpec.name || '車両'}（${item.carSpec.chassisNumber?.slice(-4) || '-'}）を削除しますか？`)) {
      try {
        await deleteDoc(doc(db, 'appraisals', item.id));
        setItems(items.filter(i => i.id !== item.id));
        alert('削除しました');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const requestCertification = async (item: InventoryItem) => {
    if (!confirm(`${item.carSpec.name} の認定を依頼しますか？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'appraisals', item.id), {
        certificationStatus: 'REQUESTED',
        requestedAt: new Date().toISOString()
      });

      alert('認定を依頼しました');
      // リストを再取得
      fetchItems();
    } catch (error) {
      console.error('依頼エラー:', error);
      alert('認定依頼に失敗しました');
    }
  };

  const closePreview = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1e293b', textAlign: 'center' }}>
          在庫管理
        </h2>

        <div style={{ textAlign: 'center', marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            <strong>鑑定料金:</strong> ¥1,500/台 | <strong>在庫数:</strong> {items.length}台 | <strong>合計:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>¥{(items.length * 1500).toLocaleString()}</span>
          </div>
        </div>

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
          ➕ 現在のデータをFirestoreに保存
        </button>

        {items.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 14
          }}>
            在庫データがありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  padding: 16,
                  border: '1px solid #e2e8f0', // 2pxから1pxに変更
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      {item.carSpec.name || '-'} 
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 12 }}>
                        {item.carSpec.chassisNumber 
                          ? item.carSpec.chassisNumber.slice(-4)
                          : '-'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(item.createdAt).toLocaleDateString('ja-JP', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); generatePDF(item); }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #c9a961 0%, #a08040 100%)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(201,169,97,0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); editItem(item); }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✏️ 編集
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🗑️ 削除
                    </button>
                    {item.certificationStatus === 'NONE' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); requestCertification(item); }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(56,189,248,0.3)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ✔️ 認定依頼
                      </button>
                    )}
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

