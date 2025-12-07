import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trophy, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { PartDefect } from './CarPartSelector';

interface EvaluationScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partDefects: PartDefect[];
}

interface EvaluationResult {
  totalScore: number;
  grade: string;
  exteriorGrade: string;
  interiorGrade: string;
  breakdown: {
    baseScore: number;
    defectPenalty: number;
    severityPenalty: number;
  };
}

const calculateScore = (partDefects: PartDefect[]): EvaluationResult => {
  // 基準点: 10.0点
  let baseScore = 10.0;

  // 瑕疵ごとのペナルティ
  let defectPenalty = 0;
  let severityPenalty = 0;

  partDefects.forEach(pd => {
    pd.defects.forEach(defect => {
      // 瑕疵タイプによるペナルティ
      const typeMultiplier: { [key: string]: number } = {
        'A': 0.1,  // 小傷
        'U': 0.3,  // 凹み
        'B': 0.2,  // バンパー傷
        'W': 0.5,  // 修理跡
        'S': 0.4,  // サビ
        'G': 0.2,  // ガラス傷
        'P': 0.3,  // 塗装剥がれ
        'X': 0.8,  // 交換歴
      };

      // レベルによるペナルティ倍率
      const levelMultiplier: { [key: string]: number } = {
        '1': 1.0,    // 軽微
        '2': 2.0,    // 中程度
        '3': 3.5,    // 重度
      };

      const basePenalty = typeMultiplier[defect.type] || 0.2;
      const levelFactor = levelMultiplier[defect.level] || 1.0;
      const penalty = basePenalty * levelFactor;

      if (defect.level === '3') {
        severityPenalty += penalty;
      } else {
        defectPenalty += penalty;
      }
    });
  });

  const totalScore = Math.max(1.0, Math.min(10.0, baseScore - defectPenalty - severityPenalty));

  // 評価点のグレード判定
  let grade = '';
  if (totalScore >= 9.5) grade = 'S';
  else if (totalScore >= 9.0) grade = '6';
  else if (totalScore >= 8.0) grade = '5';
  else if (totalScore >= 7.0) grade = '4.5';
  else if (totalScore >= 6.0) grade = '4';
  else if (totalScore >= 5.0) grade = '3.5';
  else if (totalScore >= 4.0) grade = '3';
  else if (totalScore >= 3.0) grade = '2';
  else if (totalScore >= 2.0) grade = 'R';
  else grade = 'RA';

  // 外装・内装グレード（簡易版）
  let exteriorGrade = 'A';
  let interiorGrade = 'A';

  const totalDefects = partDefects.reduce((sum, pd) => sum + pd.defects.length, 0);
  if (totalDefects >= 10) {
    exteriorGrade = 'D';
  } else if (totalDefects >= 6) {
    exteriorGrade = 'C';
  } else if (totalDefects >= 3) {
    exteriorGrade = 'B';
  }

  // 重度の瑕疵がある場合はグレードダウン
  const severeDefects = partDefects.reduce((sum, pd) => 
    sum + pd.defects.filter(d => d.level === '3').length, 0
  );
  if (severeDefects >= 2) {
    if (exteriorGrade === 'A') exteriorGrade = 'B';
    else if (exteriorGrade === 'B') exteriorGrade = 'C';
    else if (exteriorGrade === 'C') exteriorGrade = 'D';
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    grade,
    exteriorGrade,
    interiorGrade,
    breakdown: {
      baseScore,
      defectPenalty: Math.round(defectPenalty * 10) / 10,
      severityPenalty: Math.round(severityPenalty * 10) / 10,
    },
  };
};

export function EvaluationScoreDialog({
  open,
  onOpenChange,
  partDefects,
}: EvaluationScoreDialogProps) {
  const result = calculateScore(partDefects);
  const totalDefects = partDefects.reduce((sum, pd) => sum + pd.defects.length, 0);

  const getGradeColor = (grade: string): string => {
    if (grade === 'S' || grade === '6') return 'bg-yellow-500';
    if (grade === '5' || grade === '4.5') return 'bg-green-500';
    if (grade === '4' || grade === '3.5') return 'bg-blue-500';
    if (grade === '3') return 'bg-slate-500';
    if (grade === '2') return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreIcon = () => {
    if (result.totalScore >= 8.0) return <TrendingUp className="w-8 h-8 text-green-600" />;
    if (result.totalScore >= 6.0) return <Star className="w-8 h-8 text-blue-600" />;
    return <TrendingDown className="w-8 h-8 text-orange-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            評価点算出結果
          </DialogTitle>
          <DialogDescription>
            中古車オークション基準による評価
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* メイン評価点 */}
          <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {getScoreIcon()}
                <div>
                  <div className="text-6xl text-slate-900 mb-2">
                    {result.totalScore}
                  </div>
                  <Badge className={`${getGradeColor(result.grade)} text-white px-4 py-1 text-lg`}>
                    評価点: {result.grade}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 外装・内装グレード */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-sm text-slate-600 mb-2">外装</div>
                <Badge className="bg-blue-600 text-white text-2xl px-4 py-2">
                  {result.exteriorGrade}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-sm text-slate-600 mb-2">内装</div>
                <Badge className="bg-slate-600 text-white text-2xl px-4 py-2">
                  {result.interiorGrade}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* 評価内訳 */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <h4 className="text-sm text-slate-700">評価内訳</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">基準点</span>
                  <span className="text-lg text-green-600">+{result.breakdown.baseScore}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">瑕疵減点</span>
                  <span className="text-lg text-red-600">-{result.breakdown.defectPenalty}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">重度減点</span>
                  <span className="text-lg text-red-600">-{result.breakdown.severityPenalty}</span>
                </div>

                <div className="pt-3 border-t">
                  <Progress value={(result.totalScore / 10) * 100} className="h-3 mb-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">総合スコア</span>
                    <span className="text-2xl text-slate-900">
                      {result.totalScore} / 10.0
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

         
          {/* 評価基準の説明 */}
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <h4 className="text-xs text-slate-600 mb-2">評価基準</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>S, 6点:</span>
                  <span>極上車</span>
                </div>
                <div className="flex justify-between">
                  <span>5, 4.5点:</span>
                  <span>良好車</span>
                </div>
                <div className="flex justify-between">
                  <span>4, 3.5点:</span>
                  <span>標準車</span>
                </div>
                <div className="flex justify-between">
                  <span>3点以下:</span>
                  <span>要検討車</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
