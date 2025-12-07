import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Info } from 'lucide-react';

export interface Defect {
  type: string;
  level: string;
  typeName: string;
  levelName: string;
}

interface DefectInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partName: string;
  existingDefects: Defect[];
  onConfirm: (defects: Defect[]) => void;
}

const defectTypes = [
  { code: 'A', name: '小傷' },
  { code: 'U', name: '凹み' },
  { code: 'B', name: 'バンパー傷' },
  { code: 'W', name: '修理跡' },
  { code: 'S', name: 'サビ' },
  { code: 'G', name: 'ガラス傷' },
  { code: 'XX', name: '交換歴' },
];

const defectLevels = [
  { code: '1', name: '軽微' },
  { code: '2', name: '中程度' },
  { code: '3', name: '重度' },
];

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
  selectedType: string;
}

export function DefectInputDialog({
  open,
  onOpenChange,
  partName,
  existingDefects,
  onConfirm,
}: DefectInputDialogProps) {
  const [defects, setDefects] = useState<Defect[]>(existingDefects);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
    selectedType: '',
  });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDefects(existingDefects);
  }, [existingDefects]);

  // 自動確定（ダイアログを閉じた時）
  useEffect(() => {
    if (!open && defects !== existingDefects) {
      onConfirm(defects);
    }
  }, [open]);

  const getFlickDirection = (deltaX: number, deltaY: number): string | null => {
    const threshold = 30;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < threshold) return null;

    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    // 上方向（-45度〜-135度）: レベル1
    if (angle < -45 && angle > -135) return '1';
    
    // 下方向（45度〜135度）: レベル3
    if (angle > 45 && angle < 135) return '3';
    
    // 左右方向: レベル2
    return '2';
  };

  const handleStart = (typeCode: string, clientX: number, clientY: number) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setTouchState({
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isActive: true, 
      selectedType: typeCode,
    });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (touchState.selectedType) {
      setTouchState(prev => ({
        ...prev,
        currentX: clientX,
        currentY: clientY,
      }));
    }
  };

  const handleEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (touchState.isActive) {
      const deltaX = touchState.currentX - touchState.startX;
      const deltaY = touchState.currentY - touchState.startY;
      const level = getFlickDirection(deltaX, deltaY);

      if (level) {
        addDefect(touchState.selectedType, level);
      }
    }

    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isActive: false,
      selectedType: '',
    });
  };

  const addDefect = (typeCode: string, levelCode: string) => {
    const type = defectTypes.find(t => t.code === typeCode);
    const level = defectLevels.find(l => l.code === levelCode);

    if (!type || !level) return;

    const newDefect: Defect = {
      type: typeCode,
      level: levelCode,
      typeName: type.name,
      levelName: level.name,
    };

    const existingIndex = defects.findIndex(d => d.type === typeCode && d.level === levelCode);
    
    if (existingIndex !== -1) {
      return;
    }

    const updatedDefects = [...defects, newDefect];
    setDefects(updatedDefects);
    
    onConfirm(updatedDefects);
    onOpenChange(false);
  };

  const handleRemoveDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setDefects([]);
  };

  const handleClose = () => {
    onConfirm(defects);
    onOpenChange(false);
  };

  const getFlickIndicator = () => {
    if (!touchState.isActive) return null;

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const direction = getFlickDirection(deltaX, deltaY);

    let arrow = '→';
    let label = 'レベル2';
    
    if (direction === '1') {
      arrow = '↑';
      label = 'レベル1';
    } else if (direction === '3') {
      arrow = '↓';
      label = 'レベル3';
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="bg-black/80 text-white px-6 py-4 rounded-2xl text-center">
          <div className="text-4xl mb-2">{arrow}</div>
          <div className="text-lg">{label}</div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partName} - 瑕疵入力</DialogTitle>
          <DialogDescription className="sr-only">
            瑕疵の種類と程度を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 text-xs text-slate-600 bg-blue-50 p-3 rounded-lg -mt-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="mb-1">ボタンを**押してすぐフリック**で入力</div>
            <div className="space-y-0.5 text-slate-500">
              <div>• 上フリック → レベル1（軽微）</div>
              <div>• 左右フリック → レベル2（中程度）</div>
              <div>• 下フリック → レベル3（重度）</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
            {defectTypes.map((type) => (
              <button
                key={type.code}
                className="aspect-square min-h-[56px] rounded-xl border-3 border-slate-400 bg-gradient-to-br from-white to-slate-50 text-slate-800 flex flex-col items-center justify-center text-xl transition-all active:scale-95 active:bg-slate-200 select-none relative hover:border-blue-500 hover:shadow-lg hover:from-blue-50 hover:to-slate-50 touch-manipulation"
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  handleStart(type.code, touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  handleMove(touch.clientX, touch.clientY);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleEnd();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleStart(type.code, e.clientX, e.clientY);
                }}
                onMouseMove={(e) => {
                  if (touchState.selectedType === type.code) {
                    handleMove(e.clientX, e.clientY);
                  }
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  handleEnd();
                }}
                onMouseLeave={(e) => {
                  if (touchState.selectedType === type.code) {
                    handleEnd();
                  }
                }}
                style={{
                  transform: touchState.isActive && touchState.selectedType === type.code 
                    ? 'scale(1.15)' 
                    : 'scale(1)',
                  backgroundColor: touchState.isActive && touchState.selectedType === type.code
                    ? '#f97316'
                    : undefined,
                  borderColor: touchState.isActive && touchState.selectedType === type.code
                    ? '#ea580c'
                    : undefined,
                  borderWidth: touchState.isActive && touchState.selectedType === type.code
                    ? '4px'
                    : '3px',
                  color: touchState.isActive && touchState.selectedType === type.code
                    ? '#ffffff'
                    : undefined,
                  fontWeight: touchState.isActive && touchState.selectedType === type.code
                    ? 800
                    : 700,
                  boxShadow: touchState.isActive && touchState.selectedType === type.code
                    ? '0 10px 25px -5px rgba(249, 115, 22, 0.5)'
                    : undefined,
                }}
              >
                <span className="text-2xl mb-1">{type.code}</span>
                <span className="text-[10px] opacity-70">{type.name}</span>
              </button>
            ))}
          </div>

          {defects.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-700">
                  登録済み ({defects.length}件)
                </label>
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 h-8"
                >
                  すべて削除
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {defects.map((defect, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border group hover:border-slate-300 transition-colors"
                  >
                    <Badge variant="secondary" className="text-base px-2.5 py-0.5">
                      {defect.type}{defect.level}
                    </Badge>
                    <Button
                      onClick={() => handleRemoveDefect(index)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {getFlickIndicator()}
      </DialogContent>
    </Dialog>
  );
}
