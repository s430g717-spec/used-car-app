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

      {/* USS様式 PDF プレビュー */}
      <div
        ref={previewRef}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: '#fff',
          padding: '10mm',
          margin: '0 auto',
          boxSizing: 'border-box',
          fontFamily: '"MS Gothic", "MS Mincho", monospace',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          opacity: isGenerating ? 0.5 : 1,
          pointerEvents: isGenerating ? 'none' : 'auto'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          borderBottom: '4px solid #000',
          paddingBottom: 8,
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#000',
            margin: 0,
            letterSpacing: 2
          }}>
            車両検査証明書
          </h1>
          <div style={{
            fontSize: 10,
            color: '#000',
            textAlign: 'right',
            fontWeight: 700
          }}>
            検査日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
          </div>
        </div>

        {/* 上段: 諸元情報 + 評価点 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 10,
          marginBottom: 10
        }}>
          {/* 諸元情報 */}
          <div style={{
            border: '2px solid #000',
            padding: 8
          }}>
            <table style={{
              width: '100%',
              fontSize: 11,
              borderCollapse: 'collapse',
              fontWeight: 700
            }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc', width: '30%' }}>年式</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>{carSpec.year || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>型式</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>{carSpec.model || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>車名</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>{carSpec.name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>グレード</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>{carSpec.grade || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>走行距離</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #ccc' }}>
                    {carSpec.mileage ? `${carSpec.mileage.toLocaleString()}km` : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px' }}>車体番号</td>
                  <td style={{ padding: '4px 6px', fontSize: 10 }}>{carSpec.chassisNumber || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 評価点 */}
          <div style={{
            border: '2px solid #000',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f5f5f5'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>総合評価</div>
            <div style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#c00',
              lineHeight: 1
            }}>
              {typeof inspectorReport === 'object' ? inspectorReport.overallRating || '-' : '-'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8 }}>内装評価</div>
            <div style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#000',
              lineHeight: 1
            }}>
              {typeof inspectorReport === 'object' ? inspectorReport.interiorRating || '-' : '-'}
            </div>
          </div>
        </div>

        {/* 中段: 展開図 */}
        <div style={{
          border: '2px solid #000',
          padding: 8,
          marginBottom: 10,
          minHeight: '120mm'
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 6,
            borderBottom: '1px solid #000',
            paddingBottom: 4
          }}>
            外装展開図
          </div>
          {diagramImage ? (
            <img 
              src={diagramImage} 
              alt="車両展開図"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '110mm',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ fontSize: 10, color: '#666', textAlign: 'center', paddingTop: 40 }}>
              展開図を読み込み中...
            </div>
          )}
        </div>

        {/* 下段: 車両画像 + 検査員コメント */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 10
        }}>
          {/* 車両前方画像 */}
          <div style={{
            border: '2px solid #000',
            padding: 6
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, borderBottom: '1px solid #000', paddingBottom: 2 }}>
              車両画像（前）
            </div>
            {carSpec.frontImage ? (
              <img 
                src={carSpec.frontImage} 
                alt="車両前方"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '35mm',
                  objectFit: 'cover',
                  border: '1px solid #ccc'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '35mm',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#999',
                border: '1px dashed #ccc'
              }}>
                画像なし
              </div>
            )}
          </div>

          {/* 車両後方画像 */}
          <div style={{
            border: '2px solid #000',
            padding: 6
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, borderBottom: '1px solid #000', paddingBottom: 2 }}>
              車両画像（後）
            </div>
            {carSpec.rearImage ? (
              <img 
                src={carSpec.rearImage} 
                alt="車両後方"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '35mm',
                  objectFit: 'cover',
                  border: '1px solid #ccc'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '35mm',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#999',
                border: '1px dashed #ccc'
              }}>
                画像なし
              </div>
            )}
          </div>
        </div>

        {/* 検査員報告 */}
        <div style={{
          border: '2px solid #000',
          padding: 8,
          minHeight: '30mm'
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 6,
            borderBottom: '1px solid #000',
            paddingBottom: 4
          }}>
            検査員報告・備考
          </div>
          <div style={{
            fontSize: 9,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {typeof inspectorReport === 'string' ? inspectorReport : inspectorReport.content || '特記事項なし'}
          </div>
        </div>

        {/* フッター */}
        <div style={{
          position: 'absolute',
          bottom: '8mm',
          left: '10mm',
          right: '10mm',
          borderTop: '1px solid #000',
          paddingTop: 4,
          fontSize: 8,
          color: '#000',
          textAlign: 'center',
          fontWeight: 700
        }}>
          この検査証明書は検査時点での車両状態を証明するものです。｜発行: {new Date().toLocaleDateString('ja-JP')}
        </div>
      </div>
    </div>
  );
}
