import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { EvaluationScore } from '../App';
import { Download, FileText, Building2, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null;
}

export function InvoiceReport({ open, onOpenChange, evaluation }: InvoiceReportProps) {
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
      pdf.save(`請求書_${evaluation.carData.modelType}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  // 仮の価格計算（実際のシステムでは適切な価格ロジックを実装してください）
  const basePrice = 1000000; // 基本価格
  const evaluationFee = 30000; // 鑑定料
  const subtotal = basePrice + evaluationFee;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              請求書
            </DialogTitle>
            <Button onClick={generatePDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF出力
            </Button>
          </div>
          <DialogDescription className="sr-only">
            車両の請求情報とPDFダウンロード
          </DialogDescription>
        </DialogHeader>

        <div ref={reportRef} className="bg-white p-8 space-y-6">
          {/* ヘッダー */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl mb-2">請求書</h1>
            <p className="text-sm text-slate-600">Invoice</p>
          </div>

          {/* 請求日・請求番号 */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-600">請求日</div>
              <div>{new Date().toLocaleDateString('ja-JP')}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">請求番号</div>
              <div className="font-mono">INV-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}</div>
            </div>
          </div>

          {/* 請求先 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5" />
              <h2 className="text-xl">請求先</h2>
            </div>
            <div className="space-y-1 text-slate-600">
              <div>〒000-0000</div>
              <div>東京都〇〇区〇〇 1-2-3</div>
              <div className="mt-2">お客様名 様</div>
            </div>
          </div>

          {/* 請求金額 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
            <div className="text-sm text-slate-600 mb-2">ご請求金額</div>
            <div className="text-4xl mb-1">¥{total.toLocaleString()}</div>
            <div className="text-sm text-slate-600">（税込）</div>
          </div>

          {/* 車両情報 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <h2 className="text-xl mb-4">車両情報</h2>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex">
                <span className="w-32 text-slate-600">走行距離:</span>
                <span>{evaluation.carData.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">総合評価:</span>
                <span>{evaluation.overallScore}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">内装評価:</span>
                <span>{evaluation.interiorScore}</span>
              </div>
            </div>
          </div>

          {/* 明細 */}
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 border-b">項目</th>
                  <th className="text-right p-3 border-b">数量</th>
                  <th className="text-right p-3 border-b">単価</th>
                  <th className="text-right p-3 border-b">金額</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">
                    <div>車両本体価格</div>
                    <div className="text-sm text-slate-600">
                      {evaluation.carData.model} ({evaluation.carData.modelType})
                    </div>
                  </td>
                  <td className="text-right p-3">1</td>
                  <td className="text-right p-3">¥{basePrice.toLocaleString()}</td>
                  <td className="text-right p-3">¥{basePrice.toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">車両鑑定料</td>
                  <td className="text-right p-3">1</td>
                  <td className="text-right p-3">¥{evaluationFee.toLocaleString()}</td>
                  <td className="text-right p-3">¥{evaluationFee.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="border-b">
                  <td colSpan={3} className="text-right p-3">小計</td>
                  <td className="text-right p-3">¥{subtotal.toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td colSpan={3} className="text-right p-3">消費税（10%）</td>
                  <td className="text-right p-3">¥{tax.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-3">合計金額</td>
                  <td className="text-right p-3">¥{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* お支払い情報 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <h2 className="text-xl mb-4">お支払い情報</h2>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-32 text-slate-600">振込先:</span>
                <span>〇〇銀行 〇〇支店</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">口座種別:</span>
                <span>普通</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">口座番号:</span>
                <span className="font-mono">1234567</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">口座名義:</span>
                <span>カ）〇〇〇〇</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600">お支払期限:</span>
                <span>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t">
            <p>本請求書は、車両評価システムにより作成されました</p>
            <p className="mt-1">発行日時: {new Date().toLocaleString('ja-JP')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}