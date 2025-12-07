import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { EvaluationScore } from '../App';
import { Download, FileText, Building2, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceReportProfessionalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null;
}

export function InvoiceReportProfessional({ open, onOpenChange, evaluation }: InvoiceReportProfessionalProps) {
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

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`請求書_${evaluation.carData.modelType}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.pdf`);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  // 仮の価格計算
  const basePrice = 1000000;
  const evaluationFee = 30000;
  const subtotal = basePrice + evaluationFee;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const issueDate = new Date();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6 text-blue-600" />
              請求書
            </DialogTitle>
            <Button onClick={generatePDF} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              PDF保存
            </Button>
          </div>
          <DialogDescription className="sr-only">
            車両の請求書とPDFダウンロード
          </DialogDescription>
        </DialogHeader>

        <div ref={reportRef} className="bg-white px-12 py-10 space-y-8">
          {/* ヘッダー */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
            <div className="grid grid-cols-2 gap-8 pt-4">
              {/* 発行元情報 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                  <div>
                    <h2 className="text-xl" style={{ fontWeight: 700 }}>株式会社 車両評価センター</h2>
                    <p className="text-xs text-slate-500">Vehicle Appraisal Center Co., Ltd.</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-600 ml-10">
                  <p>〒100-0001</p>
                  <p>東京都千代田区千代田1-1-1</p>
                  <p>TEL: 03-1234-5678</p>
                  <p>FAX: 03-1234-5679</p>
                  <p>Email: info@vehicle-appraisal.co.jp</p>
                </div>
              </div>

              {/* 請求書情報 */}
              <div className="text-right">
                <h1 className="text-5xl mb-4" style={{ fontWeight: 700 }}>請求書</h1>
                <div className="bg-slate-100 rounded-lg p-4 inline-block text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-24">請求番号:</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-24">発行日:</span>
                      <span>{issueDate.toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-24">支払期限:</span>
                      <span className="text-red-600" style={{ fontWeight: 600 }}>{dueDate.toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 請求先 */}
          <div className="border-2 border-slate-300 rounded-lg p-6 bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg" style={{ fontWeight: 600 }}>請求先</h3>
            </div>
            <div className="space-y-1 ml-7">
              <p className="text-sm text-slate-600">〒000-0000</p>
              <p className="text-sm text-slate-600">東京都〇〇区〇〇 1-2-3</p>
              <p className="text-lg mt-3" style={{ fontWeight: 600 }}>お客様名 様</p>
            </div>
          </div>

          {/* 請求金額（最も目立つ） */}
          <div className="border-4 border-blue-600 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-white shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl text-blue-900" style={{ fontWeight: 600 }}>ご請求金額</h3>
              </div>
              <div className="text-6xl text-blue-900 mb-2" style={{ fontWeight: 700 }}>
                ¥{total.toLocaleString()}
              </div>
              <p className="text-lg text-slate-600">（消費税込み）</p>
            </div>
          </div>

          {/* 車両情報 */}
          <div className="border-2 border-slate-300 rounded-lg p-6">
            <h3 className="text-lg mb-4 pb-2 border-b border-slate-300" style={{ fontWeight: 600 }}>車両情報</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">型式</div>
                <div className="font-mono" style={{ fontWeight: 600 }}>{evaluation.carData.modelType}</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">車種</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.model}</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">年式</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.year}年</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">走行距離</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.mileage.toLocaleString()} km</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">総合評価</div>
                <div style={{ fontWeight: 600 }}>{evaluation.overallScore}</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-xs text-slate-500 mb-1">内装評価</div>
                <div style={{ fontWeight: 600 }}>{evaluation.interiorScore}</div>
              </div>
            </div>
          </div>

          {/* 請求明細テーブル */}
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left p-4" style={{ fontWeight: 600 }}>項目</th>
                  <th className="text-center p-4 w-20" style={{ fontWeight: 600 }}>数量</th>
                  <th className="text-right p-4 w-32" style={{ fontWeight: 600 }}>単価</th>
                  <th className="text-right p-4 w-32" style={{ fontWeight: 600 }}>金額</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-4">
                    <div style={{ fontWeight: 600 }}>車両本体価格</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {evaluation.carData.model} ({evaluation.carData.modelType})
                    </div>
                  </td>
                  <td className="text-center p-4">1</td>
                  <td className="text-right p-4 font-mono">¥{basePrice.toLocaleString()}</td>
                  <td className="text-right p-4 font-mono" style={{ fontWeight: 600 }}>¥{basePrice.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-4" style={{ fontWeight: 600 }}>車両鑑定料</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-right p-4 font-mono">¥{evaluationFee.toLocaleString()}</td>
                  <td className="text-right p-4 font-mono" style={{ fontWeight: 600 }}>¥{evaluationFee.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100">
                <tr className="border-b border-slate-300">
                  <td colSpan={3} className="text-right p-4" style={{ fontWeight: 600 }}>小計</td>
                  <td className="text-right p-4 font-mono text-lg" style={{ fontWeight: 600 }}>¥{subtotal.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td colSpan={3} className="text-right p-4" style={{ fontWeight: 600 }}>消費税（10%）</td>
                  <td className="text-right p-4 font-mono text-lg" style={{ fontWeight: 600 }}>¥{tax.toLocaleString()}</td>
                </tr>
                <tr className="bg-slate-800 text-white">
                  <td colSpan={3} className="text-right p-4 text-lg" style={{ fontWeight: 700 }}>合計金額</td>
                  <td className="text-right p-4 font-mono text-2xl" style={{ fontWeight: 700 }}>¥{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* お支払い情報 */}
          <div className="border-2 border-slate-300 rounded-lg p-6 bg-amber-50">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg" style={{ fontWeight: 600 }}>お支払い情報</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-baseline gap-3">
                    <span className="text-slate-600 w-24">銀行名:</span>
                    <span style={{ fontWeight: 600 }}>〇〇銀行</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-slate-600 w-24">支店名:</span>
                    <span style={{ fontWeight: 600 }}>〇〇支店</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-slate-600 w-24">口座種別:</span>
                    <span style={{ fontWeight: 600 }}>普通預金</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-slate-600 w-24">口座番号:</span>
                    <span className="font-mono" style={{ fontWeight: 600 }}>1234567</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-slate-600 w-24">口座名義:</span>
                    <span style={{ fontWeight: 600 }}>カ）シャリョウヒョウカセンター</span>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <span className="text-sm" style={{ fontWeight: 600 }}>お支払期限</span>
                </div>
                <div className="text-2xl text-red-600 ml-7" style={{ fontWeight: 700 }}>
                  {dueDate.toLocaleDateString('ja-JP')}
                </div>
                <p className="text-xs text-red-700 mt-2 ml-7">期限までにお支払いください</p>
              </div>
            </div>
          </div>

          {/* 備考・注意事項 */}
          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
            <h4 className="text-sm mb-2" style={{ fontWeight: 600 }}>備考</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>振込手数料はお客様のご負担となります</li>
              <li>お振込の際は、請求番号（{invoiceNumber}）を備考欄にご記入ください</li>
              <li>領収書が必要な場合は、別途ご連絡ください</li>
            </ul>
          </div>

          {/* フッター */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-300">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" />
              <p style={{ fontWeight: 600 }}>本請求書は、車両評価システムにより自動生成されました</p>
            </div>
            <p>発行日時: {new Date().toLocaleString('ja-JP')}</p>
            <p className="mt-2 text-slate-400">ご不明な点がございましたら、上記連絡先までお問い合わせください</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
