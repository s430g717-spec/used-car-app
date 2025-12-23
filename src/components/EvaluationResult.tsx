// @ts-nocheck
/** @jsxImportSource react */
import { EvaluationScore } from "../App"; // App.tsxの型定義をインポートすると仮定
// 必要なコンポーネントをインポート
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";

// 必要なpropsを定義
interface EvaluationResultProps {
  evaluation: EvaluationScore;
  onViewReport: () => void;
}

// 名前付きエクスポートを使用
export function EvaluationResult({
  evaluation,
  onViewReport,
}: EvaluationResultProps) {
  // エラー解消のため、一旦は最小限のUIを記述します。
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700 flex justify-between items-center">
          評価結果
          <Badge variant="score" className="text-lg px-3 py-1">
            {evaluation.overallScore}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table className="mb-4">
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold w-30">参考値 (点)</TableCell>
              <TableCell>{evaluation.referenceScore}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">内装評価</TableCell>
              <TableCell>{evaluation.interiorScore}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary">再評価</Button>
          <Button
            onClick={onViewReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            鑑定書を表示
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
