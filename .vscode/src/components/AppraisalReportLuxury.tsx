import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EvaluationScore } from '../App';
import { Download, FileText, Car, Award, Shield, CheckCircle2, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AppraisalReportLuxuryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null;
}

export function AppraisalReportLuxury({ open, onOpenChange, evaluation }: AppraisalReportLuxuryProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!evaluation) return null;

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach((el: any) => {
            const computedStyle = window.getComputedStyle(el);
            if (el.style) {
              const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
              props.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== '' && value !== 'none') {
                  el.style[prop] = value;
                }
              });
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`鑑定書_${evaluation.carData.modelType}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  const getScoreEmblemColor = (score: string): string => {
    if (score === 'S点') return 'from-yellow-400 via-amber-500 to-yellow-600';
    if (score === '6点') return 'from-green-400 via-emerald-500 to-green-600';
    if (score === '5点') return 'from-blue-400 via-sky-500 to-blue-600';
    if (score === '4.5点' || score === '4点') return 'from-slate-400 via-gray-500 to-slate-600';
    if (score === '3.5点' || score === '3点') return 'from-orange-400 via-amber-600 to-orange-700';
    return 'from-red-400 via-rose-500 to-red-600';
  };

  const getScoreText = (score: string): string => {
    if (score === 'S点') return 'S級';
    if (score === '6点') return '特選';
    if (score === '5点') return '良好';
    if (score === '4.5点') return '良車';
    if (score === '4点') return '標準';
    if (score === '3.5点') return '普通';
    if (score === '3点') return '可';
    return score;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-6 h-6 text-blue-600" />
              車両鑑定証明書
            </DialogTitle>
            <Button onClick={generatePDF} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              PDF保存
            </Button>
          </div>
          <DialogDescription className="sr-only">
            車両の詳細な鑑定証明書とPDFダウンロード
          </DialogDescription>
        </DialogHeader>

        <div ref={reportRef} className="bg-white px-12 py-10 space-y-8">
          {/* 豪華なヘッダー */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-slate-700 to-blue-600"></div>
            <div className="text-center pt-6 pb-8 border-b-4 border-double border-slate-800">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Award className="w-10 h-10 text-amber-600" />
                <h1 className="text-5xl tracking-wider" style={{ fontWeight: 700 }}>車両鑑定証明書</h1>
                <Award className="w-10 h-10 text-amber-600" />
              </div>
              <p className="text-lg text-slate-600 tracking-widest" style={{ letterSpacing: '0.3em' }}>VEHICLE APPRAISAL CERTIFICATE</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-slate-500">公正かつ厳格な基準に基づく鑑定評価</p>
              </div>
            </div>
          </div>

          {/* 鑑定日・発行番号 */}
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm">鑑定日:</span>
              <span className="font-mono text-sm">{new Date(evaluation.timestamp).toLocaleDateString('ja-JP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm">証明書番号:</span>
              <span className="font-mono text-sm">AP-{new Date(evaluation.timestamp).getTime().toString().slice(-8)}</span>
            </div>
          </div>

          {/* 評価エンブレム - 最も目立つセクション */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-4 border-double border-slate-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center gap-8">
              {/* 総合評価エンブレム */}
              <div className="relative">
                <div className={`w-56 h-56 rounded-full bg-gradient-to-br ${getScoreEmblemColor(evaluation.overallScore)} flex items-center justify-center shadow-2xl border-8 border-white`}>
                  <div className="text-center">
                    <div className="text-white text-7xl mb-2" style={{ fontWeight: 800 }}>{evaluation.overallScore.replace('点', '')}</div>
                    <div className="text-white text-lg tracking-widest bg-black/20 px-4 py-1 rounded-full">{getScoreText(evaluation.overallScore)}</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-amber-500 rounded-full p-3 shadow-lg border-4 border-white">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
              </div>

              {/* 評価詳細 */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border-2 border-slate-200 shadow-md">
                  <div className="text-sm text-slate-500 mb-1">総合評価点</div>
                  <div className="text-4xl mb-1" style={{ fontWeight: 700 }}>{evaluation.overallScore}</div>
                  <div className="text-sm text-slate-600">{evaluation.grade}</div>
                </div>
                <div className="bg-white rounded-lg p-6 border-2 border-slate-200 shadow-md">
                  <div className="text-sm text-slate-500 mb-1">内装補助評価</div>
                  <div className="text-4xl" style={{ fontWeight: 700 }}>{evaluation.interiorScore}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">参考値（自動算出）</div>
                  <div className="text-2xl text-blue-900" style={{ fontWeight: 600 }}>{evaluation.referenceScore} / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* 車両基本情報 */}
          <div className="border-2 border-slate-300 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50">
            <h2 className="text-2xl mb-6 flex items-center gap-3 pb-3 border-b-2 border-slate-300" style={{ fontWeight: 600 }}>
              <Car className="w-6 h-6 text-blue-600" />
              車両基本情報
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-baseline gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="w-32 text-slate-600 text-sm">型式</span>
                  <span className="font-mono text-lg" style={{ fontWeight: 600 }}>{evaluation.carData.modelType}</span>
                </div>
                <div className="flex items-baseline gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="w-32 text-slate-600 text-sm">車種</span>
                  <span className="text-lg" style={{ fontWeight: 600 }}>{evaluation.carData.model}</span>
                </div>
                <div className="flex items-baseline gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="w-32 text-slate-600 text-sm">年式</span>
                  <span className="text-lg" style={{ fontWeight: 600 }}>{evaluation.carData.year}年</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="w-32 text-slate-600 text-sm">走行距離</span>
                  <span className="text-lg" style={{ fontWeight: 600 }}>{evaluation.carData.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-baseline gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="w-32 text-slate-600 text-sm">整備記録</span>
                  <span className="text-lg" style={{ fontWeight: 600 }}>
                    {evaluation.carData.maintenanceRecords === 'complete' && '完全'}
                    {evaluation.carData.maintenanceRecords === 'partial' && '一部あり'}
                    {evaluation.carData.maintenanceRecords === 'none' && 'なし'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 車両写真 */}
          {evaluation.carData.carImage && (
            <div className="border-2 border-slate-300 rounded-xl p-6 bg-white">
              <h2 className="text-2xl mb-6 flex items-center gap-3 pb-3 border-b-2 border-slate-300" style={{ fontWeight: 600 }}>
                <Car className="w-6 h-6 text-blue-600" />
                車両写真
              </h2>
              <div className="relative">
                <img
                  src={evaluation.carData.carImage}
                  alt="車両写真"
                  className="w-full max-h-[500px] object-contain rounded-lg border-4 border-slate-200 shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm" style={{ fontWeight: 600 }}>検証済</span>
                </div>
              </div>
            </div>
          )}

          {/* 瑕疵情報 */}
          {evaluation.partDefects && evaluation.partDefects.length > 0 && (
            <div className="border-2 border-slate-300 rounded-xl p-6 bg-gradient-to-br from-amber-50 to-white">
              <h2 className="text-2xl mb-6 flex items-center gap-3 pb-3 border-b-2 border-amber-300" style={{ fontWeight: 600 }}>
                <Award className="w-6 h-6 text-amber-600" />
                瑕疵情報
              </h2>
              <div className="space-y-3">
                {evaluation.partDefects.map((pd, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-amber-200 shadow-sm">
                    <span className="text-lg" style={{ fontWeight: 500 }}>{pd.partName}</span>
                    <div className="flex gap-2">
                      {pd.defects.map((defect: any, idx: number) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-900 border-2 border-amber-300 px-3 py-1 text-sm">
                          {defect.type}{defect.level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 検査員報告 */}
          {evaluation.carData.inspectorComments.some(c => c.trim() !== '') && (
            <div className="border-2 border-slate-300 rounded-xl p-6 bg-white">
              <h2 className="text-2xl mb-6 flex items-center gap-3 pb-3 border-b-2 border-slate-300" style={{ fontWeight: 600 }}>
                <FileText className="w-6 h-6 text-blue-600" />
                検査員報告
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {evaluation.carData.inspectorComments
                  .map((comment, index) => ({ comment, index }))
                  .filter(({ comment }) => comment.trim() !== '')
                  .map(({ comment, index }) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs" style={{ fontWeight: 600 }}>{index + 1}</div>
                        項目 {index + 1}
                      </div>
                      <div className="text-sm">{comment}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* フッター・鑑定者署名欄 */}
          <div className="space-y-6 pt-6 border-t-4 border-double border-slate-800">
            <div className="grid grid-cols-2 gap-8">
              <div className="border-2 border-slate-300 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-2">鑑定者署名</div>
                <div className="h-16 border-b-2 border-slate-400"></div>
                <div className="text-xs text-slate-500 mt-2">検査員印</div>
              </div>
              <div className="border-2 border-slate-300 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-2">発行者情報</div>
                <div className="space-y-1 text-sm">
                  <p>株式会社 車両評価センター</p>
                  <p className="text-xs text-slate-500">〒000-0000 東京都千代田区</p>
                  <p className="text-xs text-slate-500">TEL: 03-0000-0000</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 py-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                <p style={{ fontWeight: 600 }}>本鑑定書は、USS形式の評価基準に基づき厳正に作成されました</p>
              </div>
              <p>発行日時: {new Date(evaluation.timestamp).toLocaleString('ja-JP')}</p>
              <p className="mt-1 text-slate-400">Certificate No. AP-{new Date(evaluation.timestamp).getTime().toString().slice(-8)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
