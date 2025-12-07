import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { FileDown, QrCode, X } from 'lucide-react';

interface AppraisalOutputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPdfDownload: () => void;
  onQrCodeDisplay: () => void;
}

export function AppraisalOutputModal({
  open,
  onOpenChange,
  onPdfDownload,
  onQrCodeDisplay,
}: AppraisalOutputModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">鑑定書を出力しますか？</DialogTitle>
          <DialogDescription className="text-center text-slate-600">
            出力形式を選択してください
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Button
              onClick={() => {
                onPdfDownload();
                onOpenChange(false);
              }}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileDown className="w-5 h-5 mr-2" />
              PDFダウンロード
            </Button>
            
            <Button
              onClick={() => {
                onQrCodeDisplay();
                onOpenChange(false);
              }}
              className="w-full h-14 bg-slate-700 hover:bg-slate-800 text-white"
            >
              <QrCode className="w-5 h-5 mr-2" />
              QRコード表示
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[120px]"
          >
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}