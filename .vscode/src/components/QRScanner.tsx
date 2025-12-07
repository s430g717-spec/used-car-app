import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: any) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('カメラへのアクセスが拒否されました。ブラウザの設定からカメラの使用を許可してください。');
      } else if (err.name === 'NotFoundError') {
        setError('カメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。');
      } else if (err.name === 'NotReadableError') {
        setError('カメラが他のアプリケーションで使用されている可能性があります。');
      } else {
        setError('カメラの起動に失敗しました。');
      }
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setScanning(false);
  };

  const tick = () => {
    if (videoRef.current && canvasRef.current && scanning) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            handleQRCode(code.data);
            return;
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleQRCode = (data: string) => {
    try {
      // 車検証QRコードのパース（実際のフォーマットに応じて調整が必要）
      // 車検証QRコードは通常、カンマ区切りやタブ区切りのデータ
      const parts = data.split(',');
      
      // 仮のパース処理（実際の車検証QRコードフォーマットに合わせて調整）
      const parsedData = {
        modelType: parts[0] || '',
        model: parts[1] || '',
        year: parts[2] ? parseInt(parts[2]) : new Date().getFullYear(),
        mileage: parts[3] ? parseInt(parts[3]) : 0,
      };
      
      stopCamera();
      onScan(parsedData);
      onOpenChange(false);
    } catch (err) {
      setError('QRコードの読み取りに失敗しました');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>車検証QRコード読み取り</DialogTitle>
          <DialogDescription>
            車検証のQRコードをカメラでスキャンしてください
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}