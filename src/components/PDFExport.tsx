import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CarSpec } from './SpecInput';
import { PartDefect } from '../CarPartSelector';
import { InspectorReportData } from './InspectorReport';

interface PDFExportProps {
  carSpec: CarSpec;
  partDefects: PartDefect[];
  inspectorReport: InspectorReportData | string;
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
    if (!previewRef.current) {
      alert('プレビューエリアが見つかりません');
      return;
    }
    
    setIsGenerating(true);
    try {
      // 少し待機してレンダリングを確実にする
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // A4サイズ (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      // プレビュー要素をキャンバスに変換
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight
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
      alert('PDFを保存しました');
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert(`PDF生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
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
    <div style={{ padding: 20, background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      {/* プレミアムボタン */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: 18,
          borderRadius: 12,
          border: '3px solid #c9a961',
          background: isGenerating 
            ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' 
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          fontSize: 18,
          fontWeight: 900,
          color: '#c9a961',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          boxShadow: isGenerating 
            ? '0 4px 12px rgba(108,117,125,0.3)'
            : '0 6px 20px rgba(201,169,97,0.4)',
          marginBottom: 24,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: 2,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #c9a961 0%, #f4e5c3 50%, #c9a961 100%)'
        }}></div>
        {isGenerating ? '⏳ 高品質PDF生成中...' : '📄 プレミアム鑑定書をPDF出力'}
      </button>

      {/* プロフェッショナル鑑定書 */}
      <div
        ref={previewRef}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
          padding: '12mm',
          margin: '0 auto',
          boxSizing: 'border-box',
          fontFamily: '"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          opacity: isGenerating ? 0.5 : 1,
          pointerEvents: isGenerating ? 'none' : 'auto',
          border: '1px solid #e0e0e0'
        }}
      >
        {/* 高級感あるヘッダー */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '16px 20px',
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #c9a961',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #c9a961 0%, #f4e5c3 50%, #c9a961 100%)'
          }}></div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#c9a961',
                margin: 0,
                letterSpacing: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                車両品質鑑定書
              </h1>
              <div style={{
                fontSize: 11,
                color: '#f4e5c3',
                marginTop: 4,
                letterSpacing: 1.5,
                fontWeight: 500
              }}>
                VEHICLE QUALITY INSPECTION CERTIFICATE
              </div>
            </div>
            <div style={{
              textAlign: 'right'
            }}>
              <div style={{
                fontSize: 10,
                color: '#f4e5c3',
                marginBottom: 4,
                fontWeight: 600
              }}>
                検査実施日
              </div>
              <div style={{
                fontSize: 14,
                color: '#fff',
                fontWeight: 900,
                letterSpacing: 1
              }}>
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* 上段: 諸元情報 + 評価点 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 12,
          marginBottom: 14
        }}>
          {/* 諸元情報 - 高級デザイン */}
          <div style={{
            background: '#fff',
            border: '2px solid #c9a961',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 2px 8px rgba(201,169,97,0.15)'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#1a1a2e',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '2px solid #c9a961',
              letterSpacing: 1
            }}>
              📋 車両諸元情報
            </div>
            <table style={{
              width: '100%',
              fontSize: 11,
              borderCollapse: 'collapse',
              fontWeight: 600
            }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', width: '30%', color: '#555', background: '#f9f9f9' }}>年式</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#1a1a2e', fontWeight: 700 }}>{carSpec.year || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#555', background: '#f9f9f9' }}>型式</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#1a1a2e', fontWeight: 700 }}>{carSpec.model || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#555', background: '#f9f9f9' }}>車名</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#1a1a2e', fontWeight: 700 }}>{carSpec.name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#555', background: '#f9f9f9' }}>グレード</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#1a1a2e', fontWeight: 700 }}>{carSpec.grade || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#555', background: '#f9f9f9' }}>走行距離</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e8e8e8', color: '#c9a961', fontWeight: 900, fontSize: 12 }}>
                    {carSpec.mileage ? `${carSpec.mileage.toLocaleString()}km` : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', color: '#555', background: '#f9f9f9' }}>車体番号</td>
                  <td style={{ padding: '6px 8px', color: '#1a1a2e', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>{carSpec.chassisNumber || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 評価点 - プレミアムデザイン */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)',
            border: '3px solid #c9a961',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(201,169,97,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #c9a961 0%, #f4e5c3 50%, #c9a961 100%)'
            }}></div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#f4e5c3', letterSpacing: 1 }}>総合評価</div>
            <div style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#c9a961',
              lineHeight: 1,
              textShadow: '0 0 20px rgba(201,169,97,0.5)',
              marginBottom: 4
            }}>
              {typeof inspectorReport === 'object' ? inspectorReport.overallRating || '-' : '-'}
            </div>
            <div style={{
              width: 60,
              height: 2,
              background: 'linear-gradient(90deg, transparent 0%, #c9a961 50%, transparent 100%)',
              marginTop: 8,
              marginBottom: 8
            }}></div>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: '#f4e5c3', letterSpacing: 1 }}>内装評価</div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              {typeof inspectorReport === 'object' ? inspectorReport.interiorRating || '-' : '-'}
            </div>
          </div>
        </div>

        {/* 中段: 検査員報告 + 展開図（2カラム） */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 12,
          marginBottom: 14
        }}>
          {/* 左: 検査員報告・特記事項 */}
          <div style={{
            background: '#fff',
            border: '2px solid #c9a961',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 2px 8px rgba(201,169,97,0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 900,
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '2px solid #c9a961',
              color: '#1a1a2e',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>✍️</span>
              <span>検査員報告</span>
            </div>
            <div style={{
              fontSize: 9,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: '#2a2a2a',
              background: '#f9f9f9',
              padding: 8,
              borderRadius: 6,
              border: '1px solid #e8e8e8',
              flex: 1,
              fontWeight: 500,
              overflowY: 'auto'
            }}>
              {typeof inspectorReport === 'string' ? inspectorReport : inspectorReport.content || '特記事項なし'}
            </div>
          </div>

          {/* 右: 展開図 */}
          <div style={{
            background: '#fff',
            border: '3px solid #c9a961',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 4px 16px rgba(201,169,97,0.2)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #c9a961 0%, #f4e5c3 50%, #c9a961 100%)',
              borderRadius: '8px 8px 0 0'
            }}></div>
            <div style={{
              fontSize: 12,
              fontWeight: 900,
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '2px solid #c9a961',
              color: '#1a1a2e',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>🚗</span>
              <span>外装状態評価図</span>
            </div>
            {diagramImage ? (
              <div style={{
                background: '#f9f9f9',
                padding: 6,
                borderRadius: 6,
                border: '1px solid #e8e8e8'
              }}>
                <img 
                  src={diagramImage} 
                  alt="車両展開図"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '90mm',
                    objectFit: 'contain',
                    borderRadius: 4
                  }}
                />
              </div>
            ) : (
              <div style={{
                fontSize: 10,
                color: '#999',
                textAlign: 'center',
                paddingTop: 40,
                paddingBottom: 40,
                background: '#f9f9f9',
                borderRadius: 6,
                border: '1px dashed #ccc'
              }}>
                展開図を読み込み中...
              </div>
            )}
          </div>
        </div>

        {/* 下段: 車両画像 - ギャラリー風 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14
        }}>
          {/* 車両前方画像 */}
          <div style={{
            background: '#fff',
            border: '2px solid #c9a961',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(201,169,97,0.15)'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
              paddingBottom: 4,
              borderBottom: '2px solid #c9a961',
              color: '#1a1a2e',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>📸</span>
              <span>外装画像</span>
            </div>
            {carSpec.frontImage ? (
              <div style={{
                border: '3px solid #e8e8e8',
                borderRadius: 6,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={carSpec.frontImage} 
                  alt="外装"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '36mm',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '36mm',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#999',
                border: '2px dashed #ccc',
                borderRadius: 6
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                <div>画像未登録</div>
              </div>
            )}
          </div>

          {/* 車両後方画像 */}
          <div style={{
            background: '#fff',
            border: '2px solid #c9a961',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(201,169,97,0.15)'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
              paddingBottom: 4,
              borderBottom: '2px solid #c9a961',
              color: '#1a1a2e',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>📸</span>
              <span>内装画像</span>
            </div>
            {carSpec.rearImage ? (
              <div style={{
                border: '3px solid #e8e8e8',
                borderRadius: 6,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={carSpec.rearImage} 
                  alt="内装"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '36mm',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '36mm',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#999',
                border: '2px dashed #ccc',
                borderRadius: 6
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                <div>画像未登録</div>
              </div>
            )}
          </div>
        </div>

        {/* プレミアムフッター */}
        <div style={{
          position: 'absolute',
          bottom: '10mm',
          left: '12mm',
          right: '12mm',
          paddingTop: 10,
          borderTop: '3px solid #c9a961',
          background: 'linear-gradient(to top, rgba(201,169,97,0.05) 0%, transparent 100%)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 8,
            color: '#666',
            fontWeight: 600,
            marginBottom: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#c9a961', fontSize: 10 }}>✓</span>
              <span>本鑑定書は検査時点での車両品質を証明します</span>
            </div>
            <div style={{ color: '#1a1a2e', fontWeight: 700 }}>
              発行日: {new Date().toLocaleDateString('ja-JP')}
            </div>
          </div>
          <div style={{
            fontSize: 7,
            color: '#999',
            textAlign: 'center',
            letterSpacing: 0.5
          }}>
            PROFESSIONAL VEHICLE QUALITY INSPECTION CERTIFICATE | ISSUED BY CERTIFIED INSPECTOR
          </div>
        </div>
      </div>
    </div>
  );
}
