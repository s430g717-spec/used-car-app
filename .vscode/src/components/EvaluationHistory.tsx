import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { EvaluationScore } from '../App';
import { History, Car, FileText, Receipt } from 'lucide-react';
import { useState } from 'react';
import { AppraisalOutputModal } from './AppraisalOutputModal';

interface EvaluationHistoryProps {
  history: EvaluationScore[];
  onViewReport?: (evaluation: EvaluationScore) => void;
  onViewInvoice?: (evaluation: EvaluationScore) => void;
  onQrCodeDisplay?: (evaluation: EvaluationScore) => void;
}

export function EvaluationHistory({ history, onViewReport, onViewInvoice, onQrCodeDisplay }: EvaluationHistoryProps) {
  const [appraisalModalOpen, setAppraisalModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationScore | null>(null);

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('S')) return 'bg-yellow-500';
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-slate-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleAppraisalClick = (evaluation: EvaluationScore) => {
    setSelectedEvaluation(evaluation);
    setAppraisalModalOpen(true);
  };

  const handlePdfDownload = () => {
    if (selectedEvaluation) {
      onViewReport?.(selectedEvaluation);
    }
  };

  const handleQrCodeDisplay = () => {
    if (selectedEvaluation) {
      onQrCodeDisplay?.(selectedEvaluation);
    }
  };

  const handleInvoiceClick = (evaluation: EvaluationScore) => {
    onViewInvoice?.(evaluation);
  };

  if (history.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="py-12 text-center">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">まだ在庫がありません</p>
          <p className="text-slate-400 text-sm mt-2">
            車両を評価すると、ここに在庫として表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            在庫管理
          </CardTitle>
          <CardDescription>登録済み車両の一覧と管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>評価日時</TableHead>
                  <TableHead>型式</TableHead>
                  <TableHead>車種</TableHead>
                  <TableHead>年式</TableHead>
                  <TableHead>走行距離</TableHead>
                  <TableHead>総合評価</TableHead>
                  <TableHead>内装評価</TableHead>
                  <TableHead>グレード</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((evaluation, index) => (
                  <TableRow 
                    key={index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell>
                      {new Date(evaluation.timestamp).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {evaluation.carData.modelType}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-slate-400" />
                        {evaluation.carData.model}
                      </div>
                    </TableCell>
                    <TableCell>{evaluation.carData.year}年</TableCell>
                    <TableCell>{evaluation.carData.mileage.toLocaleString()} km</TableCell>
                    <TableCell className="text-slate-900">
                      {evaluation.overallScore}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {evaluation.interiorScore}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getGradeColor(evaluation.grade)} text-white`}>
                        {evaluation.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppraisalClick(evaluation);
                          }}
                          className="bg-[#D9534F] hover:bg-[#C9443F] text-white transition-all hover:shadow-md active:scale-95"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          鑑定書
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvoiceClick(evaluation);
                          }}
                          className="bg-[#007AFF] hover:bg-[#0066DD] text-white transition-all hover:shadow-md active:scale-95"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          請求書
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Statistics */}
          {history.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl text-slate-900">
                    {history.length}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">総評価数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl text-slate-900">
                    {history[0]?.overallScore || '-'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">最新評価点</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl text-slate-900">
                    {Math.round(history.reduce((sum, e) => sum + e.referenceScore, 0) / history.length)}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">平均参考値</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <AppraisalOutputModal
        open={appraisalModalOpen}
        onOpenChange={setAppraisalModalOpen}
        onPdfDownload={handlePdfDownload}
        onQrCodeDisplay={handleQrCodeDisplay}
      />
    </>
  );
}