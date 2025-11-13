import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CarSpec } from './SpecInput';
import { PartDefect } from '../CarPartSelector';

interface PDFExportProps {
  carSpec: CarSpec;
  partDefects: PartDefect[];
  inspectorReport: string;
  onExport?: () => void;
}

export function PDFExport({ carSpec, partDefects, inspectorReport, onExport }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [diagramImage, setDiagramImage] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // 展開図をキャプチャ
  React.useEffect(() => {
    const captureDiagram = async () => {
      const diagramElement = document.querySelector('[data-diagram="car-parts"]') as HTMLElement;
      if (diagramElement) {
        try {
          const canvas = await html2canvas(diagramElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          setDiagramImage(canvas.toDataURL('image/png'));
        } catch (error) {
          console.error('展開図キャプチャエラー:', error);
        }
      }
    };
    
    if (!isGenerating) {
      captureDiagram();
    }
  }, [partDefects, isGenerating]);

  const generatePDF = async () => {
    if (!previewRef.current) return;
    
    setIsGenerating(true);
    try {
      // A4サイズ (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      // プレビュー要素をキャンバスに変換
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20; // 左右10mmマージン
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 画像をPDFに追加
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // ファイル名生成
      const fileName = `鑑定書_${carSpec.name || '車両'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      if (onExport) onExport();
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // 展開図の欠陥マップ生成
  const defectMap = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    partDefects.forEach(pd => {
      map[pd.part] = pd.defects.map(d => `${d.type}${d.level || ''}`);
    });
    return map;
  }, [partDefects]);

  // 部位名のマッピング
  const partLabels: Record<string, string> = {
    'front-bumper': 'Fバンパー',
    'hood': 'ボンネット',
    'front-glass': 'Fガラス',
    'roof': 'ルーフ',
    'right-front-fender': '右Fフェンダー',
    'right-front-door': '右Fドア',
    'right-rear-door': '右Rドア',
    'right-rear-fender': '右Rフェンダー',
    'rear-gate': 'Rゲート',
    'rear-bumper': 'Rバンパー',
    'left-rear-fender': '左Rフェンダー',
    'left-rear-door': '左Rドア',
    'left-front-door': '左Fドア',
    'left-front-fender': '左Fフェンダー',
    'left-step': '左ステップ',
    'right-step': '右ステップ'
  };

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 8,
          border: 'none',
          background: isGenerating ? '#94a3b8' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
          marginBottom: 20
        }}
      >
        {isGenerating ? '📄 PDF生成中...' : '📄 鑑定書をPDF出力'}
      </button>

      {/* PDF プレビュー（非表示で生成用） */}
      <div
        ref={previewRef}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: '#fff',
          padding: '15mm',
          margin: '0 auto',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          display: isGenerating ? 'block' : 'none'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          borderBottom: '3px solid #dc2626',
          paddingBottom: 10,
          marginBottom: 15
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1e293b',
            margin: 0,
            textAlign: 'center'
          }}>
            車両鑑定書
          </h1>
          <div style={{
            fontSize: 11,
            color: '#64748b',
            textAlign: 'right',
            marginTop: 5
          }}>
            発行日: {new Date().toLocaleDateString('ja-JP')}
          </div>
        </div>

        {/* 諸元情報 */}
        <div style={{
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
          background: '#f8fafc'
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#475569',
            margin: '0 0 10px 0',
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: 5
          }}>
            車両諸元
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            fontSize: 11
          }}>
            <div><strong>年式:</strong> {carSpec.year || '-'}</div>
            <div><strong>型式:</strong> {carSpec.model || '-'}</div>
            <div><strong>車名:</strong> {carSpec.name || '-'}</div>
            <div><strong>グレード:</strong> {carSpec.grade || '-'}</div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>車体番号:</strong> {carSpec.chassisNumber || '-'}
            </div>
          </div>
        </div>

        {/* メインコンテンツ（2カラム） */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 15,
          marginBottom: 15
        }}>
          {/* 左: 検査員報告 */}
          <div>
            <div style={{
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
              height: '100%',
              background: '#fff'
            }}>
              <h2 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#475569',
                margin: '0 0 10px 0',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 5
              }}>
                検査員報告
              </h2>
              <div style={{
                fontSize: 10,
                color: '#1e293b',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {inspectorReport || '報告なし'}
              </div>
            </div>
          </div>

          {/* 右: 展開図（画像） */}
          <div>
            <div style={{
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
              background: '#fff'
            }}>
              <h2 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#475569',
                margin: '0 0 10px 0',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 5
              }}>
                外装評価（展開図）
              </h2>
              {diagramImage ? (
                <img 
                  src={diagramImage} 
                  alt="車両展開図"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 4
                  }}
                />
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                  fontSize: 9
                }}>
                  {Object.entries(partLabels).map(([id, label]) => {
                    const defects = defectMap[id];
                    return (
                      <div
                        key={id}
                        style={{
                          padding: 6,
                          border: defects && defects.length > 0 ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                          borderRadius: 4,
                          background: defects && defects.length > 0 ? '#fef2f2' : '#fff'
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                        <div style={{ color: '#dc2626', fontWeight: 700 }}>
                          {defects && defects.length > 0 ? defects.join(' ') : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 評価サマリー */}
        <div style={{
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
          background: '#f8fafc'
        }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#475569',
            margin: '0 0 10px 0'
          }}>
            評価サマリー
          </h2>
          <div style={{ fontSize: 10, lineHeight: 1.6 }}>
            <div><strong>総欠陥数:</strong> {partDefects.reduce((sum, pd) => sum + pd.defects.length, 0)}件</div>
            <div><strong>該当部位数:</strong> {partDefects.length}箇所</div>
          </div>
        </div>

        {/* フッター */}
        <div style={{
          borderTop: '2px solid #e2e8f0',
          paddingTop: 10,
          marginTop: 20,
          fontSize: 9,
          color: '#64748b',
          textAlign: 'center'
        }}>
          本鑑定書は車両外装の状態を記録したものです。<br />
          発行日時点の情報に基づいています。
        </div>
      </div>
    </div>
  );
}
