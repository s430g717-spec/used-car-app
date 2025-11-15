import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { UserType } from './types/user';
import { LoginPage } from './components/LoginPage';
import CarPartSelector from './CarPartSelector';
import { SpecInput } from './components/SpecInput';
import { InspectorReport } from './components/InspectorReport';
import { Inventory } from './components/Inventory';
import { PDFExport } from './components/PDFExport';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

interface CarSpec {
  year: string;
  model: string;
  name: string;
  grade: string;
  chassisNumber: string;
  mileage: string;
  frontImage: string;
  rearImage: string;
}

interface PartDefect {
  id: string;
  category: string;
  grade: string;
}

interface AppraisalItem {
  id: string;
  storeId: string;
  createdBy: string;
  createdAt: string;
  carSpec: {
    year: string;
    model: string;
    name: string;
    chassisNumber: string;
    mileage: string;
  };
  inspectorReport: {
    content?: string;
    overallRating?: string;
    interiorRating?: string;
  };
  defects: Array<{
    part: string;
    defects: Array<{
      type: string;
      level?: string;
      note?: string;
    }>;
  }>;
  certificationStatus: 'NONE' | 'REQUESTED' | 'CERTIFIED';
  certifiedBy: string | null;
  certifiedAt?: string;
}

// 公認鑑定士用ダッシュボード
const CertifiedAppraiserDashboard: React.FC = () => {
  const { logout, userData, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'certified'>('pending');
  const [pendingItems, setPendingItems] = useState<AppraisalItem[]>([]);
  const [certifiedItems, setCertifiedItems] = useState<AppraisalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AppraisalItem | null>(null);

  // データ取得
  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      // 認定依頼中の鑑定書を取得
      const pendingQuery = query(
        collection(db, 'appraisals'),
        where('certificationStatus', '==', 'REQUESTED')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pending = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppraisalItem[];
      setPendingItems(pending);

      // 自分が認定した鑑定書を取得
      if (currentUser) {
        const certifiedQuery = query(
          collection(db, 'appraisals'),
          where('certificationStatus', '==', 'CERTIFIED'),
          where('certifiedBy', '==', currentUser.uid)
        );
        const certifiedSnapshot = await getDocs(certifiedQuery);
        const certified = certifiedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AppraisalItem[];
        setCertifiedItems(certified);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 認定処理
  const certifyAppraisal = async (item: AppraisalItem) => {
    if (!currentUser || !userData) {
      alert('ユーザー情報が取得できません');
      return;
    }

    if (!confirm(`${item.carSpec.name} の鑑定書を認定しますか？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'appraisals', item.id), {
        certificationStatus: 'CERTIFIED',
        certifiedBy: currentUser.uid,
        certifiedByName: userData.name,
        certifiedAt: new Date().toISOString()
      });

      alert('鑑定書を認定しました');
      fetchAppraisals();
      setSelectedItem(null);
    } catch (error) {
      console.error('認定エラー:', error);
      alert('認定に失敗しました');
    }
  };

  // 認定取り消し
  const uncertifyAppraisal = async (item: AppraisalItem) => {
    if (!confirm(`${item.carSpec.name} の認定を取り消しますか？`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'appraisals', item.id), {
        certificationStatus: 'REQUESTED',
        certifiedBy: null,
        certifiedByName: null,
        certifiedAt: null
      });

      alert('認定を取り消しました');
      fetchAppraisals();
      setSelectedItem(null);
    } catch (error) {
      console.error('取り消しエラー:', error);
      alert('取り消しに失敗しました');
    }
  };

  const getStoreNameById = (storeId: string) => {
    const storeMap: { [key: string]: string } = {
      'youpos-hakata': 'ユーポス博多',
      'youpos-hikarinomori': 'ユーポス光の森',
      'youpos-fukuokahigashi': 'ユーポス福岡東'
    };
    return storeMap[storeId] || storeId;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  const displayItems = activeTab === 'pending' ? pendingItems : certifiedItems;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* ヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        padding: '20px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>公認鑑定士</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              🏆 {userData?.name} 様
            </h2>
          </div>
          <button onClick={logout} style={{ 
            padding: '8px 16px', 
            cursor: 'pointer',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: 14,
            fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}>
            ログアウト
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div style={{ maxWidth: 1200, margin: '20px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 8 }}>認定依頼中</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{pendingItems.length}</div>
          </div>
          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #10b981'
          }}>
            <div style={{ fontSize: 13, color: '#065f46', fontWeight: 600, marginBottom: 8 }}>認定済み</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{certifiedItems.length}</div>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: activeTab === 'pending' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : '#fff',
              color: activeTab === 'pending' ? '#fff' : '#64748b',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 8,
              boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            🔔 認定依頼中 ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('certified')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: activeTab === 'certified' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#fff',
              color: activeTab === 'certified' ? '#fff' : '#64748b',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 8,
              boxShadow: activeTab === 'certified' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            ✅ 認定済み ({certifiedItems.length})
          </button>
        </div>
      </div>

      {/* 鑑定書一覧 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px' }}>
        {displayItems.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: 60,
            borderRadius: 12,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 15
          }}>
            {activeTab === 'pending' ? '認定依頼はありません' : '認定済み鑑定書はありません'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '2px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                      {item.carSpec.name || '-'}
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 12 }}>
                        {item.carSpec.chassisNumber ? `末尾 ${item.carSpec.chassisNumber.slice(-4)}` : '-'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      {getStoreNameById(item.storeId)} | {new Date(item.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: item.defects.length === 0 ? '#d1fae5' : '#fee2e2',
                    color: item.defects.length === 0 ? '#065f46' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    瑕疵 {item.defects.reduce((sum, d) => sum + d.defects.length, 0)}件
                  </div>
                </div>
                
                {activeTab === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      certifyAppraisal(item);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 8,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                    }}
                  >
                    🏆 この鑑定書を認定する
                  </button>
                )}
                
                {activeTab === 'certified' && item.certifiedAt && (
                  <div style={{ 
                    fontSize: 12, 
                    color: '#059669',
                    fontWeight: 600,
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>✓ {new Date(item.certifiedAt).toLocaleString('ja-JP')} に認定</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uncertifyAppraisal(item);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #ef4444',
                        background: '#fff',
                        color: '#ef4444',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      認定取り消し
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 詳細モーダル（プレビュー） */}
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
          onClick={() => setSelectedItem(null)}
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
            <div style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', 
              padding: '20px 24px',
              marginBottom: 20,
              borderRadius: '12px 12px 0 0',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>公認鑑定士 詳細確認</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>車両鑑定書</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
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

            {/* 車両情報 */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>車両情報</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 14 }}>
                <div><strong>車名:</strong> {selectedItem.carSpec.name}</div>
                <div><strong>年式:</strong> {selectedItem.carSpec.year}</div>
                <div><strong>型式:</strong> {selectedItem.carSpec.model}</div>
                <div><strong>走行距離:</strong> {selectedItem.carSpec.mileage}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>車台番号:</strong> {selectedItem.carSpec.chassisNumber}
                </div>
              </div>
            </div>

            {/* 瑕疵情報 */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>瑕疵情報</h3>
              {selectedItem.defects.length === 0 ? (
                <div style={{ padding: 16, background: '#d1fae5', borderRadius: 8, color: '#065f46', fontWeight: 600 }}>
                  ✓ 瑕疵なし
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedItem.defects.map((defect, idx) => (
                    <div key={idx} style={{ padding: 12, background: '#fee2e2', borderRadius: 8, border: '1px solid #dc2626' }}>
                      <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>{defect.part}</div>
                      {defect.defects.map((d, i) => (
                        <div key={i} style={{ fontSize: 13, color: '#7f1d1d' }}>
                          • {d.type}{d.level || ''}{d.note ? ` (${d.note})` : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 検査員コメント */}
            {selectedItem.inspectorReport?.content && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>検査員コメント</h3>
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
                  {selectedItem.inspectorReport.content}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            {activeTab === 'pending' && (
              <button
                onClick={() => certifyAppraisal(selectedItem)}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: 20,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                }}
              >
                🏆 この鑑定書を認定する
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 店舗ユーザー用ダッシュボード（タブ切り替え機能付き）
const StoreDashboard: React.FC = () => {
  const { logout, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'diagram' | 'spec' | 'report' | 'inventory' | 'export'>('diagram');
  const touchStartX = React.useRef<number>(0);

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
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id as any);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id as any);
      }
    }
  };

  const renderContent = () => {
    const carSpecRaw = localStorage.getItem('carSpec') || '{}';
    let carSpec: CarSpec;
    try {
      carSpec = JSON.parse(carSpecRaw);
      if (!carSpec.frontImage) carSpec.frontImage = '';
      if (!carSpec.rearImage) carSpec.rearImage = '';
    } catch (e) {
      carSpec = { 
        year: '', model: '', name: '', grade: '', 
        chassisNumber: '', mileage: '', frontImage: '', rearImage: ''
      };
    }
    
    const partDefects: PartDefect[] = JSON.parse(localStorage.getItem('partDefects') || '[]');
    const inspectorReportRaw = localStorage.getItem('inspectorReport') || '{"content":"","overallRating":"","interiorRating":""}';
    
    let inspectorReport;
    try {
      inspectorReport = JSON.parse(inspectorReportRaw);
    } catch (e) {
      inspectorReport = { content: '', overallRating: '', interiorRating: '' };
    }

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
      {/* ヘッダー */}
      <div style={{
        background: '#fff',
        padding: '12px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontWeight: 600 }}>{userData?.name}</span>
          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '14px' }}>
            ({userData?.storeId})
          </span>
        </div>
        <button onClick={logout} style={{ 
          padding: '6px 12px', 
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          background: '#fff',
          borderRadius: '4px'
        }}>
          ログアウト
        </button>
      </div>

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          paddingTop: 16,
          touchAction: 'pan-y'
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

// メインコンポーネント
const AppContent: React.FC = () => {
  const { currentUser, userType, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未ログイン
  if (!currentUser) {
    return <LoginPage />;
  }

  // 公認鑑定士
  if (userType === UserType.CERTIFIED_APPRAISER) {
    return <CertifiedAppraiserDashboard />;
  }

  // 店舗ユーザー・管理者
  return <StoreDashboard />;
};

// ルートコンポーネント
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}