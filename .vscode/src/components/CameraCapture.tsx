import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setCapturedImage('');
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
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
    setStreaming(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
      setCapturedImage('');
    }
  };

  const handleRetake = () => {
    setCapturedImage('');
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>車両写真を撮影</DialogTitle>
          <DialogDescription>
            車両の写真を撮影してください
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex gap-2">
            {capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  撮り直し
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  この写真を使用
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  キャンセル
                </Button>
                <Button
                  onClick={captureImage}
                  className="flex-1"
                  disabled={!streaming}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  撮影
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}