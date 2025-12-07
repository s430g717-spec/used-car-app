import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { EvaluationScore } from '../App';
import { QrCode, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from './ui/button';

interface AppraisalQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationScore | null;
}

export function AppraisalQRCode({ open, onOpenChange, evaluation }: AppraisalQRCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && evaluation && qrCodeRef.current) {
      // QRコード生成ライブラリを使用する場合はここで生成
      // 今回はプレースホルダーとして模擬的なQRコード表示を実装
      import('qrcode').then((QRCode) => {
        const dataUrl = JSON.stringify({
          modelType: evaluation.carData.modelType,
          model: evaluation.carData.model,
          year: evaluation.carData.year,
          mileage: evaluation.carData.mileage,
          overallScore: evaluation.overallScore,
          interiorScore: evaluation.interiorScore,
          timestamp: evaluation.timestamp,
        });

        if (qrCodeRef.current) {
          qrCodeRef.current.innerHTML = '';
          QRCode.toCanvas(
            dataUrl,
            {
              errorCorrectionLevel: 'H',
              width: 400,
              margin: 3,
              color: {
                dark: '#1e293b',
                light: '#ffffff'
              }
            },
            (error: any, canvas: HTMLCanvasElement) => {
              if (error) {
                console.error('QRコード生成エラー:', error);
                return;
              }
              if (qrCodeRef.current) {
                canvas.style.borderRadius = '12px';
                canvas.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                qrCodeRef.current.appendChild(canvas);
              }
            }
          );
        }
      });
    }
  }, [open, evaluation]);

  const handleDownloadQR = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QRコード_${evaluation?.carData.modelType}_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-2xl">
            <QrCode className="w-7 h-7 text-blue-600" />
            鑑定書QRコード
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600">
            スマートフォンで読み取り可能な車両情報QRコード
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* QRコード表示エリア - 画面全体に大きく表示 */}
          <div className="flex justify-center p-8 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border-4 border-blue-200 shadow-xl">
            <div ref={qrCodeRef} className="flex items-center justify-center min-h-[400px] bg-white p-4 rounded-xl">
              <div className="text-slate-400 text-lg">QRコード生成中...</div>
            </div>
          </div>

          {/* 車両情報 */}
          <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm text-slate-500 mb-3 pb-2 border-b border-slate-200">含まれる情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">型式</div>
                <div className="font-mono" style={{ fontWeight: 600 }}>{evaluation.carData.modelType}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">車種</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.model}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">年式</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.year}年</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">走行距離</div>
                <div style={{ fontWeight: 600 }}>{evaluation.carData.mileage.toLocaleString()} km</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">総合評価</div>
                <div className="text-blue-900" style={{ fontWeight: 700 }}>{evaluation.overallScore}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">内装評価</div>
                <div className="text-blue-900" style={{ fontWeight: 700 }}>{evaluation.interiorScore}</div>
              </div>
            </div>
          </div>

          {/* ダウンロードボタン */}
          <Button
            onClick={handleDownloadQR}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            QRコード画像をダウンロード
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-900">
              <QrCode className="w-4 h-4 inline mr-1" />
              スマートフォンのカメラでQRコードを読み取ると車両情報が表示されます
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}