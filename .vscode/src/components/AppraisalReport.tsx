import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EvaluationScore } from '../App';
import { Download, FileText, Car, Award, Shield, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AppraisalReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null;
}

export function AppraisalReport({ open, onOpenChange, evaluation }: AppraisalReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!evaluation) return null;

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Fix OKLCH colors by converting them to RGB
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach((el: any) => {
            const computedStyle = window.getComputedStyle(el);
            if (el.style) {
              // Copy computed RGB values to inline styles
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

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`鑑定書_${evaluation.carData.modelType}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('S')) return 'bg-yellow-500';
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-slate-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              車両鑑定書
            </DialogTitle>
            <Button onClick={generatePDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF出力
            </Button>
          </div>
          <DialogDescription className="sr-only">
            車両の詳細な鑑定情報とPDFダウンロード
          </DialogDescription>
        </DialogHeader>

        <div ref={reportRef} className="bg-white p-8 space-y-6">
          {/* ヘッダー */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl mb-2">車両鑑定書</h1>
            <p className="text-sm text-slate-600">Vehicle Appraisal Report</p>
          </div>

          {/* 鑑定日 */}
          <div className="text-right text-sm text-slate-600">
            鑑定日: {new Date(evaluation.timestamp).toLocaleDateString('ja-JP')}
          </div>

          {/* 車両基本情報 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              車両基本情報
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-slate-600">型式:</span>
                  <span className="font-mono">{evaluation.carData.modelType}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-600">車種:</span>
                  <span>{evaluation.carData.model}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-600">年式:</span>
                  <span>{evaluation.carData.year}年</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-slate-600">走行距離:</span>
                  <span>{evaluation.carData.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-600">整備記録:</span>
                  <span>
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
            <div className="border-2 border-slate-300 rounded-lg p-6">
              <h2 className="text-xl mb-4">車両写真</h2>
              <img
                src={evaluation.carData.carImage}
                alt="車両写真"
                className="w-full max-h-96 object-contain rounded-lg border"
              />
            </div>
          )}

          {/* 評価結果 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <h2 className="text-xl mb-4">評価結果</h2>
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-2">総合評価</div>
                <div className="text-4xl mb-2">{evaluation.overallScore}</div>
                <Badge className={`${getGradeColor(evaluation.grade)} text-white`}>
                  {evaluation.grade}
                </Badge>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-2">内装補助評価</div>
                <div className="text-4xl">{evaluation.interiorScore}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-2">参考値</div>
                <div className="text-4xl">{evaluation.referenceScore}</div>
                <div className="text-xs text-slate-500 mt-1">/ 100点</div>
              </div>
            </div>
          </div>

          {/* 瑕疵情報（展開図） */}
          {evaluation.partDefects && evaluation.partDefects.length > 0 && (
            <div className="border-2 border-slate-300 rounded-lg p-6">
              <h2 className="text-xl mb-4">瑕疵情報</h2>
              <div className="space-y-2">
                {evaluation.partDefects.map((pd, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                    <span>{pd.partName}</span>
                    <div className="flex gap-2">
                      {pd.defects.map((defect: any, idx: number) => (
                        <Badge key={idx} variant="secondary">
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
            <div className="border-2 border-slate-300 rounded-lg p-6">
              <h2 className="text-xl mb-4">検査員報告</h2>
              <div className="grid grid-cols-2 gap-3">
                {evaluation.carData.inspectorComments
                  .map((comment, index) => ({ comment, index }))
                  .filter(({ comment }) => comment.trim() !== '')
                  .map(({ comment, index }) => (
                    <div key={index} className="p-3 bg-slate-50 rounded border">
                      <div className="text-xs text-slate-500 mb-1">項目 {index + 1}</div>
                      <div className="text-sm">{comment}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* フッター */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t">
            <p>本鑑定書は、車両評価システムにより作成されました</p>
            <p className="mt-1">発行日時: {new Date(evaluation.timestamp).toLocaleString('ja-JP')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}